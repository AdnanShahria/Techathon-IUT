-- ─── devices table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  room TEXT NOT NULL,
  status TEXT DEFAULT 'off',
  power_watt INTEGER NOT NULL,
  last_changed TEXT NOT NULL
);

-- ─── usage_history table ─────────────────────────────────────
-- Keeps track of the total electricity usage over time.
-- Useful for generating charts or historical reports.
CREATE TABLE IF NOT EXISTS usage_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  total_power_watts INTEGER NOT NULL,
  drawing_room_watts INTEGER NOT NULL,
  work_room_1_watts INTEGER NOT NULL,
  work_room_2_watts INTEGER NOT NULL,
  devices_on INTEGER NOT NULL
);

-- ─── sensors_history table ───────────────────────────────────
-- Keeps track of Fire and CO2 sensor readings.
CREATE TABLE IF NOT EXISTS sensors_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  room TEXT NOT NULL,
  fire INTEGER NOT NULL,
  co2 INTEGER NOT NULL
);
