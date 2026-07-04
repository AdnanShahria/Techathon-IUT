// ─── discord/llm.js ─────────────────────────────────────────
// Groq LLM wrapper for generating conversational Discord
// bot responses. Falls back to plain formatting if API is
// unavailable.
// ─────────────────────────────────────────────────────────────

const Groq = require('groq-sdk');
const { env } = require('../envProxy');
const db = require('../db');

let groqClient = null;

function getGroqClient() {
  if (groqClient) return groqClient;
  if (!env.GROQ_API_KEY) return null;

  groqClient = new Groq({ apiKey: env.GROQ_API_KEY });
  return groqClient;
}

const SYSTEM_PROMPT = `You are a friendly, witty office assistant bot named "OfficeBot" living in a Discord server. 
You help monitor the office's electrical devices (lights and fans across 3 rooms).
Your responses should be:
- Conversational and warm (the boss hates robotic data dumps)
- Use relevant emojis naturally
- Keep it concise (2-4 sentences max)
- Include the actual data/numbers in a human-friendly way
- Add a fun or helpful observation when appropriate
- Never make up data — only use what's provided
- All monetary/cost values MUST be in **Taka (Tk)** or **BDT** (e.g. "12.50 Tk" or "12.50 BDT"). NEVER use dollars ($), cents, or other currencies. The electricity rate is **9 Tk per Unit**.
- Always refer to electricity consumption using the word **Unit** or **Units** instead of "kWh" or "kilowatt-hour" (e.g., "10.3 Units").

The office has 3 rooms:
- Drawing Room (waiting area)
- Work Room 1 (employee workspace)
- Work Room 2 (employee workspace)
Each room has 2 fans (60W each) and 3 lights (15W each).
Office hours are 9 AM to 5 PM.`;

/**
 * Generate a conversational response using Groq LLM.
 * @param {string} dataPrompt - Raw data to make conversational
 * @param {string} commandContext - What command triggered this (status, room, usage)
 * @returns {string} Friendly formatted response
 */
async function generateResponse(dataPrompt, commandContext = '') {
  const client = getGroqClient();

  // Fallback if Groq is not configured
  if (!client) {
    return dataPrompt;
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `The user asked for: ${commandContext}\n\nHere's the raw data:\n${dataPrompt}\n\nGenerate a friendly, conversational Discord message with this information. Use emojis. Keep it under 200 words.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    return completion.choices[0]?.message?.content || dataPrompt;
  } catch (err) {
    console.error('Groq LLM error:', err.message);
    return dataPrompt; // fallback to plain data
  }
}

/**
 * Generate a proactive alert message.
 * @param {object} alert - Alert object from the alert engine
 * @returns {string} Friendly alert message
 */
async function generateAlertMessage(alert) {
  const client = getGroqClient();

  if (!client) {
    return alert.message;
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Generate a friendly but urgent alert message for Discord based on this alert:\n${JSON.stringify(alert)}\n\nMake it attention-grabbing but not scary. Use emojis. Keep it under 100 words.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    return completion.choices[0]?.message?.content || alert.message;
  } catch (err) {
    console.error('Groq alert LLM error:', err.message);
    return alert.message;
  }
}

/**
 * Interactive chat with function calling for device control
 */
async function generateInteractiveChat(userMessage) {
  const client = getGroqClient();
  if (!client) return "❌ Groq API is not configured.";

  try {
    const devices = await db.getAllDevices();
    const usage = await db.getUsageSummary();
    const dailyCost = await db.getDailyCostAccumulated();
    const sensors = await db.getLatestSensorData(); // Add sensor context
    const { getAlerts } = require('../routes/alerts');
    const alerts = await getAlerts();

    let deviceContext = "Current Devices (ID: Name - Room - Status):\n";
    for (const d of devices) {
      deviceContext += `${d.id}: ${d.name} - ${d.room} - ${d.status.toUpperCase()}\n`;
    }
    
    let usageContext = `\nCurrent Power Usage:\nTotal Power: ${usage.totalPowerWatts}W\nEstimated Daily: ${usage.estimatedDailyKWh} Units\nDevices ON: ${usage.devicesOn}/${usage.deviceCount}\nToday's Accumulated Cost: ${dailyCost.toFixed(2)} Tk\n`;
    
    let sensorContext = `\nLive Sensors:\n`;
    for (const [room, data] of Object.entries(sensors)) {
      sensorContext += `- ${room}: Fire/Smoke=${data.fire} (Danger >= 1024), CO2=${data.co2}ppm (Danger >= 800)\n`;
    }

    let alertsContext = alerts.length > 0 ? `\nActive Alerts:\n${alerts.map(a => `- ${a.message}`).join('\n')}\n` : '\nNo Active Alerts.\n';

    const messages = [
      { 
        role: 'system', 
        content: SYSTEM_PROMPT + '\n\n' + deviceContext + usageContext + sensorContext + alertsContext + '\n\nYou have access to tools to control devices. Use them if the user asks you to turn something on or off. If the user asks for status or usage, use the provided context to answer conversationally.' 
      },
      { role: 'user', content: userMessage }
    ];

    const tools = [
      {
        type: 'function',
        function: {
          name: 'set_device_status',
          description: 'Turn a specific device on or off.',
          parameters: {
            type: 'object',
            properties: {
              device_id: { type: 'integer', description: 'The ID of the device' },
              status: { type: 'string', enum: ['on', 'off'], description: 'The new status' }
            },
            required: ['device_id', 'status']
          }
        }
      }
    ];

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      tools,
      tool_choice: 'auto',
      max_tokens: 300,
    });

    const responseMessage = response.choices[0].message;

    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === 'set_device_status') {
          const args = JSON.parse(toolCall.function.arguments);
          const updated = await db.setDeviceStatus(args.device_id, args.status);
          
          if (updated) {
            messages.push(responseMessage);
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: 'set_device_status',
              content: `Success: Device ${updated.name} in ${updated.room} is now ${updated.status}.`
            });
          } else {
            messages.push(responseMessage);
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: 'set_device_status',
              content: `Error: Device ID ${args.device_id} not found.`
            });
          }
        }
      }
      
      // Get final response after tool call
      const finalResponse = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 300,
      });
      return finalResponse.choices[0].message.content;
    }

    return responseMessage.content;
  } catch (err) {
    console.error('Groq LLM interactive error:', err.message);
    return "❌ Sorry, my AI brain had a hiccup processing that.";
  }
}

module.exports = { generateResponse, generateAlertMessage, generateInteractiveChat };
