// ─── routes/usage.js ────────────────────────────────────────
// Power usage endpoint.
// GET /api/usage → total watts, per-room breakdown, daily kWh
// ─────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const usage = await db.getUsageSummary();

    res.json({
      totalPowerWatts: usage.totalPowerWatts,
      powerByRoom: usage.powerByRoom,
      estimatedDailyKWh: usage.estimatedDailyKWh,
      deviceCount: usage.deviceCount,
      devicesOn: usage.devicesOn,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('GET /api/usage error:', err.message);
    res.status(500).json({ error: 'Failed to fetch usage data' });
  }
});

// GET /api/usage/history → last 50 historical usage records
router.get('/history', async (req, res) => {
  try {
    const history = await db.getUsageHistory();
    res.json({
      history,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('GET /api/usage/history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch usage history' });
  }
});

module.exports = router;
