import { useSocket } from './hooks/useSocket';
import Header from './components/Header';
import DevicePanel from './components/DevicePanel';
import PowerMeter from './components/PowerMeter';
import AlertsPanel from './components/AlertsPanel';
import OfficeFloorPlan from './components/OfficeFloorPlan';
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
        <DevicePanel devices={devices} powerByRoom={powerByRoom} />

        {/* Row 2: Power meter + Alerts side by side */}
        <PowerMeter
          totalPower={totalPower}
          powerByRoom={powerByRoom}
          estimatedDailyKWh={estimatedDailyKWh}
          devices={devices}
        />

        <AlertsPanel alerts={alerts} />

        {/* Row 3: Floor plan (BONUS) */}
        <OfficeFloorPlan devices={devices} />
      </div>
    </div>
  );
}
