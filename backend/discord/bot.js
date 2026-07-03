// ─── discord/bot.js ─────────────────────────────────────────
// Discord bot for office monitoring. Pulls live data from
// the shared Turso database and uses Groq LLM for
// conversational responses.
//
// Commands: !status, !room <name>, !usage
// Bonus: Proactive alerts posted to a designated channel.
// ─────────────────────────────────────────────────────────────

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { env } = require('../envProxy');
const db = require('../db');
const { generateResponse, generateAlertMessage } = require('./llm');
const { getAlerts } = require('../routes/alerts');

let client = null;
let alertInterval = null;
let lastAlertIds = new Set(); // track sent alerts to avoid spam

/**
 * Start the Discord bot.
 */
async function startBot() {
  if (!env.DISCORD_TOKEN) {
    console.log('🤖 Discord bot skipped (DISCORD_TOKEN not set)');
    return;
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  // ─── Command Router ───────────────────────────────────
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const content = message.content.trim().toLowerCase();

    if (content === '!status') return handleStatus(message);
    if (content.startsWith('!room ')) return handleRoom(message, content.slice(6).trim());
    if (content === '!usage') return handleUsage(message);
    if (content === '!help') return handleHelp(message);
  });

  client.on('ready', () => {
    console.log(`🤖 Discord bot online as ${client.user.tag}`);

    // Start proactive alert checker (every 5 minutes)
    if (env.ALERT_CHANNEL_ID) {
      alertInterval = setInterval(checkAndPostAlerts, 5 * 60 * 1000);
      console.log(`🔔 Proactive alerts enabled → channel ${env.ALERT_CHANNEL_ID}`);
    }
  });

  try {
    await client.login(env.DISCORD_TOKEN);
  } catch (err) {
    console.error('❌ Discord bot login failed:', err.message);
  }
}

// ─── !status ────────────────────────────────────────────────
async function handleStatus(message) {
  try {
    const devices = await db.getAllDevices();
    const usage = await db.getUsageSummary();

    // Build raw data summary
    const rooms = {};
    for (const d of devices) {
      if (!rooms[d.room]) rooms[d.room] = { fans: { on: 0, total: 0 }, lights: { on: 0, total: 0 } };
      const cat = d.type === 'fan' ? 'fans' : 'lights';
      rooms[d.room][cat].total++;
      if (d.status === 'on') rooms[d.room][cat].on++;
    }

    let rawData = '';
    for (const [room, data] of Object.entries(rooms)) {
      rawData += `${room}: ${data.fans.on}/${data.fans.total} fans ON, ${data.lights.on}/${data.lights.total} lights ON\n`;
    }
    rawData += `Total power: ${usage.totalPowerWatts}W | Devices on: ${usage.devicesOn}/${usage.deviceCount}`;

    // Generate conversational response via LLM
    const response = await generateResponse(rawData, 'office status overview (!status)');

    const embed = new EmbedBuilder()
      .setTitle('🏢 Office Status')
      .setDescription(response)
      .setColor(usage.devicesOn > 12 ? 0xff4444 : usage.devicesOn > 6 ? 0xffaa00 : 0x44ff44)
      .setFooter({ text: `⚡ ${usage.totalPowerWatts}W • ${new Date().toLocaleTimeString()}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  } catch (err) {
    console.error('!status error:', err);
    message.reply('❌ Oops! Something went wrong fetching the status. Is the backend healthy?');
  }
}

// ─── !room <name> ───────────────────────────────────────────
async function handleRoom(message, roomArg) {
  try {
    const devices = await db.getDevicesByRoom(roomArg);

    if (devices.length === 0) {
      return message.reply('🤔 Hmm, I don\'t recognize that room! Try: `drawing`, `work1`, or `work2`');
    }

    const roomName = devices[0].room;
    let rawData = `Room: ${roomName}\n`;
    for (const d of devices) {
      const icon = d.type === 'fan' ? '🌀' : '💡';
      rawData += `${icon} ${d.name}: ${d.status.toUpperCase()} (${d.status === 'on' ? d.power_watt + 'W' : '0W'})\n`;
    }
    const totalPower = devices.reduce((s, d) => s + (d.status === 'on' ? d.power_watt : 0), 0);
    rawData += `Room power draw: ${totalPower}W`;

    const response = await generateResponse(rawData, `room details for ${roomName} (!room ${roomArg})`);

    const embed = new EmbedBuilder()
      .setTitle(`📍 ${roomName}`)
      .setDescription(response)
      .setColor(0x5865f2)
      .setFooter({ text: `⚡ ${totalPower}W • ${new Date().toLocaleTimeString()}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  } catch (err) {
    console.error('!room error:', err);
    message.reply('❌ Couldn\'t fetch that room. Try: `!room drawing`, `!room work1`, or `!room work2`');
  }
}

// ─── !usage ─────────────────────────────────────────────────
async function handleUsage(message) {
  try {
    const usage = await db.getUsageSummary();

    let rawData = `Total power right now: ${usage.totalPowerWatts}W\n`;
    rawData += `Today's estimated usage: ${usage.estimatedDailyKWh} kWh\n`;
    rawData += `Devices on: ${usage.devicesOn}/${usage.deviceCount}\n\nPer-room breakdown:\n`;
    for (const [room, watts] of Object.entries(usage.powerByRoom)) {
      rawData += `  ${room}: ${watts}W\n`;
    }

    const response = await generateResponse(rawData, 'power usage report (!usage)');

    const embed = new EmbedBuilder()
      .setTitle('⚡ Power Usage Report')
      .setDescription(response)
      .setColor(0xf59e0b)
      .setFooter({ text: new Date().toLocaleTimeString() })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  } catch (err) {
    console.error('!usage error:', err);
    message.reply('❌ Couldn\'t fetch usage data. Something went wrong!');
  }
}

// ─── !help ──────────────────────────────────────────────────
async function handleHelp(message) {
  const embed = new EmbedBuilder()
    .setTitle('🤖 Office Monitor Bot — Commands')
    .setDescription(
      '**!status** — Overview of all rooms and devices\n' +
      '**!room <name>** — Details for a specific room (`drawing`, `work1`, `work2`)\n' +
      '**!usage** — Current power consumption and daily estimate\n' +
      '**!help** — Show this help message'
    )
    .setColor(0x5865f2)
    .setFooter({ text: 'Powered by Groq AI ⚡' });

  message.reply({ embeds: [embed] });
}

// ─── Proactive Alerts (BONUS) ───────────────────────────────
async function checkAndPostAlerts() {
  try {
    const alerts = await getAlerts();
    if (alerts.length === 0) {
      lastAlertIds.clear();
      return;
    }

    const channel = client?.channels?.cache?.get(env.ALERT_CHANNEL_ID);
    if (!channel) return;

    for (const alert of alerts) {
      // Skip if we already posted this alert
      if (lastAlertIds.has(alert.id)) continue;

      const friendlyMessage = await generateAlertMessage(alert);
      const embed = new EmbedBuilder()
        .setTitle(alert.severity === 'critical' ? '🚨 Critical Alert' : '⚠️ Warning')
        .setDescription(friendlyMessage)
        .setColor(alert.severity === 'critical' ? 0xff0000 : 0xffaa00)
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      lastAlertIds.add(alert.id);
    }
  } catch (err) {
    console.error('Proactive alert check failed:', err.message);
  }
}

/**
 * Stop the Discord bot.
 */
function stopBot() {
  if (alertInterval) clearInterval(alertInterval);
  if (client) client.destroy();
  console.log('🤖 Discord bot stopped');
}

module.exports = { startBot, stopBot };
