# 🏢 Smart Office Monitor

Real-time office device monitoring system with a web dashboard and Discord bot. Tracks 18 devices (fans & lights) across 3 rooms with live power analytics, alerts, and conversational AI.

![Architecture](diagrams/system-diagram.png)

## ✨ Features

- **📊 Real-time Dashboard** — Live device states, power meters, and alerts via WebSocket
- **🤖 Discord Bot** — `!status`, `!room`, `!usage` commands with AI-powered conversational responses
- **⚡ Power Analytics** — Total & per-room consumption with daily kWh estimates
- **🚨 Smart Alerts** — After-hours detection, high consumption warnings
- **🗺️ Floor Plan** — Interactive SVG top-view with glowing lights & spinning fans
- **🔐 Secure** — All API keys proxied through backend, never exposed to frontend

## 🏗️ Architecture

```
[Simulator] → [Turso DB] → [Express API + Socket.IO] → [React Dashboard]
                                      ↓
                              [Discord Bot + Groq LLM]
```

Single backend serves everything: REST API, WebSocket, device simulator, and Discord bot.

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express + Socket.IO |
| Database | Turso (libSQL) with local SQLite fallback |
| Discord | discord.js v14 |
| AI/LLM | Groq API (Llama 3.3 70B) |
| Deployment | Render.com |

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- Discord Bot Token ([create one](https://discord.com/developers/applications))
- Groq API Key ([get free key](https://console.groq.com))
- Turso Account (optional — falls back to local SQLite)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/Techathon-IUT.git
cd Techathon-IUT
npm run setup
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=4000
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
DISCORD_TOKEN=your-discord-bot-token
ALERT_CHANNEL_ID=your-channel-id
GROQ_API_KEY=your-groq-key
IMGBB_API_KEY=your-imgbb-key
```

### 3. Run (Development)

```bash
npm run dev
```

This starts both:
- **Backend** → http://localhost:4000 (API + WebSocket + Simulator + Discord Bot)
- **Frontend** → http://localhost:5173 (React dashboard with hot reload)

### 4. Run (Production)

```bash
npm run build    # Build React frontend
npm start        # Start Express (serves frontend + API)
```

## 📱 Discord Bot Commands

| Command | Description |
|---------|-------------|
| `!status` | Overview of all rooms and devices |
| `!room <name>` | Details for a specific room (`drawing`, `work1`, `work2`) |
| `!usage` | Current power consumption and daily estimate |
| `!help` | Show available commands |

**Bonus:** Bot proactively posts alerts when devices are left ON after hours.

## 📂 Project Structure

```
├── backend/
│   ├── server.js           # Express + Socket.IO entry point
│   ├── db.js               # Turso/SQLite database layer
│   ├── simulator.js        # Device state simulator
│   ├── envProxy.js         # Centralized env secrets
│   ├── routes/
│   │   ├── devices.js      # GET /api/devices
│   │   ├── usage.js        # GET /api/usage
│   │   ├── alerts.js       # GET /api/alerts
│   │   └── proxy.js        # /api/proxy/* (secret-safe proxying)
│   └── discord/
│       ├── bot.js          # Discord bot
│       └── llm.js          # Groq LLM wrapper
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main dashboard
│   │   ├── components/     # UI components
│   │   └── hooks/          # WebSocket hook
│   └── vite.config.js
├── diagrams/               # System diagram + circuit schematic
├── .env.example
├── render.yaml             # Render deployment config
└── README.md
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/devices` | GET | All 18 devices with status & power |
| `/api/devices/:room` | GET | Devices for a specific room |
| `/api/usage` | GET | Power consumption summary |
| `/api/alerts` | GET | Active anomaly alerts |
| `/api/health` | GET | Server health check |

## 🚢 Deployment (Render)

1. Push to GitHub
2. Connect repo to [Render.com](https://render.com)
3. Render auto-detects `render.yaml`
4. Add environment variables in Render dashboard
5. Deploy!

## 👥 Dummy Data (as required)

```json
[
  { "name": "Nafisa Rahman", "email": "nafisa.rahman@yahoo.com", "phone": "+8801812345678" },
  { "name": "Tanvir Hossain", "email": "tanvir.hossain@yahoo.com", "phone": "+8801912345678" }
]
```

## 📄 License

MIT