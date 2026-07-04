// ─── server.js ──────────────────────────────────────────────
// Main entry point. Express + Socket.IO server that:
//   - Serves the React frontend (production)
//   - Exposes REST API at /api/*
//   - Runs WebSocket for real-time dashboard updates
//   - Starts the device simulator
//   - Starts the Discord bot
// ─────────────────────────────────────────────────────────────

const { validate } = require('./envProxy');
const { env } = require('./envProxy');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const db = require('./db');
const { startSimulator, stopSimulator } = require('./simulator');
const { startBot, stopBot } = require('./discord/bot');

// ─── Validate Environment ──────────────────────────────────
validate();

const app = express();
const server = http.createServer(app);

// ─── Socket.IO ─────────────────────────────────────────────
// Allow any localhost port in dev (covers Vite on 5173, 5174, etc.)
const DEV_CORS_ORIGIN = /^http:\/\/localhost:\d+$/;

const io = new Server(server, {
  cors: {
    origin: env.NODE_ENV === 'production' ? false : DEV_CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});
app.set('io', io);

// ─── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: env.NODE_ENV === 'production' ? false : DEV_CORS_ORIGIN,
}));
app.use(express.json({ limit: '10mb' })); // for base64 image uploads via proxy

// ─── API Routes ────────────────────────────────────────────
app.use('/api/devices', require('./routes/devices'));
app.use('/api/usage', require('./routes/usage'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/proxy', require('./routes/proxy'));
app.use('/api/sensors', require('./routes/sensors'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── Serve Frontend (Production) ───────────────────────────
if (env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendPath));

  // SPA fallback — serve index.html for all non-API routes
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

console.log(`📁 Serving frontend from ${frontendPath}`);
}

// ─── WebSocket Events ──────────────────────────────────────
io.on('connection', async (socket) => {
  console.log(`🔌 Dashboard connected: ${socket.id}`);

  try {
    // Send initial state on connect
    const devices = await db.getAllDevices();
    const usage = await db.getUsageSummary();
    const { getAlerts } = require('./routes/alerts');
    const alerts = await getAlerts();
    const sensors = await db.getLatestSensorData();

    socket.emit('initialState', {
      devices,
      totalPower: usage.totalPowerWatts,
      powerByRoom: usage.powerByRoom,
      estimatedDailyKWh: usage.estimatedDailyKWh,
      devicesOn: usage.devicesOn,
      alerts,
      sensors,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('WebSocket initial state error:', err.message);
  }

  socket.on('disconnect', () => {
    console.log(`🔌 Dashboard disconnected: ${socket.id}`);
  });
});

// ─── Keep-Alive Self-Ping (Render Free Tier) ───────────────
// Render's free tier spins down after 15 min of inactivity.
// This self-ping hits /api/health every 10 min to keep it awake.
let keepAliveInterval = null;

function startKeepAlive(port) {
  if (env.NODE_ENV !== 'production') return;

  const KEEP_ALIVE_MS = 10 * 60 * 1000; // 10 minutes
  const url = `http://localhost:${port}/api/health`;

  keepAliveInterval = setInterval(async () => {
    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log(`💓 Keep-alive ping OK — uptime: ${Math.round(data.uptime)}s`);
    } catch (err) {
      console.error('💔 Keep-alive ping failed:', err.message);
    }
  }, KEEP_ALIVE_MS);

  console.log(`💓 Keep-alive enabled — pinging /api/health every 10 min`);
}

// ─── Start Everything ──────────────────────────────────────
async function start() {
  try {
    // 1. Initialize database
    await db.initDatabase();

    // 2. Start HTTP server
    const PORT = env.PORT;
    server.listen(PORT, () => {
      console.log(`\n🚀 Smart Office Monitor running on http://localhost:${PORT}`);
      console.log(`   API: http://localhost:${PORT}/api/devices`);
      console.log(`   Health: http://localhost:${PORT}/api/health\n`);
    });

    // 3. Start device simulator
    startSimulator(io);

    // 4. Start Discord bot
    await startBot();

    // 5. Start keep-alive self-ping (prevents Render free tier sleep)
    startKeepAlive(PORT);

  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }
}

// ─── Graceful Shutdown ─────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  stopSimulator();
  stopBot();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

start();
