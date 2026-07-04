require('dotenv').config({ path: '../.env' });
const { getClient, initDatabase } = require('../db');

async function resetDB() {
  try {
    const client = getClient();
    console.log('Connecting to DB...');
    
    // Drop existing tables
    await client.execute('DROP TABLE IF EXISTS devices');
    await client.execute('DROP TABLE IF EXISTS sensors_history');
    await client.execute('DROP TABLE IF EXISTS usage_history');
    console.log('Tables dropped.');
    
    // Re-initialize (this will recreate tables and run seedDevices)
    await initDatabase();
    
    console.log('Database reset complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error resetting database:', err);
    process.exit(1);
  }
}

resetDB();
