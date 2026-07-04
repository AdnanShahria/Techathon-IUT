// ─── simulator.js ───────────────────────────────────────────
// Simulates real-world device state changes by randomly
// toggling devices every 5-10 seconds. Pushes updates via
// Socket.IO to all connected dashboard clients.
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

  console.log('🔄 Device simulator started (toggling every 5-10s)');

  async function tick() {
    try {
      const devices = await db.getAllDevices();
      if (devices.length === 0) return;

      // Pick a random device to toggle
      const randomDevice = devices[Math.floor(Math.random() * devices.length)];
      const updated = await db.toggleDevice(randomDevice.id);

      if (!updated) return;

      // Fetch fresh state for broadcast
      const allDevices = await db.getAllDevices();
      const usage = await db.getUsageSummary();
      const alerts = await getAlerts();

      // Push to all connected WebSocket clients
      io.emit('deviceUpdate', {
        device: updated,
        allDevices,
        totalPower: usage.totalPowerWatts,
        powerByRoom: usage.powerByRoom,
        estimatedDailyKWh: usage.estimatedDailyKWh,
        alerts,
        timestamp: new Date().toISOString(),
      });

      // Log to usage history
      await db.logUsageHistory();

      console.log(
        `  ⚡ ${updated.name} (${updated.room}) → ${updated.status.toUpperCase()}`
      );
    } catch (err) {
      console.error('Simulator error:', err.message);
    }
  }

  // Simulator disabled: Using real hardware (ESP32) data now.
  // simulatorInterval = setTimeout(tick, 3000);
}

/**
 * Stop the simulator (for clean shutdown).
 */
function stopSimulator() {
  if (simulatorInterval) {
    clearTimeout(simulatorInterval);
    simulatorInterval = null;
    console.log('🛑 Device simulator stopped');
  }
}

module.exports = { startSimulator, stopSimulator };
