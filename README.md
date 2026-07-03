# 🏆 Smart Office Monitor (Techathon-IUT)

**Live Demo:** [https://smart-office-monitor.onrender.com](https://smart-office-monitor.onrender.com)

Real-time office device monitoring system with a web dashboard and Discord bot. Tracks 18 devices (fans & lights) across 3 rooms with live power analytics, alerts, and conversational AI.

![Architecture](diagrams/system-diagram.png)

## 📋 Problem Summary
Build a **Smart Office Monitoring System** that tracks lights & fans across 3 rooms (18 devices total) via:
1. **System Diagram** — full data-flow architecture
2. **Hardware Schematic** — Wokwi/Tinkercad circuit for 1 room
3. **Simulated Device Data** — dynamic dummy data for all 18 devices
4. **Web Dashboard** — real-time UI with live status, power meter, alerts
5. **Discord Bot** — `!status`, `!room <name>`, `!usage` commands pulling live data

**Key Constraint:** Dashboard + Discord Bot share a **single backend** (one source of truth).

---

## ✨ Features
- **📊 Real-time Dashboard** — Live device states, power meters, and alerts via WebSocket
- **🤖 Discord Bot** — `!status`, `!room`, `!usage` commands with AI-powered conversational responses
- **⚡ Power Analytics** — Total & per-room consumption with daily kWh estimates
- **🚨 Smart Alerts** — After-hours detection, high consumption warnings
- **🗺️ Floor Plan** — Interactive SVG top-view with glowing lights & spinning fans
- **🔐 Secure** — All API keys proxied through backend, never exposed to frontend

---

## 🏗️ Architecture & Data Flow
Single backend serves everything: REST API, WebSocket, device simulator, and Discord bot.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        SMART OFFICE MONITOR                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐     ┌──────────────────┐     ┌────────────────┐  │
│  │  Simulated   │     │                  │     │  Web Dashboard │  │
│  │  Device Layer│────▶│   Backend API    │────▶│  (React/Next)  │  │
│  │  (Simulator) │     │   (Node/Express) │     │  via WebSocket │  │
│  └──────────────┘     │                  │     └────────────────┘  │
│                       │   ┌──────────┐   │                         │
│                       │   │ Turso DB │   │     ┌────────────────┐  │
│                       │   │  Store   │   │────▶│  Discord Bot   │  │
│                       │   └──────────┘   │     │  (discord.js)  │  │
│                       └──────────────────┘     └────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Data Flow:**
```text
Simulator (setInterval)
    │
    ▼
Database/In-Memory Device Store (single source of truth)
    │
    ├──▶ REST API (/api/devices, /api/usage, /api/alerts)
    │       │
    │       ├──▶ Discord Bot (polls API for !commands)
    │       └──▶ Dashboard (initial load)
    │
    └──▶ WebSocket (Socket.IO) ──▶ Dashboard (real-time push updates)
```

---

## 📦 Tech Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | React + Vite |
| **Backend** | Node.js + Express + Socket.IO |
| **Database** | Turso (libSQL) with local SQLite fallback |
| **Discord** | discord.js v14 |
| **AI/LLM** | Groq API (Llama 3.3 70B) |
| **Deployment** | Render.com |

---

## 🤖 Setting up the Discord Bot

Follow these steps to get your `DISCORD_TOKEN` and `ALERT_CHANNEL_ID`:

1. **Create an Application:**
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications).
   - Click the **"New Application"** button in the top right.
   - Give it a name (e.g., "Smart Office Monitor") and agree to the Terms of Service. Click **Create**.

2. **Get the Bot Token:**
   - On the left sidebar, click **"Bot"**.
   - Under the Bot section, click **"Reset Token"** (and confirm "Yes, do it!").
   - Copy the generated token. **This is your `DISCORD_TOKEN`.** Paste it into your `.env` file.
   - *Important:* Scroll down to **"Privileged Gateway Intents"** and toggle ON **"Message Content Intent"**. Save changes.

3. **Invite the Bot to your Server:**
   - On the left sidebar, click **"OAuth2"**, then **"URL Generator"**.
   - Under **Scopes**, check the `bot` box.
   - Under **Bot Permissions**, check `Send Messages`, `View Channels`, and `Read Message History`.
   - Copy the generated URL at the bottom and paste it into a new browser tab.
   - Select your Discord server and click **Authorize**.

4. **Get the Channel ID:**
   - In your Discord app, open User Settings (gear icon) > **Advanced** > Toggle **"Developer Mode"** ON.
   - Go to your server, right-click the text channel where you want alerts to be sent, and click **"Copy Channel ID"**.
   - Paste this ID into your `.env` file as `ALERT_CHANNEL_ID`.

---

## 🚀 Quick Start (Local Development)

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

### 4. Run (Production Locally)
```bash
npm run build    # Build React frontend
npm start        # Start Express (serves frontend + API)
```

---

## 📱 Discord Bot Commands
| Command | Description |
|---------|-------------|
| `!status` | Overview of all rooms and devices |
| `!room <name>` | Details for a specific room (`drawing`, `work1`, `work2`) |
| `!usage` | Current power consumption and daily estimate |
| `!help` | Show available commands |

**Bonus:** Bot proactively posts alerts when devices are left ON after hours.

---

## 🔌 API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/devices` | GET | All 18 devices with status & power |
| `/api/devices/:room` | GET | Devices for a specific room |
| `/api/usage` | GET | Power consumption summary |
| `/api/alerts` | GET | Active anomaly alerts |
| `/api/health` | GET | Server health check |

---

## 🚢 Hosting Guide (Render)

Your application is beautifully architected to be deployed as a **single, monolithic Node.js app**. Because your backend is configured to serve the compiled Vite frontend when `NODE_ENV=production`, and because you have a long-running Discord Bot, the best place to host this is **Render**.

### 1. Prepare your Repository
Make sure all your latest code is pushed to your GitHub repository:
```bash
git add .
git commit -m "Ready for production"
git push origin main
```

### 2. Create a Render Web Service
1. Go to [Render.com](https://render.com) and sign up/log in with your GitHub account.
2. Click the **"New +"** button at the top right and select **Web Service**.
3. Under "Connect a repository", find and select your repository (e.g. `AdnanShahria/Techathon-IUT`).

### 3. Configure the Web Service
- **Name:** `smart-office-monitor` (or your preference)
- **Region:** Choose the region closest to you or your Turso database.
- **Branch:** `main`
- **Runtime:** `Node`
- **Build Command:** `npm run setup && npm run build`
  *(Runs your root setup script and builds the Vite frontend into `dist`)*
- **Start Command:** `npm start`
  *(Runs the backend server, which will automatically serve your frontend)*

### 4. Set Environment Variables
Add all the variables from your `.env` file (except `PORT`, which Render sets automatically).
- `NODE_ENV` = `production`
- `TURSO_DATABASE_URL` = *(Your Turso DB URL)*
- `TURSO_AUTH_TOKEN` = *(Your Turso Auth Token)*
- `DISCORD_TOKEN` = *(Your Discord Bot Token)*
- `ALERT_CHANNEL_ID` = *(Your Discord Channel ID)*
- `GROQ_API_KEY` = *(Your Groq API Key)*
- `IMGBB_API_KEY` = *(Your ImgBB API Key)*

### 5. Deploy & Access
1. Click **Create Web Service**.
2. Once deployed, click the URL provided by Render to view your live frontend. The WebSockets, Discord Bot, and Database will all be seamlessly connected!

> [!WARNING]
> Free instances on Render spin down after 15 minutes of inactivity. This means your Discord bot might go offline if no one visits the web dashboard. To keep it awake 24/7, consider upgrading to the $7/month Starter tier on Render, or use a free cron job service (like cron-job.org) to ping your `/api/health` endpoint every 10 minutes.

---

## 🔧 Hardware Schematic (Wokwi/Tinkercad)

For the hardware requirement (Circuit Design for ONE Room):

| Component | Pin | Purpose |
|-----------|-----|---------|
| ESP32 | — | Microcontroller |
| LED 1-3 (Lights) | GPIO 13, 12, 14 | Simulates 3 Lights |
| DC Motor 1-2 (Fans) | GPIO 27, 26 | Simulates 2 Fans |
| ACS712 Sensor | GPIO 34 (ADC) | Measures total current |

**Wiring Logic:**
```text
ESP32 GPIO 13/12/14 → 220Ω Resistor → LEDs (Lights) → GND
ESP32 GPIO 27/26 → 220Ω Resistor → LEDs/Motors (Fans) → GND
ESP32 GPIO 34 (ADC) ← ACS712 Analog Out (current sense)
```

---

## 📂 Project Structure
```text
Techathon-IUT/
├── backend/
│   ├── server.js           # Express + Socket.IO entry point
│   ├── db.js               # Turso/SQLite database layer
│   ├── simulator.js        # Device state simulator
│   ├── envProxy.js         # Centralized env secrets
│   ├── routes/             # API routes
│   └── discord/            # Discord bot & Groq LLM wrapper
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

## 👥 Dummy Data (as required)
```json
[
  { "name": "Nafisa Rahman", "email": "nafisa.rahman@yahoo.com", "phone": "+8801812345678" },
  { "name": "Tanvir Hossain", "email": "tanvir.hossain@yahoo.com", "phone": "+8801912345678" }
]
```

## 📄 License
MIT