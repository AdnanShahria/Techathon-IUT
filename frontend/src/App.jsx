import { useState, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import Header from './components/Header';
import DevicePanel from './components/DevicePanel';
import PowerMeter from './components/PowerMeter';
import AlertsPanel from './components/AlertsPanel';
import SensorsPanel from './components/SensorsPanel';
import HistoryPanel from './components/HistoryPanel';
import OfficeFloorPlan from './components/OfficeFloorPlan';
import SensorActivityTest from './components/SensorActivityTest';
import './index.css';

/**
 * Smart Office Monitor — Main Dashboard
 *
 * Real-time monitoring of 15 devices (fans + lights) across 3 office rooms.
 * Connected via WebSocket to the backend for live updates.
 * Power Usage History reads from real Turso DB via range-aggregated queries.
 */
export default function App() {
  const {
    devices,
    totalPower,
    powerByRoom,
    estimatedDailyKWh,
    alerts,
    sensors,
    lastUpdate,
    connected,
    latestHistoryRecord,
    dailyCostFromDB,
  } = useSocket();

  // Lift liveBill from PowerMeter so HistoryPanel can show the same live cost
  const [liveDailyCost, setLiveDailyCost] = useState(0);
  const handleLiveBillChange = useCallback((bill) => {
    setLiveDailyCost(bill);
  }, []);

  const devicesOn = devices.filter((d) => d.status === 'on').length;

  return (
    <div className="app">
      <Header
        totalPower={totalPower}
        devicesOn={devicesOn}
        connected={connected}
      />

      <div className="dashboard-grid">
        {/* Row 1: Room device cards */}
        <DevicePanel devices={devices} powerByRoom={powerByRoom} sensors={sensors} />

        {/* Row 2: Power/Alerts split */}
        <div className="dashboard-row-split" style={{ gridColumn: '1 / -1', alignItems: 'stretch' }}>
          <PowerMeter
            totalPower={totalPower}
            powerByRoom={powerByRoom}
            estimatedDailyKWh={estimatedDailyKWh}
            devices={devices}
            dailyCostFromDB={dailyCostFromDB}
            onLiveBillChange={handleLiveBillChange}
          />
          <AlertsPanel alerts={alerts} />
        </div>

        {/* Row 3: History Panel (Full Width) — real DB data, live real-time */}
        <div style={{ gridColumn: '1 / -1' }}>
          <HistoryPanel
            latestHistoryRecord={latestHistoryRecord}
            liveDailyCost={liveDailyCost}
          />
        </div>

        {/* Row 4: Floor plan (BONUS) */}
        <OfficeFloorPlan devices={devices} />

        {/* Row 5: Sensor Testing Panel (Full Width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <SensorActivityTest />
        </div>
      </div>

      <footer style={{
        textAlign: 'center',
        padding: '2rem 1rem',
        marginTop: '2rem',
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        All Rights reserved by IUT Robotic Society and{' '}
        <a
          href="https://orbitsaas.cloud"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s ease' }}
          onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'}
          onMouseOut={(e) => e.target.style.color = 'var(--accent-blue)'}
        >
          Orbit SaaS
        </a>.
      </footer>
    </div>
  );
}
