import DeviceIcon from './DeviceIcon';

/**
 * Card displaying a single room's devices with power badge.
 */
export default function RoomCard({ roomName, devices, power }) {
  const isActive = power > 0;

  return (
    <div className="room-card">
      <div className="room-card-header">
        <h3 className="room-name">{roomName}</h3>
        <span className={`room-power-badge ${isActive ? 'active' : 'idle'}`}>
          {isActive ? `${power}W` : 'IDLE'}
        </span>
      </div>

      <div className="room-devices">
        {devices.map((device) => (
          <DeviceIcon key={device.id} device={device} />
        ))}
      </div>
    </div>
  );
}
