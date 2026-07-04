import { LayoutGrid } from 'lucide-react';
import RoomCard from './RoomCard';

/**
 * Device panel showing all 3 rooms with their devices.
 * Groups devices by room and calculates per-room power.
 */
export default function DevicePanel({ devices, powerByRoom, sensors }) {
  // Group devices by room
  const rooms = {};
  for (const device of devices) {
    if (!rooms[device.room]) rooms[device.room] = [];
    rooms[device.room].push(device);
  }

  const roomOrder = ['Drawing Room', 'Work Room 1', 'Work Room 2'];

  return (
    <div className="rooms-section">
      <h2 className="section-title">
        <span className="section-title-icon blue">
          <LayoutGrid size={16} />
        </span>
        Live Device Status
      </h2>

      <div className="rooms-grid">
        {roomOrder.map((roomName) => (
          <RoomCard
            key={roomName}
            roomName={roomName}
            devices={rooms[roomName] || []}
            power={powerByRoom?.[roomName] || 0}
            sensors={sensors?.[roomName] || { fire: 0, co2: 0 }}
          />
        ))}
      </div>
    </div>
  );
}
