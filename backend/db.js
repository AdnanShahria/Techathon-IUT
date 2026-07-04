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
          (timestamp, total_power_watts, drawing_room_watts, work_room_1_watts, work_room_2_watts, devices_on)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      now,
      usage.totalPowerWatts,
      usage.powerByRoom['Drawing Room'] || 0,
      usage.powerByRoom['Work Room 1'] || 0,
      usage.powerByRoom['Work Room 2'] || 0,
      usage.devicesOn
    ]
  });
}

/**
 * Get usage history (last 50 records).
 */
async function getUsageHistory() {
  const client = getClient();
  const result = await client.execute('SELECT * FROM usage_history ORDER BY timestamp DESC LIMIT 50');
  return result.rows;
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
  logSensorData,
  getLatestSensorData,
};
