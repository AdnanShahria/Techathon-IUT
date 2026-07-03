import { useMemo } from 'react';
import { Map } from 'lucide-react';

/**
 * BONUS: Interactive SVG top-view office floor plan.
 * Shows rooms with tables, chairs, and device states:
 * - Lights glow yellow when ON
 * - Fans spin (via CSS animation) when ON
 * Each room has 3 fans + 3 lights = 6 devices (18 total)
 */
export default function OfficeFloorPlan({ devices }) {
  const roomDevices = useMemo(() => {
    const grouped = {};
    for (const d of devices) {
      if (!grouped[d.room]) grouped[d.room] = { fans: [], lights: [] };
      grouped[d.room][d.type === 'fan' ? 'fans' : 'lights'].push(d);
    }
    return grouped;
  }, [devices]);

  const dr = roomDevices['Drawing Room'] || { fans: [], lights: [] };
  const w1 = roomDevices['Work Room 1'] || { fans: [], lights: [] };
  const w2 = roomDevices['Work Room 2'] || { fans: [], lights: [] };

  const lightColor = (device) => device.status === 'on' ? '#fbbf24' : '#374151';
  const lightGlow = (device) => device.status === 'on' ? 'url(#lightGlow)' : 'none';
  const fanColor = (device) => device.status === 'on' ? '#06b6d4' : '#374151';
  const fanClass = (device) => device.status === 'on' ? 'floorplan-fan-on' : '';

  const defaultDevice = (id, name) => ({ id, name, status: 'off' });

  /** Render a fan blade pattern at position (cx, cy) */
  const renderFan = (device, cx, cy, size = 12) => (
    <g key={device.id}>
      <g className={fanClass(device)} style={{ transformOrigin: `${cx}px ${cy}px` }}>
        {[0, 90, 180, 270].map((angle) => (
          <ellipse key={angle} cx={cx} cy={cy - size * 0.6} rx={size * 0.22} ry={size * 0.5}
            fill={fanColor(device)} opacity={0.8} transform={`rotate(${angle}, ${cx}, ${cy})`} />
        ))}
        <circle cx={cx} cy={cy} r={size * 0.18} fill={fanColor(device)} />
      </g>
      <text x={cx} y={cy + size + 10} textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="Inter, sans-serif">{device.name}</text>
    </g>
  );

  /** Render a light circle at position (cx, cy) */
  const renderLight = (device, cx, cy, r = 7) => (
    <g key={device.id}>
      <circle cx={cx} cy={cy} r={r} fill={lightColor(device)} filter={lightGlow(device)} opacity={device.status === 'on' ? 1 : 0.4} />
      {device.status === 'on' && <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="rgba(251,191,36,0.2)" strokeWidth="1" />}
      <text x={cx} y={cy + r + 11} textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="Inter, sans-serif">{device.name}</text>
    </g>
  );

  /** Render a table */
  const renderTable = (x, y, w, h) => (
    <rect x={x} y={y} width={w} height={h} rx={3} fill="rgba(30,41,59,0.6)" stroke="rgba(71,85,105,0.4)" strokeWidth="1" />
  );

  /** Render a chair */
  const renderChair = (cx, cy) => (
    <circle cx={cx} cy={cy} r={4} fill="rgba(51,65,85,0.6)" stroke="rgba(71,85,105,0.3)" strokeWidth="0.5" />
  );

  /** Render all 6 devices for a room at given positions */
  const renderRoomDevices = (room, fanPositions, lightPositions) => (
    <>
      {fanPositions.map((pos, i) => renderFan(room.fans[i] || defaultDevice(`f${i}`, `Fan ${i+1}`), pos[0], pos[1]))}
      {lightPositions.map((pos, i) => renderLight(room.lights[i] || defaultDevice(`l${i}`, `Light ${i+1}`), pos[0], pos[1]))}
    </>
  );

  return (
    <div className="floorplan-section">
      <h2 className="section-title">
        <span className="section-title-icon emerald"><Map size={16} /></span>
        Office Floor Plan
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
          Top View • Live Device States
        </span>
      </h2>

      <div className="floorplan-card">
        <svg viewBox="0 0 900 320" className="floorplan-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="lightGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ─── Drawing Room ─────────────────── */}
          <g className="floorplan-room">
            <rect x="10" y="10" width="270" height="295" rx="10" fill="rgba(15,23,42,0.8)" stroke="rgba(59,130,246,0.3)" strokeWidth="1.5" />
            <text x="145" y="35" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">Drawing Room</text>

            {/* Furniture */}
            {renderTable(35, 130, 70, 22)}
            {renderTable(35, 185, 70, 22)}
            {renderTable(165, 150, 60, 40)}
            {[55, 85].map((x, i) => <g key={`dc1-${i}`}>{renderChair(x, 122)}{renderChair(x, 215)}</g>)}
            {[180, 210].map((x, i) => <g key={`dc2-${i}`}>{renderChair(x, 142)}{renderChair(x, 198)}</g>)}

            {/* 3 Fans */}
            {renderRoomDevices(dr,
              [[55, 60], [145, 60], [230, 60]],
              [[55, 260], [145, 260], [230, 260]]
            )}

            <line x1="120" y1="305" x2="165" y2="305" stroke="var(--accent-blue)" strokeWidth="3" strokeLinecap="round" />
            <text x="142" y="318" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="Inter, sans-serif">DOOR</text>
          </g>

          {/* ─── Work Room 1 ──────────────────── */}
          <g className="floorplan-room">
            <rect x="310" y="10" width="270" height="295" rx="10" fill="rgba(15,23,42,0.8)" stroke="rgba(16,185,129,0.3)" strokeWidth="1.5" />
            <text x="445" y="35" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">Work Room 1</text>

            {/* Desks */}
            {renderTable(335, 110, 90, 25)}
            {renderTable(335, 175, 90, 25)}
            {renderTable(460, 110, 80, 25)}
            {renderTable(460, 175, 80, 25)}
            {[365, 395].map((x, i) => <g key={`w1c1-${i}`}>{renderChair(x, 102)}{renderChair(x, 208)}</g>)}
            {[485, 515].map((x, i) => <g key={`w1c2-${i}`}>{renderChair(x, 102)}{renderChair(x, 208)}</g>)}

            {/* 3 Fans + 3 Lights */}
            {renderRoomDevices(w1,
              [[355, 58], [445, 58], [530, 58]],
              [[355, 258], [445, 258], [530, 258]]
            )}

            <line x1="420" y1="305" x2="465" y2="305" stroke="var(--accent-emerald)" strokeWidth="3" strokeLinecap="round" />
            <text x="442" y="318" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="Inter, sans-serif">DOOR</text>
          </g>

          {/* ─── Work Room 2 ──────────────────── */}
          <g className="floorplan-room">
            <rect x="610" y="10" width="270" height="295" rx="10" fill="rgba(15,23,42,0.8)" stroke="rgba(249,115,22,0.3)" strokeWidth="1.5" />
            <text x="745" y="35" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">Work Room 2</text>

            {/* Desks */}
            {renderTable(635, 110, 90, 25)}
            {renderTable(635, 175, 90, 25)}
            {renderTable(760, 110, 80, 25)}
            {renderTable(760, 175, 80, 25)}
            {[665, 695].map((x, i) => <g key={`w2c1-${i}`}>{renderChair(x, 102)}{renderChair(x, 208)}</g>)}
            {[785, 815].map((x, i) => <g key={`w2c2-${i}`}>{renderChair(x, 102)}{renderChair(x, 208)}</g>)}

            {/* 3 Fans + 3 Lights */}
            {renderRoomDevices(w2,
              [[655, 58], [745, 58], [830, 58]],
              [[655, 258], [745, 258], [830, 258]]
            )}

            <line x1="720" y1="305" x2="765" y2="305" stroke="var(--accent-orange)" strokeWidth="3" strokeLinecap="round" />
            <text x="742" y="318" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="Inter, sans-serif">DOOR</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
