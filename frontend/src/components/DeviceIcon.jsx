import { Fan, Lightbulb } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Device icon component with animations:
 * - Fans spin when ON
 * - Lights glow when ON
 */
export default function DeviceIcon({ device }) {
  const [isOn, setIsOn] = useState(device.status === 'on');
  const isFan = device.type === 'fan';
  const statusClass = isOn ? 'on' : 'off';

  // Sync with props if server updates it
  useEffect(() => {
    setIsOn(device.status === 'on');
  }, [device.status]);

  const toggleDevice = async (e) => {
    e.stopPropagation();
    
    // Optimistic UI update
    const newStatus = !isOn;
    setIsOn(newStatus);

    try {
      const API_URL = import.meta.env.DEV ? 'http://localhost:4000/api' : '/api';
      await fetch(`${API_URL}/devices/${device.id}/toggle`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Failed to toggle device:', err);
      setIsOn(!newStatus); // revert on failure
    }
  };

  return (
    <div
      className={`device-item ${statusClass}`}
      onClick={toggleDevice}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div className={`device-icon ${device.type} ${statusClass}`}>
        {isFan ? (
          <Fan size={20} strokeWidth={2} />
        ) : (
          <Lightbulb size={20} strokeWidth={2} />
        )}
      </div>
      <span className="device-label">{device.name}</span>
      <div className={`toggle-switch ${statusClass}`}>
        <div className="toggle-thumb" />
      </div>
    </div>
  );
}
