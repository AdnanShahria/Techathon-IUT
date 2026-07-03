// ─── discord/llm.js ─────────────────────────────────────────
// Groq LLM wrapper for generating conversational Discord
// bot responses. Falls back to plain formatting if API is
// unavailable.
// ─────────────────────────────────────────────────────────────

const Groq = require('groq-sdk');
const { env } = require('../envProxy');

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

module.exports = { generateResponse, generateAlertMessage };
