// ─── routes/alerts.js ───────────────────────────────────────
// Alert detection engine.
// GET /api/alerts → active anomaly alerts (after-hours, long-on)
// ─────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * Generate alerts based on current device states.
 * Alert conditions:
 *   1. Devices ON after office hours (before 9 AM or after 5 PM)
 *   2. All devices in a room ON for 2+ hours continuously
 */
async function getAlerts() {
  const devices = await db.getAllDevices();
  const alerts = [];
  const now = new Date();
  const currentHour = now.getHours();
  const isAfterHours = currentHour < 9 || currentHour >= 17;

  // ─── Alert 1: After-hours devices ──────────────────────
  if (isAfterHours) {
    const onDevices = devices.filter(d => d.status === 'on');
    if (onDevices.length > 0) {
      // Group by room
      const roomGroups = {};
      for (const d of onDevices) {
        if (!roomGroups[d.room]) roomGroups[d.room] = [];
        roomGroups[d.room].push(d);
      }

      for (const [room, roomDevices] of Object.entries(roomGroups)) {
        const fans = roomDevices.filter(d => d.type === 'fan').length;
        const lights = roomDevices.filter(d => d.type === 'light').length;
        const parts = [];
        if (fans > 0) parts.push(`${fans} fan${fans > 1 ? 's' : ''}`);
        if (lights > 0) parts.push(`${lights} light${lights > 1 ? 's' : ''}`);

        alerts.push({
          id: `afterhours-${room.replace(/\s/g, '-').toLowerCase()}`,
          type: 'after-hours',
          severity: 'warning',
          message: `⚠️ ${room} still has ${parts.join(' and ')} ON and it's ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}. Did someone forget to leave?`,
          room,
          deviceCount: roomDevices.length,
          timestamp: now.toISOString(),
        });
      }
    }
  }

  // ─── Alert 2: All devices in a room ON for 2+ hours ───
  const rooms = ['Drawing Room', 'Work Room 1', 'Work Room 2'];
  for (const room of rooms) {
    const roomDevices = devices.filter(d => d.room === room);
    const allOn = roomDevices.length > 0 && roomDevices.every(d => d.status === 'on');

    if (allOn) {
      // Find the earliest lastChanged — that's how long "all on" has been true
      const oldestChange = roomDevices.reduce((min, d) => {
        const t = new Date(d.last_changed);
        return t < min ? t : min;
      }, new Date());

      const hoursOn = (now - oldestChange) / (1000 * 60 * 60);

      if (hoursOn >= 2) {
        alerts.push({
          id: `allon-${room.replace(/\s/g, '-').toLowerCase()}`,
          type: 'all-devices-on',
          severity: 'critical',
          message: `🔴 All devices in ${room} have been ON for ${Math.round(hoursOn * 10) / 10} hours continuously!`,
          room,
          hoursOn: Math.round(hoursOn * 10) / 10,
          timestamp: now.toISOString(),
        });
      }
    }
  }

  // ─── Alert 3: High power consumption ──────────────────
  const usage = await db.getUsageSummary();
  if (usage.totalPowerWatts > 400) {
    alerts.push({
      id: 'high-power',
      type: 'high-power',
      severity: 'info',
      message: `⚡ Office is drawing ${usage.totalPowerWatts}W right now — that's above the 400W threshold.`,
      totalPower: usage.totalPowerWatts,
      timestamp: now.toISOString(),
    });
  }

  // ─── Alert 4: Fire & CO2 Sensors ──────────────────────
  const sensors = await db.getLatestSensorData();
  for (const [room, data] of Object.entries(sensors)) {
    if (data.fire >= 1024) {
      alerts.push({
        id: `alert-fire-${room.replace(/\s/g, '-').toLowerCase()}`,
        type: 'fire-alert',
        severity: 'critical',
        message: `🔥 FIRE DETECTED in ${room}! Sensor value: ${data.fire}.`,
        room,
        timestamp: now.toISOString(),
      });
    }
    if (data.co2 >= 800) {
      alerts.push({
        id: `alert-co2-${room.replace(/\s/g, '-').toLowerCase()}`,
        type: 'co2-alert',
        severity: 'warning',
        message: `💨 High CO2 levels in ${room}! Sensor value: ${data.co2}ppm.`,
        room,
        timestamp: now.toISOString(),
      });
    }
  }

  return alerts;
}

// REST endpoint
router.get('/', async (req, res) => {
  try {
    const alerts = await getAlerts();
    res.json({ alerts, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('GET /api/alerts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

module.exports = router;
module.exports.getAlerts = getAlerts;
