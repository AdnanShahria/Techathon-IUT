import { Fan, Lightbulb } from 'lucide-react';

/**
 * Device icon component with animations:
 * - Fans spin when ON
 * - Lights glow when ON
 */
export default function DeviceIcon({ device }) {
  const isOn = device.status === 'on';
  const isFan = device.type === 'fan';
  const statusClass = isOn ? 'on' : 'off';

  return (
    <div className={`device-item ${statusClass}`}>
      <div className={`device-icon ${device.type} ${statusClass}`}>
        {isFan ? (
          <Fan size={20} strokeWidth={2} />
        ) : (
          <Lightbulb size={20} strokeWidth={2} />
        )}
      </div>
      <span className="device-label">{device.name}</span>
    </div>
  );
}
