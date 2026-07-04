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
 * Real-time monitoring of 18 devices (fans + lights) across 3 office rooms.
 * Connected via WebSocket to the backend for live updates.
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
  } = useSocket();

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
          />
          <AlertsPanel alerts={alerts} />
        </div>

        {/* Row 3: History Panel (Full Width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <HistoryPanel lastUpdate={lastUpdate} />
        </div>

        {/* Row 4: Floor plan (BONUS) */}
        <OfficeFloorPlan devices={devices} />

        {/* Row 5: Sensor Testing Panel (Full Width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <SensorActivityTest />
        </div>
      </div>
    </div>
  );
}
