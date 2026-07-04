<![CDATA[<div align="center">

# 🏆 Smart Office Monitor

### Techathon-IUT — Real-Time Office Device Monitoring System

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-smart--office--monitor-00C853?style=for-the-badge&logo=render&logoColor=white)](https://smart-office-monitor.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org)
[![Turso](https://img.shields.io/badge/Turso-libSQL-4FF8D2?style=for-the-badge&logo=turso&logoColor=black)](https://turso.tech)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

> A full-stack, real-time office monitoring system that tracks **18 devices** (6 fans, 9 lights & 3 smart sensors) across **3 rooms** with a live web dashboard, AI-powered Discord bot, interactive floor plan, fire/CO₂ monitoring, and power cost analytics — all powered by a **single backend** as the one source of truth.

</div>

---

## 📑 Table of Contents

- [Problem Statement](#-problem-statement)
- [Why 18 Devices? Our Smart Approach](#-why-18-devices-our-smart-approach)
- [Features](#-features)
- [Architecture & Data Flow](#️-architecture--data-flow)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start (Local Development)](#-quick-start-local-development)
- [Environment Variables](#-environment-variables)
- [Database Schema](#️-database-schema)
- [API Reference](#-api-reference)
- [WebSocket Events](#-websocket-events)
- [Frontend Dashboard](#-frontend-dashboard)
- [Discord Bot](#-discord-bot)
- [AI Integration (Groq LLM)](#-ai-integration-groq-llm)
- [Device Simulator](#-device-simulator)
- [Sensor Simulation](#-sensor-simulation)
- [Alert Engine](#-alert-engine)
- [Power Analytics & Cost Calculation](#-power-analytics--cost-calculation)
- [Usage History & Seeding](#-usage-history--seeding)
- [Security Architecture](#-security-architecture)
- [Hardware Schematic](#-hardware-schematic-wokwitinkercad)
- [Deployment Guide (Render)](#-deployment-guide-render)
- [NPM Scripts Reference](#-npm-scripts-reference)
- [Dummy Data](#-dummy-data-as-required)
- [License](#-license)

---

## 📋 Problem Statement

Build a **Smart Office Monitoring System** that tracks lights & fans across 3 rooms (**18 devices** total) via:

| # | Deliverable | Weight |
|---|-------------|--------|
| 1 | **System Diagram** — full data-flow architecture | 15% |
| 2 | **Hardware Schematic** — Wokwi/Tinkercad circuit for 1 room | 15% |
| 3 | **Simulated Device Data** — dynamic dummy data for all 18 devices | 15% |
| 4 | **Web Dashboard** — real-time UI with live status, power meter, alerts | 20% + 10% UX |
| 5 | **Discord Bot** — `!status`, `!room <name>`, `!usage` commands pulling live data | 10% |
| 6 | **Clean Codebase & Docs** | 15% |

**Key Constraint:** Dashboard + Discord Bot share a **single backend** (one source of truth).

---

## 💡 Why 18 Devices? Our Smart Approach

> [!IMPORTANT]
> The problem statement specifies **9 lights + 6 fans = 15 devices**, but requires tracking **18 devices total**. We identified this gap and filled it with **3 smart IoT sensors** — one per room — making the system smarter and more realistic.

### The Math

| Device Type | Count | Per Room |
|-------------|-------|----------|
| 🌀 Ceiling Fans | 6 | 2 per room |
| 💡 Lights | 9 | 3 per room |
| 🔥 Fire/Smoke + CO₂ Sensors | **3** | **1 per room** |
| **Total** | **18** | **6 per room** |

### Why Sensors?

Instead of adding arbitrary devices, we chose to add **Fire/Smoke (MQ-2) and CO₂ (MQ-135) monitoring sensors** to each room because:

1. **Safety-Critical** — Real smart offices need fire and air quality monitoring. This makes our solution production-realistic.
2. **Full IoT Pipeline** — Sensors demonstrate a complete IoT data pipeline: hardware → HTTP POST → database → WebSocket → dashboard + Discord alerts.
3. **ESP32 Integration** — The sensors connect to our **ESP32 microcontroller** which has built-in **WiFi and Bluetooth** connectivity, enabling:
   - **WiFi** → HTTP POST to `POST /api/sensors/update` for real-time cloud reporting
   - **Bluetooth** → Local device management and configuration
4. **Live Alerts** — When thresholds are crossed (Fire ≥ 1024, CO₂ ≥ 800ppm), instant alerts fire on both the dashboard and Discord simultaneously.
5. **Simulation UI** — We built a dedicated **Sensor Activity Testing** panel in the dashboard so judges can test fire/CO₂ alerts live without needing physical hardware.

### Why ESP32?

> [!TIP]
> We chose the **ESP32** over Arduino Uno/Nano because it has **built-in WiFi + Bluetooth** — no extra shields needed. This makes it perfect for IoT applications where devices need to communicate with a cloud backend over HTTP.

| Feature | Arduino Uno | ESP32 (Our Choice) |
|---------|-------------|--------------------|
| WiFi | ❌ Needs shield | ✅ Built-in |
| Bluetooth | ❌ Needs module | ✅ Built-in (BLE + Classic) |
| ADC Channels | 6 (10-bit) | 18 (12-bit) |
| CPU | 16 MHz single-core | 240 MHz dual-core |
| RAM | 2 KB | 520 KB |
| Price | ~$5 | ~$4 |
| Cloud Communication | Complex | Native HTTP/HTTPS |

---

## ✨ Features

### 🖥️ Web Dashboard
- **📊 Real-time Device Status** — Live ON/OFF states for all 18 devices (15 controllable + 3 sensors) across 3 rooms, updated instantly via WebSocket
- **🌑 Premium Dark Theme** — Sleek dark UI designed for better visibility, reduced eye strain during extended monitoring, and a modern premium feel with glassmorphism effects, CSS custom properties, and smooth micro-animations
- **🔘 Interactive Device Controls** — Click any device icon to toggle it ON/OFF with optimistic UI updates and server-side persistence
- **⚡ Power Consumption Meter** — Total wattage display with per-room progress bars showing percentage of max capacity (570W per room)
- **💰 Live Daily Cost Ticker** — Real-time ticking cost counter seeded from actual database-accumulated cost, calculated at 9 Tk/kWh (Bangladesh electricity rate)
- **📈 Power Usage History** — Full-featured charting panel with 5 time ranges (Hourly/Daily/Weekly/Monthly/Yearly), powered by real DB aggregations
- **🗺️ Interactive SVG Floor Plan** — Architectural top-view of the office with glowing lights, realistically spinning 3-blade ceiling fans, desks with monitors, chairs, sofas, plants, and doorways
- **🚨 Smart Alert System** — After-hours detection, high power warnings, continuous usage alerts, fire/CO₂ sensor alerts with dismiss/restore functionality
- **🔥 Sensor Activity Simulation** — Interactive UI panel to test Fire/Smoke and CO₂ sensors with sliders, triggering instant WebSocket broadcasts and Discord alerts
- **🔍 Zoom Modal** — Expand the history chart into a full-screen modal for detailed analysis
- **📱 Responsive Design** — Mobile-first layout with collapsible room cards, adaptive range buttons, and overflow menus
- **🕐 Live Clock** — Real-time clock with date display in the header

### 🤖 Discord Bot
- **`!status`** — AI-generated overview of all rooms and devices with color-coded embeds
- **`!room <name>`** — Detailed breakdown for a specific room (`drawing`, `work1`, `work2`)
- **`!usage`** — Current power consumption and daily estimate with per-room breakdown
- **`!help`** — Show all available commands
- **🧠 Autonomous AI Control** — Natural language device control via Groq Tool Calling (e.g., *"turn off lights in the drawing room"*)
- **🔔 Proactive Alerts** — Automatically posts critical alerts (fire, CO₂, after-hours) to a designated Discord channel every 5 minutes
- **⚡ Instant Sensor Alerts** — Fire and CO₂ alerts are pushed to Discord immediately when triggered from the sensor simulation UI

### 🧠 AI-Powered (Groq — The Fastest LLM API)

> [!TIP]
> We chose **Groq** over OpenAI/Gemini because Groq's custom LPU hardware delivers **~500 tokens/second** — up to **18× faster** than GPT-4. This means Discord bot responses arrive in under 1 second, making the experience feel instant and natural.

- **Conversational Responses** — All bot commands return warm, emoji-rich, human-friendly messages generated by Groq LLM (Llama 3.3 70B Versatile)
- **Function Calling (Tool Use)** — The AI can autonomously call `set_device_status` tools to control devices based on natural language instructions (e.g., *"turn off all fans"*)
- **Context-Aware** — The AI receives full device state, usage data, sensor readings, and active alerts as context for every interaction
- **Graceful Fallback** — If Groq API is unavailable, the bot falls back to raw data display without crashing
- **Free Tier Friendly** — Groq offers generous free API limits, making it perfect for hackathon projects

### 🔐 Security
- **API Key Proxying** — All external API keys (Groq, imgbb) are proxied through backend routes, never exposed to the frontend
- **Environment Validation** — Startup validates all env vars and logs warnings for missing ones without crashing
- **CORS Protection** — Strict CORS in production (disabled), regex-based localhost matching in development

---

## 🏗️ Architecture & Data Flow

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SMART OFFICE MONITOR                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌────────────────────────┐     ┌──────────────┐  │
│  │  Simulated   │     │                        │     │    React     │  │
│  │  Device Layer│────▶│   Node.js / Express    │────▶│  Dashboard   │  │
│  │  (simulator) │     │   Backend API Server   │     │  (Vite SPA)  │  │
│  └──────────────┘     │                        │     │  WebSocket   │  │
│                       │   ┌────────────────┐   │     └──────────────┘  │
│  ┌──────────────┐     │   │   Turso DB     │   │                       │
│  │  ESP32 / IoT │────▶│   │  (libSQL)      │   │     ┌──────────────┐  │
│  │  Sensors     │     │   │  with SQLite   │   │────▶│  Discord Bot │  │
│  │  (optional)  │     │   │  fallback      │   │     │ (discord.js) │  │
│  └──────────────┘     │   └────────────────┘   │     │ + Groq LLM   │  │
│                       │                        │     └──────────────┘  │
│                       │   ┌────────────────┐   │                       │
│                       │   │  Groq API      │   │     ┌──────────────┐  │
│                       │   │  (Llama 3.3)   │   │────▶│  imgbb Proxy │  │
│                       │   └────────────────┘   │     └──────────────┘  │
│                       └────────────────────────┘                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Simulator (5-second interval tick)
    │
    ▼
Turso Database / In-Memory Store (single source of truth)
    │
    ├──▶ REST API (/api/devices, /api/usage, /api/alerts, /api/sensors)
    │       │
    │       ├──▶ Discord Bot (reads DB directly for !commands)
    │       └──▶ Dashboard (initial HTTP load + daily-cost seed)
    │
    ├──▶ WebSocket (Socket.IO)
    │       │
    │       ├──▶ 'initialState'         → Full device/usage/alert/sensor state on connect
    │       ├──▶ 'deviceUpdate'         → Pushed on toggle, sensor update, or state change
    │       └──▶ 'usageHistoryUpdate'   → New usage record pushed every 5s for live charts
    │
    └──▶ Usage History Logger
            │
            └──▶ usage_history table (time-series power snapshots for analytics)
```

### Request Flow per Feature

| Action | Flow |
|--------|------|
| **Dashboard loads** | Browser → WebSocket `connect` → Server emits `initialState` (devices + usage + alerts + sensors) |
| **User toggles device** | Browser → `POST /api/devices/:id/toggle` → DB update → Server emits `deviceUpdate` to all clients |
| **Simulator ticks** | `setInterval(5s)` → Logs `usage_history` → Emits `usageHistoryUpdate` to all clients |
| **Discord `!status`** | Bot reads DB directly via `db.getAllDevices()` → Formats via Groq LLM → Sends embed |
| **Discord AI chat** | User message → Groq LLM with full device context + tool definitions → May call `set_device_status` → Response embed |
| **Sensor update** | `POST /api/sensors/update` → DB log → Check thresholds → Emit `deviceUpdate` → Post instant Discord alert if critical |
| **History chart** | `GET /api/usage/history?range=daily` → SQL aggregation query → Formatted for Recharts |

---

## 📦 Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | ≥ 18 | Runtime environment |
| **Express** | v5.1 | HTTP server & REST API framework |
| **Socket.IO** | v4.8 | WebSocket server for real-time bi-directional communication |
| **@libsql/client** | v0.15 | Turso (libSQL) database client with local SQLite fallback |
| **discord.js** | v14.18 | Discord bot framework with Gateway Intents |
| **groq-sdk** | v0.15 | Groq API client for LLM inference (Llama 3.3 70B Versatile) |
| **dotenv** | v16.5 | Environment variable management |
| **cors** | v2.8 | Cross-Origin Resource Sharing middleware |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | v19.2 | UI component library |
| **Vite** | v8.1 | Build tool & dev server with HMR |
| **@vitejs/plugin-react** | v6.0 | React Fast Refresh for Vite |
| **Recharts** | v3.9 | Composable charting library (AreaChart for power history) |
| **Lucide React** | v1.23 | Icon library (Fan, Lightbulb, Zap, AlertTriangle, etc.) |
| **Socket.IO Client** | v4.8 | WebSocket client for real-time dashboard updates |

### Development Tools

| Technology | Purpose |
|------------|---------|
| **concurrently** | Run backend + frontend dev servers simultaneously |
| **chalk** | Colored terminal output for dev script |
| **figlet** | ASCII art banner for dev startup |
| **gradient-string** | Gradient text in terminal |
| **ora** | Terminal spinners for startup progress |
| **boxen** | Boxed terminal messages |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Turso** | Edge-hosted libSQL database (globally distributed) |
| **Render** | PaaS hosting (Web Service — serves frontend + backend + bot) |
| **imgbb** | Image hosting API (proxied through backend) |
| **Groq** | Ultra-fast LLM inference API |
| **Discord** | Bot platform for command & alert delivery |

---

## 📂 Project Structure

```
Techathon-IUT/
├── 📄 package.json                    # Root monorepo config with workspace scripts
├── 📄 render.yaml                     # Render.com deployment configuration
├── 📄 .env.example                    # Environment variable template
├── 📄 .gitignore                      # Git exclusions (node_modules, .env, dist, logs)
├── 📄 hackathon.md                    # Full problem statement & solution guide
│
├── 📁 backend/                        # ─── Node.js + Express Backend ───
│   ├── 📄 server.js                   # Entry point: Express + Socket.IO + routing + startup
│   ├── 📄 db.js                       # Database layer: Turso client, CRUD, usage logging, sensors
│   ├── 📄 simulator.js                # Device state simulator (5-second interval ticks)
│   ├── 📄 envProxy.js                 # Centralized env var manager (validates & proxies secrets)
│   ├── 📄 package.json                # Backend dependencies
│   │
│   ├── 📁 database/
│   │   └── 📄 schema.sql              # SQL schema: devices, usage_history, sensors_history tables
│   │
│   ├── 📁 routes/
│   │   ├── 📄 devices.js              # GET /api/devices, GET /api/devices/:room, POST /:id/toggle
│   │   ├── 📄 usage.js                # GET /api/usage, GET /api/usage/history, GET /api/usage/daily-cost
│   │   ├── 📄 alerts.js               # GET /api/alerts + alert detection engine (4 alert types)
│   │   ├── 📄 sensors.js              # POST /api/sensors/update, GET /api/sensors
│   │   └── 📄 proxy.js                # POST /api/proxy/imgbb, POST /api/proxy/groq (key proxying)
│   │
│   ├── 📁 discord/
│   │   ├── 📄 bot.js                  # Discord bot: command router, alert checker, AI chat handler
│   │   └── 📄 llm.js                  # Groq LLM wrapper: response gen, alert messages, tool calling
│   │
│   └── 📁 scripts/
│       ├── 📄 seedHistory.js           # Seeds usage_history with 365 days of realistic test data
│       └── 📄 reset_db.js              # Drops and reinitializes all tables
│
├── 📁 frontend/                       # ─── React + Vite Frontend ───
│   ├── 📄 index.html                  # HTML entry point
│   ├── 📄 vite.config.js              # Vite config: React plugin, dev proxy, build output
│   ├── 📄 package.json                # Frontend dependencies
│   │
│   ├── 📁 public/
│   │   ├── 📄 logo.png                # Application logo (displayed in header)
│   │   ├── 📄 favicon.png             # Browser tab icon (PNG)
│   │   ├── 📄 favicon.svg             # Browser tab icon (SVG)
│   │   └── 📄 icons.svg               # Icon sprite sheet
│   │
│   └── 📁 src/
│       ├── 📄 main.jsx                # React DOM render entry point
│       ├── 📄 App.jsx                 # Main dashboard layout: Header + Grid + Footer
│       ├── 📄 index.css               # Complete design system: CSS variables, animations, responsive
│       │
│       ├── 📁 hooks/
│       │   └── 📄 useSocket.js         # Custom hook: Socket.IO connection, state management, daily cost
│       │
│       ├── 📁 components/
│       │   ├── 📄 Header.jsx           # Top bar: logo, title, live indicator, power badge, clock
│       │   ├── 📄 DevicePanel.jsx      # Groups devices by room, renders RoomCards
│       │   ├── 📄 RoomCard.jsx         # Expandable room card: sensor badge + device icons
│       │   ├── 📄 DeviceIcon.jsx       # Interactive device toggle: fan spin animation, light glow
│       │   ├── 📄 PowerMeter.jsx       # Power gauge: total watts, room bars, stats, live cost ticker
│       │   ├── 📄 AlertsPanel.jsx      # Alert list with dismiss, clear all, restore, refresh
│       │   ├── 📄 SensorsPanel.jsx     # Per-room sensor status display (fire/CO₂)
│       │   ├── 📄 HistoryPanel.jsx     # Time-series chart + data list (5 ranges, zoom modal)
│       │   ├── 📄 OfficeFloorPlan.jsx  # SVG architectural floor plan with live device states
│       │   └── 📄 SensorActivityTest.jsx  # Sensor simulation UI with sliders and test button
│       │
│       └── 📁 assets/
│           └── 📄 hero.png             # Hero/splash image asset
│
└── 📁 scripts/                        # ─── Root Dev Scripts ───
    └── 📄 dev-full.mjs                # Beautiful CLI startup: figlet banner, ora spinners, chalk colors
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Node.js ≥ 18** | Required for Express v5 and ES module support |
| **npm** | Comes with Node.js |
| **Discord Bot Token** | [Create one](https://discord.com/developers/applications) — see [Discord Bot Setup](#-setting-up-the-discord-bot) |
| **Groq API Key** | [Get free key](https://console.groq.com) — powers AI responses |
| **Turso Account** | Optional — falls back to local SQLite file (`office.db`) if not configured |
| **imgbb API Key** | Optional — enables image upload proxying |

### 1. Clone & Install

```bash
git clone https://github.com/AdnanShahria/Techathon-IUT.git
cd Techathon-IUT
npm install
```

The `postinstall` script automatically runs:
```bash
cd backend && npm install && cd ../frontend && npm install --include=dev
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials (see [Environment Variables](#-environment-variables) for details).

### 3. Run (Development Mode)

**Option A — Simple concurrent start:**
```bash
npm run dev
```

**Option B — Beautiful CLI with ASCII banner, spinners & colors:**
```bash
npm run dev:full
```

Both options start:
- **Backend** → `http://localhost:4000` (API + WebSocket + Simulator + Discord Bot)
- **Frontend** → `http://localhost:5173` (React dashboard with Hot Module Replacement)

The Vite dev server automatically proxies `/api/*` and `/socket.io` requests to the backend at port 4000.

### 4. Run (Production Build Locally)

```bash
npm run build    # Build React frontend → frontend/dist/
npm start        # Start Express (serves compiled frontend + API + Bot)
```

In production mode (`NODE_ENV=production`), Express serves the static frontend from `frontend/dist/` and uses SPA fallback routing.

---

## 🔑 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `4000` | HTTP server port |
| `NODE_ENV` | No | `development` | Set to `production` for deployed environments |
| `TURSO_DATABASE_URL` | No | — | Turso database URL (e.g., `libsql://your-db.turso.io`). Falls back to local SQLite if missing |
| `TURSO_AUTH_TOKEN` | No | — | Turso authentication token |
| `DISCORD_TOKEN` | No | — | Discord bot token. Bot will not start if missing |
| `ALERT_CHANNEL_ID` | No | — | Discord channel ID for proactive alert posting |
| `GROQ_API_KEY` | No | — | Groq LLM API key for AI-powered bot responses. Falls back to raw data if missing |
| `IMGBB_API_KEY` | No | — | imgbb image hosting API key for the proxy endpoint |

> **Note:** The application is designed to degrade gracefully. No environment variable is strictly required — the system will log warnings and disable corresponding features.

### `.env.example` Template

```env
# ─── Server ───────────────────────────────────
PORT=4000

# ─── Turso Database ───────────────────────────
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# ─── Discord Bot ──────────────────────────────
DISCORD_TOKEN=your-discord-bot-token
ALERT_CHANNEL_ID=your-discord-channel-id

# ─── Groq LLM API ────────────────────────────
GROQ_API_KEY=your-groq-api-key

# ─── imgbb Image Hosting ─────────────────────
IMGBB_API_KEY=your-imgbb-api-key
```

---

## 🗃️ Database Schema

The application uses **3 tables**, defined in [`backend/database/schema.sql`](backend/database/schema.sql):

### `devices` — Office Device Registry

| Column | Type | Description |
|--------|------|-------------|
| `id` | `INTEGER PRIMARY KEY` | Unique device ID (1–15) |
| `name` | `TEXT NOT NULL` | Display name (e.g., "Fan 1", "Light 3") |
| `type` | `TEXT NOT NULL` | Device type: `fan` or `light` |
| `room` | `TEXT NOT NULL` | Room name: `Drawing Room`, `Work Room 1`, or `Work Room 2` |
| `status` | `TEXT DEFAULT 'off'` | Current state: `on` or `off` |
| `power_watt` | `INTEGER NOT NULL` | Power draw in watts (fans: 240W, lights: 30W) |
| `last_changed` | `TEXT NOT NULL` | ISO 8601 timestamp of last status change |

**Seeded Data:** 3 rooms × (2 fans + 3 lights) = **15 devices**

| Room | Fans (240W each) | Lights (30W each) | Max Power |
|------|-------------------|--------------------|-----------|
| Drawing Room | Fan 1, Fan 2 | Light 1, Light 2, Light 3 | 570W |
| Work Room 1 | Fan 1, Fan 2 | Light 1, Light 2, Light 3 | 570W |
| Work Room 2 | Fan 1, Fan 2 | Light 1, Light 2, Light 3 | 570W |
| **Total** | **6 fans** | **9 lights** | **1,710W** |

### `usage_history` — Power Consumption Time-Series

| Column | Type | Description |
|--------|------|-------------|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Auto-incrementing row ID |
| `timestamp` | `TEXT NOT NULL` | ISO 8601 recording timestamp |
| `total_power_watts` | `INTEGER NOT NULL` | Total power draw at this moment |
| `drawing_room_watts` | `INTEGER NOT NULL` | Drawing Room power at this moment |
| `work_room_1_watts` | `INTEGER NOT NULL` | Work Room 1 power at this moment |
| `work_room_2_watts` | `INTEGER NOT NULL` | Work Room 2 power at this moment |
| `devices_on` | `INTEGER NOT NULL` | Count of devices currently ON |
| `cost` | `REAL NOT NULL` | Electricity cost for this interval (Tk) |

**Indexed on:** `timestamp` for fast range queries.

### `sensors_history` — Fire & CO₂ Sensor Readings

| Column | Type | Description |
|--------|------|-------------|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Auto-incrementing row ID |
| `timestamp` | `TEXT NOT NULL` | ISO 8601 recording timestamp |
| `room` | `TEXT NOT NULL` | Room where reading was taken |
| `fire` | `INTEGER NOT NULL` | Fire/smoke sensor value (danger ≥ 1024) |
| `co2` | `INTEGER NOT NULL` | CO₂ sensor value in ppm (danger ≥ 800) |

**Indexed on:** `timestamp` for fast range queries.

---

## 📡 API Reference

Base URL: `http://localhost:4000/api` (dev) or `/api` (production)

### Devices

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/api/devices` | `GET` | All devices with status, power, and usage summary | `{ devices[], totalPower, powerByRoom, timestamp }` |
| `/api/devices/:room` | `GET` | Devices for a specific room. Accepts: `drawing`, `work1`, `work2`, `drawingroom`, `workroom1`, etc. | `{ room, devices[], totalPower, timestamp }` |
| `/api/devices/:id/toggle` | `POST` | Toggle a device ON↔OFF. Logs usage and broadcasts WebSocket update | `{ id, name, type, room, status, power_watt, last_changed }` |

### Usage & Analytics

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/api/usage` | `GET` | Current power summary | `{ totalPowerWatts, powerByRoom, estimatedDailyKWh, deviceCount, devicesOn, timestamp }` |
| `/api/usage/history?range=<range>` | `GET` | Aggregated usage history. Ranges: `hourly` (raw 60 records), `daily` (30-min buckets), `weekly` (1-hour buckets), `monthly` (6-hour buckets), `yearly` (daily buckets) | `{ range, history[], count, timestamp }` |
| `/api/usage/daily-cost` | `GET` | Total cost accumulated today since midnight (seeds PowerMeter ticker) | `{ dailyCost, timestamp }` |

### Alerts

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/api/alerts` | `GET` | Active anomaly alerts (computed in real-time from device states + sensors) | `{ alerts[], timestamp }` |

### Sensors

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/api/sensors` | `GET` | Latest sensor readings per room | `{ "Drawing Room": { fire, co2 }, ... }` |
| `/api/sensors/update` | `POST` | Submit new sensor reading. Body: `{ room, fire, co2 }`. Triggers WebSocket broadcast + Discord alerts if thresholds exceeded | `{ success, room, fire, co2, devicesUpdated }` |

### Proxy (API Key Protection)

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/api/proxy/imgbb` | `POST` | Proxies image upload to imgbb. Body: `{ image (base64), name }` | imgbb API response |
| `/api/proxy/groq` | `POST` | Proxies LLM request to Groq. Body: `{ prompt, systemPrompt }` | `{ message }` |

### Health

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/api/health` | `GET` | Server health check | `{ status: "ok", uptime, timestamp }` |

---

## 🔌 WebSocket Events

The application uses **Socket.IO** for real-time communication.

### Client → Server Connection

```javascript
const socket = io('http://localhost:4000', {
  transports: ['websocket', 'polling'],
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
});
```

### Server → Client Events

| Event | Payload | Trigger | Description |
|-------|---------|---------|-------------|
| `initialState` | `{ devices[], totalPower, powerByRoom, estimatedDailyKWh, devicesOn, alerts[], sensors, timestamp }` | On client connect | Full application state snapshot |
| `deviceUpdate` | `{ device, allDevices[], totalPower, powerByRoom, estimatedDailyKWh, alerts[], sensors?, timestamp }` | Device toggle, sensor update | Broadcast to all connected clients |
| `usageHistoryUpdate` | `{ record: { timestamp, total_power_watts, drawing_room_watts, work_room_1_watts, work_room_2_watts, devices_on, cost }, timestamp }` | Every 5 seconds (simulator tick), sensor update | Live usage record for HistoryPanel chart |

---

## 🖥️ Frontend Dashboard

### Component Architecture

```
App.jsx
├── Header.jsx                  — Logo, title, LIVE indicator, power badge, clock
├── DevicePanel.jsx             — Section wrapper for all 3 rooms
│   └── RoomCard.jsx (×3)       — Collapsible room card
│       ├── Sensor Badge        — Fire/CO₂ status icon (ShieldCheck or AlertTriangle)
│       └── DeviceIcon.jsx (×5) — Interactive toggle with fan spin / light glow animations
├── PowerMeter.jsx              — Total watts, room progress bars, stats, live cost ticker
├── AlertsPanel.jsx             — Active alerts with dismiss/restore/refresh
├── HistoryPanel.jsx            — Time-series chart (Recharts AreaChart) + scrollable data list
│   └── Zoom Modal              — Full-screen expanded chart view
├── OfficeFloorPlan.jsx         — SVG architectural top-view with live device states
├── SensorActivityTest.jsx      — Fire/CO₂ simulation sliders with room selector
└── Footer                      — Credits: IUT Robotic Society & Orbit SaaS
```

### Key Design Decisions

- **Custom `useSocket` Hook** — Centralized WebSocket state management with React `useState` and `useRef`. Fetches daily cost from DB on mount to seed the cost ticker.
- **Optimistic UI Updates** — `DeviceIcon` immediately toggles the visual state before the server responds, reverting on failure.
- **CSS Design System** — 22KB+ `index.css` with CSS custom properties for colors, fonts, spacing, and animations. Dark theme with glassmorphism effects.
- **No CSS Framework** — Pure vanilla CSS for maximum control and zero runtime overhead.
- **Recharts Integration** — `AreaChart` with gradient fill, custom tooltips showing per-room breakdown, and configurable time ranges.
- **SVG Floor Plan** — Hand-crafted architectural view with:
  - Realistic 3-blade ceiling fans (with CSS spin animation when ON)
  - Warm-glow light circles (with blur filter when ON)
  - Wooden desks with monitors, keyboards, and chairs
  - Sofas, coffee tables, armchairs in the Drawing Room
  - Decorative plants in corners
  - Tiled and wood-pattern flooring
  - Door swing arcs and corridor with entry

### Vite Configuration

- **Dev Server:** Port 5173 with API proxy to `localhost:4000`
- **WebSocket Proxy:** `/socket.io` proxied to backend with `ws: true`
- **Build Output:** `frontend/dist/` (served by Express in production)
- **Source Maps:** Disabled in production builds

---

## 🤖 Discord Bot

### Setting Up the Discord Bot

1. **Create an Application:**
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   - Click **"New Application"** → name it (e.g., "Smart Office Monitor") → **Create**

2. **Get the Bot Token:**
   - Sidebar → **Bot** → **"Reset Token"** → Copy the token → Paste as `DISCORD_TOKEN` in `.env`
   - ⚠️ Enable **"Message Content Intent"** under Privileged Gateway Intents → **Save**

3. **Invite the Bot:**
   - Sidebar → **OAuth2** → **URL Generator**
   - Scopes: ✅ `bot`
   - Permissions: ✅ `Send Messages`, `View Channels`, `Read Message History`
   - Copy URL → Open in browser → Select your server → **Authorize**

4. **Get the Channel ID:**
   - Discord Settings → **Advanced** → Enable **Developer Mode**
   - Right-click target channel → **Copy Channel ID** → Paste as `ALERT_CHANNEL_ID` in `.env`

### Bot Commands

| Command | Description | Example |
|---------|-------------|---------|
| `!status` | AI-generated overview of all rooms | Color-coded embed (green/amber/red based on device count) |
| `!room <name>` | Room details with per-device breakdown | `!room drawing`, `!room work1`, `!room work2` |
| `!usage` | Power consumption report with daily estimate | Amber-colored embed with per-room watts |
| `!help` | Show all available commands | Blue embed with command list |
| *(any text)* | AI-powered natural language interaction | "Turn off all lights in Work Room 1" |

### Bot Architecture

- **Command Router:** `messageCreate` event handler dispatches to handler functions based on message prefix
- **AI Chat Fallback:** Any message not matching a `!command` is forwarded to the Groq LLM with full device context
- **Proactive Alerts:** `setInterval(5 min)` checks for active alerts and posts unseen ones to the configured channel
- **Instant Alerts:** Fire/CO₂ sensor threshold breaches trigger immediate Discord notifications via `postInstantAlert()`
- **De-duplication:** `lastAlertIds` Set tracks already-posted alerts to prevent spam
- **Graceful Degradation:** Bot logs an error and skips startup if `DISCORD_TOKEN` is missing or invalid

---

## 🧠 AI Integration (Groq LLM)

### Model

**Llama 3.3 70B Versatile** via Groq API — selected for its balance of quality, speed, and free-tier availability.

### System Prompt

The bot persona is **"OfficeBot"** — a friendly, witty office assistant that:
- Uses relevant emojis naturally
- Keeps responses concise (2–4 sentences max)
- Includes actual data/numbers in a human-friendly way
- Never makes up data — only uses what's provided
- Knows office hours are 9 AM to 5 PM
- Understands the office layout (3 rooms, device specs)

### Function Calling (Tool Use)

The AI has access to one tool:

```json
{
  "name": "set_device_status",
  "description": "Turn a specific device on or off.",
  "parameters": {
    "device_id": { "type": "integer" },
    "status": { "type": "string", "enum": ["on", "off"] }
  }
}
```

**Flow:** User message → LLM receives full device context + tool definitions → LLM decides to call tool → Backend executes `db.setDeviceStatus()` → Tool result sent back to LLM → LLM generates confirmation message.

### Three LLM Functions

| Function | Purpose | Temperature | Max Tokens |
|----------|---------|-------------|------------|
| `generateResponse()` | Convert raw data into conversational Discord messages | 0.8 | 300 |
| `generateAlertMessage()` | Generate urgent but friendly alert notifications | 0.7 | 150 |
| `generateInteractiveChat()` | Full AI chat with tool calling for device control | default | 300 |

---

## 🔄 Device Simulator

**File:** [`backend/simulator.js`](backend/simulator.js)

The simulator runs a **5-second interval** that:

1. Fetches all devices from the database
2. Computes usage summary (total watts, per-room watts)
3. Checks for active alerts
4. **Logs a usage record** to the `usage_history` table (with cost calculated based on elapsed time)
5. **Broadcasts** a `usageHistoryUpdate` WebSocket event with the latest record

### Cost Calculation per Tick

```
cost = (total_power_watts / 1000) × 9 Tk × (elapsed_hours)
```

Where:
- `9 Tk/kWh` = Bangladesh electricity rate
- `elapsed_hours` = time since last record, capped at 1 hour, default 5/3600 hours

---

## 🔥 Sensor Simulation

The **SensorActivityTest** component provides a live UI for testing fire/smoke and CO₂ sensors:

### Interface

- **Room Selector:** Dropdown to choose target room
- **Fire/Smoke Slider:** Range 0–2000 (alert threshold: ≥ 1024)
- **CO₂ Slider:** Range 400–2000 ppm (alert threshold: ≥ 800)
- **Refresh Button:** Fetches current sensor values from server
- **TEST Button:** Sends sensor data to `POST /api/sensors/update`

### What Happens on Sensor Update

1. Sensor data is logged to `sensors_history` table
2. Thresholds are checked:
   - Fire ≥ 1024 → **Critical alert** sent to Discord instantly
   - CO₂ ≥ 800 → **Warning alert** sent to Discord instantly
3. WebSocket `deviceUpdate` event is emitted with fresh sensor data + alerts
4. Usage history is logged and `usageHistoryUpdate` is emitted
5. All connected dashboard clients update in real-time

---

## 🚨 Alert Engine

**File:** [`backend/routes/alerts.js`](backend/routes/alerts.js)

The alert engine computes alerts **in real-time** on every request — no stored alert state. Four alert types:

| # | Alert Type | Severity | Condition | Message Example |
|---|------------|----------|-----------|-----------------|
| 1 | `after-hours` | ⚠️ Warning | Any device ON outside 9 AM–5 PM | "Drawing Room still has 2 fans and 1 light ON at 10:30 PM" |
| 2 | `all-devices-on` | 🔴 Critical | All devices in a room ON for ≥ 2 hours continuously | "All devices in Work Room 1 have been ON for 3.2 hours" |
| 3 | `high-power` | ℹ️ Info | Total power draw > 400W | "Office is drawing 650W — above the 400W threshold" |
| 4 | `fire-alert` | 🔴 Critical | Fire sensor ≥ 1024 | "FIRE DETECTED in Drawing Room! Sensor value: 1500" |
| 5 | `co2-alert` | ⚠️ Warning | CO₂ sensor ≥ 800 ppm | "High CO2 levels in Work Room 2! Sensor value: 950ppm" |

### Alert Lifecycle on Frontend

- Alerts are **dismissable** (stored in `localStorage` as `dismissed_alerts`)
- **"Clear All"** button dismisses all visible alerts
- **"Restore Dismissed"** button resets the dismissed list
- **Refresh** button fetches latest alerts from API
- Severity-based color coding: red (critical), amber (warning), blue (info)

---

## 💰 Power Analytics & Cost Calculation

### Electricity Rate

**9 Tk per kWh** (Bangladesh domestic electricity tariff)

### Live Cost Ticker (PowerMeter)

The `PowerMeter` component maintains a live-ticking cost counter:

1. **Seed:** On mount, fetches `GET /api/usage/daily-cost` to get today's accumulated cost from the database
2. **Tick:** Every second, adds `(totalPowerWatts / 1000) × (9 / 3600)` Tk to the running total
3. **Display:** Shows cost to 4 decimal places with green glow effect
4. **Reset:** Cost resets at midnight (displayed as "RESETS AT 12 AM")

### Estimated Daily kWh

```
estimatedDailyKWh = (currentTotalPower × 8 office hours) / 1000
```

### Power Capacity

| Metric | Value |
|--------|-------|
| Max per fan | 240W |
| Max per light | 30W |
| Max per room | 570W (2×240 + 3×30) |
| Max total office | 1,710W (3 rooms) |
| Alert threshold | 400W |

---

## 📊 Usage History & Seeding

### History Ranges & Aggregation

| Tab | API Range | Time Window | Bucket Size | SQL Aggregation |
|-----|-----------|-------------|-------------|-----------------|
| **Hourly** | `hourly` | Last 60 raw records | None (raw 5-sec snapshots) | `SELECT * ... LIMIT 60` |
| **Daily** | `daily` | Last 24 hours | 30-minute slots | `GROUP BY` half-hour |
| **Weekly** | `weekly` | Last 7 days | 1-hour slots | `GROUP BY` hour |
| **Monthly** | `monthly` | Last 30 days | 6-hour periods | `GROUP BY` 6-hour blocks |
| **Yearly** | `yearly` | Last 365 days | Daily | `GROUP BY` date |

### Aggregated Fields

Each aggregated bucket returns: `avg_power`, `drawing_room_watts`, `work_room_1_watts`, `work_room_2_watts`, `avg_devices_on`, `total_cost`, `avg_cost`.

### Seeding Script

**File:** [`backend/scripts/seedHistory.js`](backend/scripts/seedHistory.js)

Seeds the `usage_history` table with realistic test data:

```bash
node backend/scripts/seedHistory.js
```

| Segment | Period | Interval | Purpose |
|---------|--------|----------|---------|
| Segment 1 | Last 7 days | Every 5 minutes | Hourly + Daily tabs |
| Segment 2 | Days 8–30 | Every 1 hour | Weekly + Monthly tabs |
| Segment 3 | Days 31–365 | Every 6 hours | Yearly tab |

**Realistic load simulation:**
- Higher wattage during office hours (9 AM–6 PM): 85% load factor
- Lunch dip (12–2 PM): 60% load factor
- Morning warm-up (7–9 AM): 45% load factor
- Evening wrap-up (6–8 PM): 40% load factor
- Overnight skeleton load: 5% load factor
- Weekends: 35% during day, 5% at night
- ±15% jitter noise for realism

### Database Reset Script

```bash
node backend/scripts/reset_db.js
```

Drops all 3 tables (`devices`, `usage_history`, `sensors_history`) and reinitializes with fresh seed data.

---

## 🔐 Security Architecture

### API Key Protection

All sensitive API keys are managed through [`backend/envProxy.js`](backend/envProxy.js):

```
Frontend ──▶ /api/proxy/groq ──▶ Backend adds GROQ_API_KEY ──▶ Groq API
Frontend ──▶ /api/proxy/imgbb ──▶ Backend adds IMGBB_API_KEY ──▶ imgbb API
```

**No API keys are ever sent to the client.** The frontend only communicates with `/api/*` endpoints.

### CORS Configuration

| Environment | CORS Origin | Behavior |
|-------------|-------------|----------|
| Development | `/^http:\/\/localhost:\d+$/` | Allows any localhost port (5173, 5174, etc.) |
| Production | `false` | Disabled — frontend served from same origin |

### Environment Validation

On startup, `envProxy.validate()` checks all critical variables and logs warnings:
- Missing `TURSO_DATABASE_URL` → Uses local SQLite fallback
- Missing `DISCORD_TOKEN` → Discord bot will not start
- Missing `GROQ_API_KEY` → LLM responses disabled, uses raw data fallback
- Missing `IMGBB_API_KEY` → Image proxy disabled

The application **never crashes** due to missing env vars.

### Graceful Shutdown

The server handles `SIGINT` (Ctrl+C) by:
1. Stopping the device simulator interval
2. Destroying the Discord bot client
3. Closing the HTTP server
4. Exiting cleanly

---

## 🔧 Hardware Schematic (Wokwi/Tinkercad)

Circuit design for **ONE room** (Drawing Room):

| Component | Pin | Purpose |
|-----------|-----|---------|
| ESP32 | — | Microcontroller |
| LED 1–3 (Lights) | GPIO 13, 12, 14 | Simulates 3 Lights |
| DC Motor 1–2 (Fans) | GPIO 27, 26 | Simulates 2 Fans |
| ACS712 Sensor | GPIO 34 (ADC) | Measures total current |
| MQ-2 Gas Sensor | GPIO 35 (ADC) | Fire/smoke detection |
| MQ-135 Gas Sensor | GPIO 32 (ADC) | CO₂ level monitoring |

### Wiring Diagram

```
ESP32 GPIO 13/12/14 → 220Ω Resistor → LEDs (Lights) → GND
ESP32 GPIO 27/26    → 220Ω Resistor → LEDs/Motors (Fans) → GND
ESP32 GPIO 34 (ADC) ← ACS712 Analog Out (current sense)
ESP32 GPIO 35 (ADC) ← MQ-2 Analog Out (fire/smoke)
ESP32 GPIO 32 (ADC) ← MQ-135 Analog Out (CO₂)
ESP32               → WiFi → POST /api/sensors/update
```

### ESP32 → Backend Communication

The ESP32 sends HTTP POST requests to the backend sensor endpoint:

```json
POST /api/sensors/update
{
  "room": "Drawing Room",
  "fire": 512,
  "co2": 650
}
```

---

## 🚢 Deployment Guide (Render)

The application is architected as a **single, monolithic Node.js app** — perfect for Render's Web Service.

### 1. Prepare Repository

```bash
git add .
git commit -m "Ready for production"
git push origin main
```

### 2. Create Render Web Service

1. Go to [Render.com](https://render.com) → Sign up with GitHub
2. **New +** → **Web Service** → Select your repository

### 3. Configure

| Setting | Value |
|---------|-------|
| **Name** | `smart-office-monitor` |
| **Region** | Closest to your Turso database |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && cd backend && npm install && cd ../frontend && npm install && cd .. && npm run build` |
| **Start Command** | `npm start` |

### 4. Set Environment Variables

Add all variables from `.env` (except `PORT` — Render sets this automatically):

- `NODE_ENV` = `production`
- `TURSO_DATABASE_URL` = your Turso DB URL
- `TURSO_AUTH_TOKEN` = your Turso auth token
- `DISCORD_TOKEN` = your Discord bot token
- `ALERT_CHANNEL_ID` = your Discord channel ID
- `GROQ_API_KEY` = your Groq API key
- `IMGBB_API_KEY` = your imgbb API key

### 5. Deploy

Click **Create Web Service** → Render builds and deploys automatically.

### `render.yaml` (Infrastructure as Code)

The project includes a [`render.yaml`](render.yaml) for one-click deployment:

```yaml
services:
  - type: web
    name: smart-office-monitor
    runtime: node
    buildCommand: npm install && cd backend && npm install && cd ../frontend && npm install && cd .. && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      # ... (secrets configured in Render dashboard)
```

> [!WARNING]
> Free instances on Render spin down after 15 minutes of inactivity. This means your Discord bot might go offline. To keep it awake 24/7:
> - **Option A:** Upgrade to the $7/month Starter tier on Render
> - **Option B:** Use a free cron job service (like [cron-job.org](https://cron-job.org)) to ping your `/api/health` endpoint every 10 minutes

---

## 📜 NPM Scripts Reference

### Root (`package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `concurrently "npm run dev:backend" "npm run dev:frontend"` | Start both servers concurrently |
| `npm run dev:full` | `node scripts/dev-full.mjs` | Beautiful CLI startup with ASCII banner & spinners |
| `npm run dev:backend` | `cd backend && node server.js` | Start backend only |
| `npm run dev:frontend` | `cd frontend && npx vite --host` | Start Vite dev server |
| `npm run build` | `cd frontend && npm run build` | Build React frontend for production |
| `npm start` | `node backend/server.js` | Start production server |
| `postinstall` | Installs backend + frontend dependencies | Runs automatically after `npm install` |

### Frontend (`frontend/package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `vite` | Start Vite dev server |
| `npm run build` | `vite build` | Production build → `dist/` |
| `npm run preview` | `vite preview` | Preview production build locally |

### Utility Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Seed History | `node backend/scripts/seedHistory.js` | Populate usage_history with 365 days of data |
| Reset DB | `node backend/scripts/reset_db.js` | Drop all tables and reinitialize |

---

## 👥 Dummy Data (As Required)

```json
[
  { "name": "Nafisa Rahman", "email": "nafisa.rahman@yahoo.com", "phone": "+8801812345678" },
  { "name": "Tanvir Hossain", "email": "tanvir.hossain@yahoo.com", "phone": "+8801912345678" }
]
```

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for Techathon-IUT**

All Rights Reserved by [IUT Robotic Society](https://iut.ac.bd) and [Orbit SaaS](https://orbitsaas.cloud)

</div>
]]>