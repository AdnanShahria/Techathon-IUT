import { useEffect, useState, useRef } from 'react';
import { Zap, TrendingUp, Power } from 'lucide-react';

/**
 * Power consumption meter with:
 * - Large total wattage display
 * - Per-room progress bars
 * - Daily kWh estimate and device count stats
 * - Live daily cost ticker seeded from real DB data
 *
 * Props:
 *   totalPower        {number}   Current total watts
 *   powerByRoom       {object}   { roomName: watts }
 *   estimatedDailyKWh {number}   kWh estimate for today
 *   devices           {array}    All device objects
 *   dailyCostFromDB   {number}   Today's accumulated cost from DB (seeds ticker)
 *   onLiveBillChange  {function} Called with latest liveBill value each tick
 */
export default function PowerMeter({
  totalPower,
  powerByRoom,
  estimatedDailyKWh,
  devices,
  dailyCostFromDB = 0,
  onLiveBillChange,
}) {
  const [liveBill, setLiveBill] = useState(0);
  const seededRef = useRef(false);

  // Seed bill from real DB accumulated cost (once, when available)
  useEffect(() => {
    if (!seededRef.current && dailyCostFromDB > 0) {
      seededRef.current = true;
      setLiveBill(dailyCostFromDB);
    }
  }, [dailyCostFromDB]);

  // Tick up every second based on current wattage
  useEffect(() => {
    const interval = setInterval(() => {
      // cost per second = (watts / 1000) * 9 tk / 3600 seconds
      const costPerSec = (totalPower / 1000) * (9 / 3600);
      setLiveBill((prev) => {
        const next = prev + costPerSec;
        onLiveBillChange?.(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [totalPower, onLiveBillChange]);

  const maxRoomPower = 570; // 2×240W fans + 3×30W lights = 570W max per room
  const maxTotalPower = maxRoomPower * 3; // 1710W theoretical max

  const devicesOn = devices?.filter((d) => d.status === 'on').length || 0;
  const totalDevices = devices?.length || 15;

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
            <div
              className="power-stat-value"
              style={{
                color: '#4ade80',
                textShadow: '0 0 4px rgba(74, 222, 128, 0.3), 0 0 8px rgba(74, 222, 128, 0.15)',
              }}
            >
              <Zap size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              {liveBill.toFixed(4)} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>tk</span>
            </div>
            <div className="power-stat-label">Daily cost</div>
          </div>
          <div className="power-stat">
            <div className="power-stat-value" style={{ color: 'var(--accent-cyan)' }}>
              <Power size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              {devicesOn}/{totalDevices}
            </div>
            <div className="power-stat-label">Devices Active</div>
          </div>
          <div className="power-stat" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div className="power-stat-value" style={{ color: '#4ade80' }}>
              9 Tk
            </div>
            <div className="power-stat-label">1 Unit (kWh)</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>RESETS AT 12 AM</div>
          </div>
        </div>
      </div>
    </div>
  );
}
