import { useEffect, useState } from 'react';
import { Zap, TrendingUp, Power } from 'lucide-react';

/**
 * Power consumption meter with:
 * - Large total wattage display
 * - Per-room progress bars
 * - Daily kWh estimate and device count stats
 */
export default function PowerMeter({ totalPower, powerByRoom, estimatedDailyKWh, devices }) {
  const [liveBill, setLiveBill] = useState(0);

  // Initialize bill from current est or 0, then tick up
  useEffect(() => {
    if (estimatedDailyKWh && liveBill === 0) {
      // Start the bill at a proportional amount of the daily estimate based on the time of day
      const now = new Date();
      const fractionOfDay = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;
      setLiveBill(estimatedDailyKWh * 0.12 * fractionOfDay);
    }
  }, [estimatedDailyKWh]);

  useEffect(() => {
    const interval = setInterval(() => {
      // cost per second = (watts / 1000) * $0.12 / 3600
      const costPerSec = (totalPower / 1000) * (0.12 / 3600);
      setLiveBill(prev => prev + costPerSec);
    }, 1000);
    return () => clearInterval(interval);
  }, [totalPower]);
  const maxRoomPower = 225; // 3×60W fans + 3×15W lights = 225W max per room
  const maxTotalPower = maxRoomPower * 3; // 495W theoretical max

  const devicesOn = devices?.filter(d => d.status === 'on').length || 0;
  const totalDevices = devices?.length || 18;

  const roomColors = ['room-0', 'room-1', 'room-2'];
  const roomEntries = Object.entries(powerByRoom || {});

  return (
    <div className="power-section">
      <h2 className="section-title">
        <span className="section-title-icon amber">
          <Zap size={16} />
        </span>
        Power Consumption
      </h2>

      <div className="power-card">
        {/* Big total number */}
        <div className="power-total">
          <div>
            <span className="power-total-value">{totalPower}</span>
            <span className="power-total-unit">W</span>
          </div>
          <div className="power-total-label">Current total draw</div>
        </div>

        {/* Per-room bars */}
        <div className="power-rooms">
          {roomEntries.map(([room, watts], index) => (
            <div key={room} className="power-room-item">
              <span className="power-room-name">{room}</span>
              <div className="power-room-bar-container">
                <div
                  className={`power-room-bar ${roomColors[index]}`}
                  style={{ width: `${Math.min((watts / maxRoomPower) * 100, 100)}%` }}
                />
              </div>
              <span className="power-room-value">{watts}W</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="power-stats">
          <div className="power-stat">
            <div className="power-stat-value" style={{ color: 'var(--accent-amber)' }}>
              <TrendingUp size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              {estimatedDailyKWh || 0}
            </div>
            <div className="power-stat-label">Est. Daily kWh</div>
          </div>
          <div className="power-stat">
            <div className="power-stat-value" style={{ color: 'var(--accent-green)' }}>
              <Zap size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              ${liveBill.toFixed(6)}
            </div>
            <div className="power-stat-label">Live Session Cost</div>
          </div>
          <div className="power-stat">
            <div className="power-stat-value" style={{ color: 'var(--accent-cyan)' }}>
              <Power size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              {devicesOn}/{totalDevices}
            </div>
            <div className="power-stat-label">Devices Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}
