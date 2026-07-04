import { Flame, Wind } from 'lucide-react';

export default function SensorsPanel({ sensors }) {
  const rooms = ['Drawing Room', 'Work Room 1', 'Work Room 2'];

  return (
    <div className="sensors-section">
      <h2 className="section-title">
        <span className="section-title-icon red">
          <Flame size={16} />
        </span>
        Live Sensors (Per Room)
      </h2>
      <div className="sensors-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
        {rooms.map(room => {
          const data = (sensors && sensors[room]) || { fire: 0, co2: 0 };
          const isFireDanger = data.fire >= 1024;
          const isCo2Danger = data.co2 >= 800;
          const isDanger = isFireDanger || isCo2Danger;

          return (
            <div key={room} className={`sensor-card ${isDanger ? 'danger' : 'safe'}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8, color: 'var(--text-primary)' }}>{room}</div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {/* Fire */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Flame size={18} className={isFireDanger ? 'text-red' : 'text-green'} />
                    <span style={{ fontSize: '0.9rem' }}>{data.fire} lvl</span>
                  </div>
                  {/* CO2 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wind size={18} className={isCo2Danger ? 'text-orange' : 'text-green'} />
                    <span style={{ fontSize: '0.9rem' }}>{data.co2} ppm</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                <span className="sensor-status" style={{ fontSize: '0.85rem' }}>
                  {isFireDanger ? 'FIRE DETECTED' : isCo2Danger ? 'POOR AIR' : 'ALL CLEAR'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
