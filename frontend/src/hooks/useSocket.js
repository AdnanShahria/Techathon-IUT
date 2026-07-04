import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.DEV
  ? 'http://localhost:4000'
  : window.location.origin;

const API_URL = import.meta.env.DEV ? 'http://localhost:4000/api' : '/api';

/**
 * WebSocket hook that connects to the backend Socket.IO server.
 * Receives initial state on connect and live updates as devices toggle.
 * Also listens for usageHistoryUpdate to stream new DB records live.
 */
export function useSocket() {
  const [data, setData] = useState({
    devices: [],
    totalPower: 0,
    powerByRoom: {},
    estimatedDailyKWh: 0,
    devicesOn: 0,
    alerts: [],
    sensors: {},
    connected: false,
    lastUpdate: null,
    // ── Real-time history record (latest DB row pushed by server)
    latestHistoryRecord: null,
    // ── Daily cost accumulated from DB since midnight
    dailyCostFromDB: 0,
  });

  const socketRef = useRef(null);

  const updateData = useCallback((update) => {
    setData((prev) => ({
      ...prev,
      ...update,
      connected: true,
      lastUpdate: new Date().toISOString(),
    }));
  }, []);

  // Fetch today's accumulated cost from DB on mount to seed the PowerMeter ticker
  useEffect(() => {
    fetch(`${API_URL}/usage/daily-cost`)
      .then((r) => r.json())
      .then((d) => {
        if (d.dailyCost !== undefined) {
          setData((prev) => ({ ...prev, dailyCostFromDB: d.dailyCost }));
        }
      })
      .catch(() => {}); // silent — ticker starts from 0 if unavailable
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to backend');
      setData((prev) => ({ ...prev, connected: true }));
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from backend');
      setData((prev) => ({ ...prev, connected: false }));
    });

    socket.on('initialState', (state) => {
      console.log('📦 Received initial state:', state.devices?.length, 'devices');
      updateData(state);
    });

    socket.on('deviceUpdate', (update) => {
      updateData({
        devices: update.allDevices,
        totalPower: update.totalPower,
        powerByRoom: update.powerByRoom,
        estimatedDailyKWh: update.estimatedDailyKWh,
        alerts: update.alerts,
        ...(update.sensors && { sensors: update.sensors }),
      });
    });

    // ── Live history record pushed by server on every tick / sensor update
    socket.on('usageHistoryUpdate', (payload) => {
      setData((prev) => ({
        ...prev,
        latestHistoryRecord: payload.record,
        lastUpdate: payload.timestamp,
      }));
    });

    return () => {
      if (socket.connected) {
        socket.disconnect();
      } else {
        const cleanup = () => { socket.disconnect(); };
        socket.once('connect', cleanup);
        socket.once('connect_error', cleanup);
      }
    };
  }, [updateData]);

  return data;
}
