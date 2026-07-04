const express = require('express');
const router = express.Router();
const db = require('../db');

// Rate limiting: we only process updates if they are new or if significant time has passed, but since ESP32 might send rapidly, we handle it gracefully.
// Note: ESP32 should be programmed to send updates every few seconds to stay within Render's 30/min limit.
router.post('/update', async (req, res) => {
  try {
    const { room, fire, co2 } = req.body;
    
    if (!room || fire === undefined || co2 === undefined) {
      return res.status(400).json({ error: 'Missing room, fire, or co2 values' });
    }

    // Log the sensor data to the history table for the specific room
    await db.logSensorData(room, fire, co2);

    // Check thresholds
    const isFireAlert = fire >= 1024;
    const isCo2Alert = co2 >= 800;

    let devicesUpdated = false;

    // Broadcast the new sensor data and device states
    const io = req.app.get('io');
    if (io) {
      const allDevices = await db.getAllDevices();
      const usage = await db.getUsageSummary();
      const { getAlerts } = require('./alerts');
      const alerts = await getAlerts();
      const sensors = await db.getLatestSensorData(); // gets all rooms now

      if (isFireAlert) {
        const fireAlert = { id: `alert-fire-${room}-${Date.now()}`, severity: 'critical', message: `🔥 FIRE DETECTED in ${room}! Sensor value: ${fire}.` };
        require('../discord/bot').postInstantAlert(fireAlert);
      }
      if (isCo2Alert) {
        const co2Alert = { id: `alert-co2-${room}-${Date.now()}`, severity: 'warning', message: `💨 High CO2 levels in ${room}! Sensor value: ${co2}.` };
        require('../discord/bot').postInstantAlert(co2Alert);
      }

      io.emit('deviceUpdate', {
        sensors,
        allDevices,
        totalPower: usage.totalPowerWatts,
        powerByRoom: usage.powerByRoom,
        estimatedDailyKWh: usage.estimatedDailyKWh,
        alerts,
        timestamp: new Date().toISOString(),
      });

      // Log usage to history and push live record
      await db.logUsageHistory();
      const now = new Date().toISOString();
      io.emit('usageHistoryUpdate', {
        record: {
          timestamp: now,
          total_power_watts: usage.totalPowerWatts,
          drawing_room_watts: usage.powerByRoom['Drawing Room'] || 0,
          work_room_1_watts: usage.powerByRoom['Work Room 1'] || 0,
          work_room_2_watts: usage.powerByRoom['Work Room 2'] || 0,
          devices_on: usage.devicesOn,
          cost: parseFloat(((usage.totalPowerWatts / 1000) * 9).toFixed(4)),
        },
        timestamp: now,
      });
    }

    res.json({ success: true, room, fire, co2, devicesUpdated });
  } catch (err) {
    console.error('POST /api/sensors/update error:', err.message);
    res.status(500).json({ error: 'Failed to update sensors' });
  }
});

router.get('/', async (req, res) => {
  try {
    const latest = await db.getLatestSensorData();
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

module.exports = router;
