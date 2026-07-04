// ─── simulator.js ───────────────────────────────────────────
// Simulates real-world device state changes by randomly
// toggling devices every 5 seconds. Pushes updates via
// Socket.IO to all connected dashboard clients.
// Also logs each tick to usage_history and emits
// usageHistoryUpdate so HistoryPanel stays live.
// ─────────────────────────────────────────────────────────────

const db = require('./db');
const { getAlerts } = require('./routes/alerts');

let simulatorInterval = null;

/**
 * Start the device simulator.
 * @param {import('socket.io').Server} io - Socket.IO server instance
 */
function startSimulator(io) {
  if (simulatorInterval) return; // prevent double-start
  console.log('🔄 Device simulator started (5-second interval — live history updates)');

  async function tick() {
    try {
      const devices = await db.getAllDevices();
      if (devices.length === 0) return;

      // Fetch fresh state for broadcast
      const allDevices = await db.getAllDevices();
      const usage = await db.getUsageSummary();
      const alerts = await getAlerts();
      const now = new Date().toISOString();

      // Log to usage_history in DB
      await db.logUsageHistory();

      // Build latest history record to push live to frontend
      const latestRecord = {
        timestamp: now,
        total_power_watts: usage.totalPowerWatts,
        drawing_room_watts: usage.powerByRoom['Drawing Room'] || 0,
        work_room_1_watts: usage.powerByRoom['Work Room 1'] || 0,
        work_room_2_watts: usage.powerByRoom['Work Room 2'] || 0,
        devices_on: usage.devicesOn,
        cost: parseFloat(((usage.totalPowerWatts / 1000) * 9 * (5 / 3600)).toFixed(4)),
      };

      // Push live history record so HistoryPanel appends it without re-fetching
      io.emit('usageHistoryUpdate', {
        record: latestRecord,
        timestamp: now,
      });

    } catch (err) {
      console.error('Simulator error:', err.message);
    }
  }

  // Run every 5 seconds
  simulatorInterval = setInterval(tick, 5000);
}

/**
 * Stop the simulator (for clean shutdown).
 */
function stopSimulator() {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    console.log('🛑 Device simulator stopped');
  }
}

module.exports = { startSimulator, stopSimulator };
