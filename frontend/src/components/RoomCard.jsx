import DeviceIcon from './DeviceIcon';
import { Flame, Wind, ShieldCheck, AlertTriangle } from 'lucide-react';

/**
 * Card displaying a single room's devices with power badge and sensor status.
 */
export default function RoomCard({ roomName, devices, power, sensors }) {
  const isActive = power > 0;
  
  // Sensors data
  const { fire = 0, co2 = 0 } = sensors || {};
  const isFireDanger = fire >= 1024;
  const isCo2Danger = co2 >= 800;
  const hasDanger = isFireDanger || isCo2Danger;

  return (
    <div className={`room-card ${hasDanger ? 'danger' : ''}`} style={hasDanger ? { borderColor: '#ff453a', background: 'rgba(255, 69, 58, 0.05)' } : {}}>
      <div className="room-card-header" style={{ alignItems: 'center' }}>
        <h3 className="room-name">{roomName}</h3>
        <span className={`room-power-badge ${isActive ? 'active' : 'idle'}`}>
          {isActive ? `${power}W` : 'IDLE'}
        </span>
      </div>

      <div className="room-devices">
        {/* Sensor block acting like a device icon */}
        <div 
          className="device-item" 
          style={{ 
            cursor: 'default', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderColor: hasDanger ? '#ff453a' : 'rgba(255, 255, 255, 0.05)',
            background: hasDanger ? 'rgba(255, 69, 58, 0.1)' : 'rgba(255,255,255,0.02)'
          }}
        >
          <div className="device-icon" style={{ 
            color: hasDanger ? '#ff453a' : '#10b981', 
            background: hasDanger ? 'rgba(255, 69, 58, 0.2)' : 'rgba(16, 185, 129, 0.1)',
            boxShadow: hasDanger ? '0 0 15px rgba(255, 69, 58, 0.4)' : 'none'
          }}>
            {hasDanger ? <AlertTriangle size={20} strokeWidth={2} /> : <ShieldCheck size={20} strokeWidth={2} />}
          </div>
          <span className="device-label">Sensors</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginTop: '6px', fontSize: '0.65rem' }}>
            <span style={{ color: isFireDanger ? '#ff453a' : 'var(--text-muted)' }}>🔥 {fire}</span>
            <span style={{ color: isCo2Danger ? '#ff9f0a' : 'var(--text-muted)' }}>💨 {co2}</span>
          </div>
        </div>

        {devices.map((device) => (
          <DeviceIcon key={device.id} device={device} />
        ))}
      </div>
    </div>
  );
}
