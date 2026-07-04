// ─── db.js ──────────────────────────────────────────────────
// Turso (libSQL) database client with in-memory fallback.
// Creates the devices table and seeds 18 devices on first run.
// ─────────────────────────────────────────────────────────────

const { createClient } = require('@libsql/client');
const { env } = require('./envProxy');
const fs = require('fs');
const path = require('path');

let db;

/**
 * Initialize the database client.
 * Uses Turso if URL is configured, otherwise falls back to local SQLite file.
 */
function getClient() {
  if (db) return db;

  if (env.TURSO_DATABASE_URL && env.TURSO_AUTH_TOKEN) {
    db = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });
    console.log('📦 Connected to Turso database');
  } else {
    // Fallback: local SQLite file (works without Turso for local dev)
    db = createClient({
      url: 'file:./office.db',
    });
    console.log('📦 Using local SQLite database (office.db)');
  }

  return db;
}

/**
 * Create the devices table and seed initial data if empty.
 */
async function initDatabase() {
  const client = getClient();

  // Load schema from file
  const schemaPath = path.join(__dirname, 'database', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  // Execute schema statements
  const statements = schemaSql.split(';').filter(stmt => stmt.trim() !== '');
  for (const stmt of statements) {
    await client.execute(stmt);
  }

  // Check if already seeded
  const result = await client.execute('SELECT COUNT(*) as count FROM devices');
  const count = result.rows[0].count;

  if (count === 0) {
    await seedDevices(client);
  }

  console.log(`📊 Database ready — ${count > 0 ? count : 18} devices loaded`);
}

/**
 * Seed the 18 office devices (3 rooms × (2 fans + 3 lights)).
 */
async function seedDevices(client) {
  const rooms = ['Drawing Room', 'Work Room 1', 'Work Room 2'];
  const deviceTypes = [
    { type: 'fan', count: 2, powerWatt: 240 },
    { type: 'light', count: 3, powerWatt: 30 },
  ];

  let id = 1;
  const now = new Date().toISOString();

  for (const room of rooms) {
    for (const { type, count, powerWatt } of deviceTypes) {
      for (let i = 1; i <= count; i++) {
        const name = `${type.charAt(0).toUpperCase() + type.slice(1)} ${i}`;
        const status = Math.random() > 0.5 ? 'on' : 'off';

        await client.execute({
          sql: `INSERT INTO devices (id, name, type, room, status, power_watt, last_changed)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [id++, name, type, room, status, powerWatt, now],
        });
      }
    }
  }

  console.log('🌱 Seeded 15 devices across 3 rooms');
}

/**
 * Get all devices.
 */
async function getAllDevices() {
  const client = getClient();
  const result = await client.execute('SELECT * FROM devices ORDER BY room, type, id');
  return result.rows;
}

/**
 * Get devices filtered by room name.
 * Accepts flexible input: "work1", "Work Room 1", "workroom1", etc.
 */
async function getDevicesByRoom(roomInput) {
  const roomMap = {
    'drawingroom': 'Drawing Room',
    'drawing': 'Drawing Room',
    'workroom1': 'Work Room 1',
    'work1': 'Work Room 1',
    'workroom2': 'Work Room 2',
    'work2': 'Work Room 2',
  };

  const normalized = roomInput.toLowerCase().replace(/[\s-_]/g, '');
  const roomName = roomMap[normalized];

  if (!roomName) return [];

  const client = getClient();
  const result = await client.execute({
    sql: 'SELECT * FROM devices WHERE room = ? ORDER BY type, id',
    args: [roomName],
  });
  return result.rows;
}

/**
 * Toggle a device's status (on ↔ off).
 * @param {number} deviceId
 * @returns {object|null} Updated device or null if not found
 */
async function toggleDevice(deviceId) {
  const client = getClient();
  const now = new Date().toISOString();

  // Get current status
  const current = await client.execute({
    sql: 'SELECT * FROM devices WHERE id = ?',
    args: [deviceId],
  });

  if (current.rows.length === 0) return null;

  const device = current.rows[0];
  const newStatus = device.status === 'on' ? 'off' : 'on';

  await client.execute({
    sql: 'UPDATE devices SET status = ?, last_changed = ? WHERE id = ?',
    args: [newStatus, now, deviceId],
  });

  return { ...device, status: newStatus, last_changed: now };
}

/**
 * Get power usage summary.
 */
async function getUsageSummary() {
  const devices = await getAllDevices();
  const rooms = ['Drawing Room', 'Work Room 1', 'Work Room 2'];

  let totalPower = 0;
  const powerByRoom = {};

  for (const room of rooms) {
    powerByRoom[room] = 0;
  }

  for (const device of devices) {
    const draw = device.status === 'on' ? device.power_watt : 0;
    totalPower += draw;
    powerByRoom[device.room] = (powerByRoom[device.room] || 0) + draw;
  }

  // Estimate daily usage: current draw × 8 office hours
  const estimatedDailyKWh = Math.round((totalPower * 8) / 1000 * 10) / 10;

  return {
    totalPowerWatts: totalPower,
    powerByRoom,
    estimatedDailyKWh,
    deviceCount: devices.length,
    devicesOn: devices.filter(d => d.status === 'on').length,
  };
}

/**
 * Log current usage to history.
 */
async function logUsageHistory() {
  const usage = await getUsageSummary();
  const client = getClient();
  const now = new Date().toISOString();

  await client.execute({
    sql: `INSERT INTO usage_history 
          (timestamp, total_power_watts, drawing_room_watts, work_room_1_watts, work_room_2_watts, devices_on, cost)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      now,
      usage.totalPowerWatts,
      usage.powerByRoom['Drawing Room'] || 0,
      usage.powerByRoom['Work Room 1'] || 0,
      usage.powerByRoom['Work Room 2'] || 0,
      usage.devicesOn,
      (usage.totalPowerWatts / 1000) * 9 // Cost based on 9 tk/kWh
    ]
  });
}

/**
 * Get usage history (last 60 records) — used for Hourly tab.
 */
async function getUsageHistory() {
  const client = getClient();
  const result = await client.execute('SELECT * FROM usage_history ORDER BY timestamp DESC LIMIT 60');
  return result.rows;
}

/**
 * Get usage history aggregated by time range.
 * @param {'hourly'|'daily'|'weekly'|'monthly'|'yearly'} range
 * @returns Array of aggregated { bucket, avg_power, avg_cost, total_cost, avg_devices_on }
 */
async function getUsageHistoryByRange(range) {
  const client = getClient();

  let sql;
  switch (range) {
    case 'hourly':
      // Last 60 raw snapshots (most recent first)
      return (await client.execute(
        'SELECT * FROM usage_history ORDER BY timestamp DESC LIMIT 60'
      )).rows;

    case 'daily':
      // Last 24 h, bucketed into 30-min slots
      sql = `
        SELECT
          strftime('%Y-%m-%dT%H:', timestamp) ||
            CASE WHEN CAST(strftime('%M', timestamp) AS INTEGER) < 30 THEN '00' ELSE '30' END AS bucket,
          ROUND(AVG(total_power_watts))  AS avg_power,
          ROUND(AVG(drawing_room_watts)) AS drawing_room_watts,
          ROUND(AVG(work_room_1_watts))  AS work_room_1_watts,
          ROUND(AVG(work_room_2_watts))  AS work_room_2_watts,
          ROUND(AVG(devices_on))         AS avg_devices_on,
          ROUND(SUM(cost), 4)            AS total_cost,
          ROUND(AVG(cost), 4)            AS avg_cost
        FROM usage_history
        WHERE timestamp >= datetime('now', '-24 hours')
        GROUP BY bucket
        ORDER BY bucket ASC
      `;
      break;

    case 'weekly':
      // Last 7 days, bucketed by hour
      sql = `
        SELECT
          strftime('%Y-%m-%dT%H:00', timestamp) AS bucket,
          ROUND(AVG(total_power_watts))  AS avg_power,
          ROUND(AVG(drawing_room_watts)) AS drawing_room_watts,
          ROUND(AVG(work_room_1_watts))  AS work_room_1_watts,
          ROUND(AVG(work_room_2_watts))  AS work_room_2_watts,
          ROUND(AVG(devices_on))         AS avg_devices_on,
          ROUND(SUM(cost), 4)            AS total_cost,
          ROUND(AVG(cost), 4)            AS avg_cost
        FROM usage_history
        WHERE timestamp >= datetime('now', '-7 days')
        GROUP BY bucket
        ORDER BY bucket ASC
      `;
      break;

    case 'monthly':
      // Last 30 days, bucketed by 6-hour periods
      sql = `
        SELECT
          strftime('%Y-%m-%dT', timestamp) ||
            CASE
              WHEN CAST(strftime('%H', timestamp) AS INTEGER) < 6  THEN '00:00'
              WHEN CAST(strftime('%H', timestamp) AS INTEGER) < 12 THEN '06:00'
              WHEN CAST(strftime('%H', timestamp) AS INTEGER) < 18 THEN '12:00'
              ELSE '18:00'
            END AS bucket,
          ROUND(AVG(total_power_watts))  AS avg_power,
          ROUND(AVG(drawing_room_watts)) AS drawing_room_watts,
          ROUND(AVG(work_room_1_watts))  AS work_room_1_watts,
          ROUND(AVG(work_room_2_watts))  AS work_room_2_watts,
          ROUND(AVG(devices_on))         AS avg_devices_on,
          ROUND(SUM(cost), 4)            AS total_cost,
          ROUND(AVG(cost), 4)            AS avg_cost
        FROM usage_history
        WHERE timestamp >= datetime('now', '-30 days')
        GROUP BY bucket
        ORDER BY bucket ASC
      `;
      break;

    case 'yearly':
      // Last 365 days, bucketed by day
      sql = `
        SELECT
          strftime('%Y-%m-%d', timestamp) AS bucket,
          ROUND(AVG(total_power_watts))  AS avg_power,
          ROUND(AVG(drawing_room_watts)) AS drawing_room_watts,
          ROUND(AVG(work_room_1_watts))  AS work_room_1_watts,
          ROUND(AVG(work_room_2_watts))  AS work_room_2_watts,
          ROUND(AVG(devices_on))         AS avg_devices_on,
          ROUND(SUM(cost), 4)            AS total_cost,
          ROUND(AVG(cost), 4)            AS avg_cost
        FROM usage_history
        WHERE timestamp >= datetime('now', '-365 days')
        GROUP BY bucket
        ORDER BY bucket ASC
      `;
      break;

    default:
      return (await client.execute(
        'SELECT * FROM usage_history ORDER BY timestamp DESC LIMIT 60'
      )).rows;
  }

  const result = await client.execute(sql);
  return result.rows;
}

/**
 * Get total cost accumulated today (since midnight local time).
 * Used to seed the PowerMeter live bill ticker.
 */
async function getDailyCostAccumulated() {
  const client = getClient();
  // Use today's date in ISO format (UTC)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const result = await client.execute({
    sql: `SELECT COALESCE(SUM(cost), 0) AS daily_cost
          FROM usage_history
          WHERE timestamp >= ?`,
    args: [todayStart.toISOString()],
  });
  return parseFloat(result.rows[0].daily_cost) || 0;
}


/**
 * Log sensor data.
 */
async function logSensorData(room, fire, co2) {
  const client = getClient();
  const now = new Date().toISOString();
  await client.execute({
    sql: 'INSERT INTO sensors_history (timestamp, room, fire, co2) VALUES (?, ?, ?, ?)',
    args: [now, room, fire, co2],
  });
}

/**
 * Get latest sensor data per room.
 */
async function getLatestSensorData() {
  const client = getClient();
  const result = await client.execute(`
    SELECT a.room, a.fire, a.co2 
    FROM sensors_history a
    INNER JOIN (
      SELECT room, MAX(timestamp) as max_ts 
      FROM sensors_history 
      GROUP BY room
    ) b ON a.room = b.room AND a.timestamp = b.max_ts
  `);
  
  // Convert to object mapping room -> data
  const data = {};
  for (const row of result.rows) {
    data[row.room] = { fire: row.fire, co2: row.co2 };
  }
  return data;
}

/**
 * Set a device's explicit status (on/off).
 */
async function setDeviceStatus(deviceId, status) {
  const client = getClient();
  const now = new Date().toISOString();
  const current = await client.execute({
    sql: 'SELECT * FROM devices WHERE id = ?',
    args: [deviceId],
  });

  if (current.rows.length === 0) return null;
  const device = current.rows[0];

  await client.execute({
    sql: 'UPDATE devices SET status = ?, last_changed = ? WHERE id = ?',
    args: [status, now, deviceId],
  });

  return { ...device, status, last_changed: now };
}

module.exports = {
  getClient,
  initDatabase,
  getAllDevices,
  getDevicesByRoom,
  toggleDevice,
  setDeviceStatus,
  getUsageSummary,
  logUsageHistory,
  getUsageHistory,
  getUsageHistoryByRange,
  getDailyCostAccumulated,
  logSensorData,
  getLatestSensorData,
};
