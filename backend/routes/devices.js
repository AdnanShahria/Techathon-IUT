// ─── routes/devices.js ──────────────────────────────────────
// Device status endpoints.
// GET /api/devices      → all 18 devices with status & power
// GET /api/devices/:room → devices for a specific room
// ─────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all devices
router.get('/', async (req, res) => {
  try {
    const devices = await db.getAllDevices();
    const usage = await db.getUsageSummary();

    res.json({
      devices,
      totalPower: usage.totalPowerWatts,
      powerByRoom: usage.powerByRoom,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('GET /api/devices error:', err.message);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Get devices by room
router.get('/:room', async (req, res) => {
  try {
    const devices = await db.getDevicesByRoom(req.params.room);

    if (devices.length === 0) {
      return res.status(404).json({
        error: `Room '${req.params.room}' not found. Try: drawing, work1, work2`,
      });
    }

    const totalPower = devices.reduce(
      (sum, d) => sum + (d.status === 'on' ? d.power_watt : 0),
      0
    );

    res.json({
      room: devices[0].room,
      devices,
      totalPower,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('GET /api/devices/:room error:', err.message);
    res.status(500).json({ error: 'Failed to fetch room devices' });
  }
});

// Toggle device
router.post('/:id/toggle', async (req, res) => {
  try {
    const updated = await db.toggleDevice(parseInt(req.params.id));
    if (!updated) {
      return res.status(404).json({ error: 'Device not found' });
    }

    await db.logUsageHistory(); // Log the new power state to DB

    const io = req.app.get('io');
    if (io) {
      const allDevices = await db.getAllDevices();
      const usage = await db.getUsageSummary();
      const { getAlerts } = require('./alerts');
      const alerts = await getAlerts();

      io.emit('deviceUpdate', {
        device: updated,
        allDevices,
        totalPower: usage.totalPowerWatts,
        powerByRoom: usage.powerByRoom,
        estimatedDailyKWh: usage.estimatedDailyKWh,
        alerts,
        timestamp: new Date().toISOString(),
      });
    }

    res.json(updated);
  } catch (err) {
    console.error('POST /api/devices/:id/toggle error:', err.message);
    res.status(500).json({ error: 'Failed to toggle device' });
  }
});

module.exports = router;
