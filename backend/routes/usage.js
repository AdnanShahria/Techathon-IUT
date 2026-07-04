// ─── routes/usage.js ────────────────────────────────────────
// Power usage endpoint.
// GET /api/usage             → total watts, per-room breakdown, daily kWh
// GET /api/usage/history     → last 60 raw records (Hourly)
// GET /api/usage/history?range=daily|weekly|monthly|yearly → aggregated
// GET /api/usage/daily-cost  → total Tk spent today (from DB)
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

// GET /api/usage/history?range=hourly|daily|weekly|monthly|yearly
// Returns real DB data aggregated per range tab
router.get('/history', async (req, res) => {
  try {
    const range = (req.query.range || 'hourly').toLowerCase();
    const validRanges = ['hourly', 'daily', 'weekly', 'monthly', 'yearly'];

    if (!validRanges.includes(range)) {
      return res.status(400).json({ error: `Invalid range. Use one of: ${validRanges.join(', ')}` });
    }

    const history = await db.getUsageHistoryByRange(range);

    res.json({
      range,
      history,
      count: history.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('GET /api/usage/history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch usage history' });
  }
});

// GET /api/usage/daily-cost
// Returns the total cost accumulated from DB since midnight (seeds PowerMeter)
router.get('/daily-cost', async (req, res) => {
  try {
    const dailyCost = await db.getDailyCostAccumulated();
    res.json({ dailyCost, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('GET /api/usage/daily-cost error:', err.message);
    res.status(500).json({ error: 'Failed to fetch daily cost' });
  }
});

module.exports = router;
