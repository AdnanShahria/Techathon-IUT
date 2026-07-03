import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.DEV
  ? 'http://localhost:4000'
  : window.location.origin;

/**
 * WebSocket hook that connects to the backend Socket.IO server.
 * Receives initial state on connect and live updates as devices toggle.
 */
export function useSocket() {
  const [data, setData] = useState({
    devices: [],
    totalPower: 0,
    powerByRoom: {},
    estimatedDailyKWh: 0,
    devicesOn: 0,
    alerts: [],
    connected: false,
    lastUpdate: null,
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
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [updateData]);

  return data;
}
