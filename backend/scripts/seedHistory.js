// ─── scripts/seedHistory.js ──────────────────────────────────
// Seeds the usage_history table with realistic test data:
//   • Last 7 days  → one record every 5 minutes (for Hourly/Daily tabs)
//   • Last 30 days → one record per hour        (for Weekly/Monthly tabs)
//   • Last 365 days→ one record per 6 hours     (for Yearly tab)
// Realistic load: higher wattage during office hours (9 AM-6 PM),
//                 lower at night, noise added for realism.
// Run: node backend/scripts/seedHistory.js
// ─────────────────────────────────────────────────────────────

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { createClient } = require('@libsql/client');

// ─── Config ──────────────────────────────────────────────────
const TURSO_URL   = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

const RATE_TK_PER_KWH = 9; // 9 Tk per kWh (Bangladesh electricity rate)

// Device power map (from db.js seed)
// 3 rooms × (2 fans @240W + 3 lights @30W) = 15 devices total
// Max total: 3 × (480 + 90) = 1710W
const ROOMS = {
  'Drawing Room': { fans: 2, lights: 3, fanW: 240, lightW: 30 },
  'Work Room 1':  { fans: 2, lights: 3, fanW: 240, lightW: 30 },
  'Work Room 2':  { fans: 2, lights: 3, fanW: 240, lightW: 30 },
};

// ─── Noise helper ─────────────────────────────────────────────
function jitter(base, pct = 0.15) {
  return base + (Math.random() - 0.5) * 2 * base * pct;
}

// ─── Simulate realistic power for a given Date ────────────────
function simulatePower(dt, intervalMs) {
  const hour = dt.getHours();
  const dayOfWeek = dt.getDay(); // 0=Sun, 6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Base load fraction by hour (0.0–1.0)
  let loadFraction;
  if (isWeekend) {
    loadFraction = hour >= 10 && hour < 17 ? 0.35 : 0.05;
  } else if (hour >= 9 && hour < 18) {
    // Peak office hours
    loadFraction = hour >= 12 && hour < 14 ? 0.60 : 0.85; // lunch dip
  } else if (hour >= 7 && hour < 9) {
    loadFraction = 0.45; // morning warm-up
  } else if (hour >= 18 && hour < 20) {
    loadFraction = 0.40; // evening wrap-up
  } else {
    loadFraction = 0.05; // overnight skeleton load
  }

  const powerByRoom = {};
  let totalPower = 0;
  let devicesOn  = 0;

  for (const [room, cfg] of Object.entries(ROOMS)) {
    let roomPower = 0;

    // Fans
    for (let f = 0; f < cfg.fans; f++) {
      if (Math.random() < loadFraction) {
        roomPower += jitter(cfg.fanW);
        devicesOn++;
      }
    }
    // Lights
    for (let l = 0; l < cfg.lights; l++) {
      if (Math.random() < loadFraction) {
        roomPower += jitter(cfg.lightW);
        devicesOn++;
      }
    }

    powerByRoom[room] = Math.round(roomPower);
    totalPower += roomPower;
  }

  totalPower = Math.round(totalPower);
  const intervalHours = intervalMs / 3600000;
  const cost = parseFloat(((totalPower / 1000) * RATE_TK_PER_KWH * intervalHours).toFixed(4));

  return {
    timestamp: dt.toISOString(),
    total_power_watts: totalPower,
    drawing_room_watts: powerByRoom['Drawing Room'],
    work_room_1_watts: powerByRoom['Work Room 1'],
    work_room_2_watts: powerByRoom['Work Room 2'],
    devices_on: devicesOn,
    cost,
  };
}

// ─── Generate time series ──────────────────────────────────────
function generateSeries(startMs, endMs, stepMs) {
  const records = [];
  for (let t = startMs; t <= endMs; t += stepMs) {
    records.push(simulatePower(new Date(t), stepMs));
  }
  return records;
}

// ─── Batch insert helper ───────────────────────────────────────
async function batchInsert(client, records) {
  const CHUNK = 100;
  let inserted = 0;
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    const statements = chunk.map((r) => ({
      sql: `INSERT INTO usage_history
              (timestamp, total_power_watts, drawing_room_watts,
               work_room_1_watts, work_room_2_watts, devices_on, cost)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        r.timestamp,
        r.total_power_watts,
        r.drawing_room_watts,
        r.work_room_1_watts,
        r.work_room_2_watts,
        r.devices_on,
        r.cost,
      ],
    }));
    await client.batch(statements, 'write');
    inserted += chunk.length;
    process.stdout.write(`\r  Inserted ${inserted}/${records.length} records...`);
  }
  console.log('');
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 Starting usage_history seed...\n');

  if (!TURSO_URL || !TURSO_TOKEN) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env');
    process.exit(1);
  }

  const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  // Ensure table exists
  await client.execute(`
    CREATE TABLE IF NOT EXISTS usage_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      total_power_watts INTEGER NOT NULL,
      drawing_room_watts INTEGER NOT NULL,
      work_room_1_watts INTEGER NOT NULL,
      work_room_2_watts INTEGER NOT NULL,
      devices_on INTEGER NOT NULL,
      cost REAL NOT NULL
    )
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_usage_history_timestamp ON usage_history(timestamp)
  `);

  // Clear existing history
  console.log('🗑️  Clearing existing usage_history...');
  await client.execute('DELETE FROM usage_history');
  console.log('✅ Cleared.\n');

  const now    = Date.now();
  const MIN5   = 5   * 60 * 1000;
  const HOUR   = 60  * 60 * 1000;
  const HOUR6  = 6   * HOUR;

  // ── Segment 1: Last 7 days @ 5-min intervals (for Hourly + Daily tabs)
  const seg1Start = now - 7 * 24 * HOUR;
  console.log('📊 Generating last 7 days @ 5-min intervals...');
  const seg1 = generateSeries(seg1Start, now, MIN5);
  console.log(`   Generated ${seg1.length} records`);
  await batchInsert(client, seg1);

  // ── Segment 2: Days 8–30 @ 1-hour intervals (for Weekly/Monthly tabs)
  const seg2End   = seg1Start - MIN5;
  const seg2Start = now - 30 * 24 * HOUR;
  console.log('📊 Generating days 8-30 @ 1-hour intervals...');
  const seg2 = generateSeries(seg2Start, seg2End, HOUR);
  console.log(`   Generated ${seg2.length} records`);
  await batchInsert(client, seg2);

  // ── Segment 3: Days 31–365 @ 6-hour intervals (for Yearly tab)
  const seg3End   = seg2Start - HOUR;
  const seg3Start = now - 365 * 24 * HOUR;
  console.log('📊 Generating days 31-365 @ 6-hour intervals...');
  const seg3 = generateSeries(seg3Start, seg3End, HOUR6);
  console.log(`   Generated ${seg3.length} records`);
  await batchInsert(client, seg3);

  // Final count
  const countResult = await client.execute('SELECT COUNT(*) as cnt FROM usage_history');
  const total = countResult.rows[0].cnt;
  console.log(`\n✅ Seed complete! Total records in usage_history: ${total}`);
  console.log('   → Hourly tab : last 60 records (~5 hours of 5-min snapshots)');
  console.log('   → Daily tab  : last 24h aggregated to 30-min buckets');
  console.log('   → Weekly tab : last 7d aggregated to 1-hour buckets');
  console.log('   → Monthly tab: last 30d aggregated to 6-hour buckets');
  console.log('   → Yearly tab : last 365d aggregated to daily buckets\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
