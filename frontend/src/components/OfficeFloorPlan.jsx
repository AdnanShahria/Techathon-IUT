import { useMemo } from 'react';
import { Map } from 'lucide-react';

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

  const defaultDevice = (id, name) => ({ id, name, status: 'off' });

  // Realistic light colors
  const lightColor = (device) => device.status === 'on' ? '#fbbf24' : '#e2e8f0';
  const lightGlow = (device) => device.status === 'on' ? 'url(#lightGlow)' : 'none';
  
  // Ceiling fans (brown/black like in the image)
  const fanColor = (device) => '#3e2723';
  const fanClass = (device) => device.status === 'on' ? 'floorplan-fan-on' : '';

  /** Render a highly realistic 3-blade ceiling fan */
  const renderFan = (device, cx, cy, size = 18) => (
    <g key={device.id} style={{ pointerEvents: 'none' }}>
      <g className={fanClass(device)} style={{ transformOrigin: `${cx}px ${cy}px` }}>
        {[0, 120, 240].map((angle) => (
          <path
            key={angle}
            d={`M ${cx} ${cy} Q ${cx - 5} ${cy - size} ${cx} ${cy - size * 1.2} Q ${cx + 5} ${cy - size} ${cx} ${cy}`}
            fill={fanColor()}
            opacity={0.9}
            transform={`rotate(${angle}, ${cx}, ${cy})`}
            filter="drop-shadow(2px 4px 4px rgba(0,0,0,0.4))"
          />
        ))}
        <circle cx={cx} cy={cy} r={size * 0.25} fill="#5d4037" filter="drop-shadow(1px 2px 2px rgba(0,0,0,0.5))" />
      </g>
      {/* Device label with readable backdrop */}
      <rect x={cx - 15} y={cy + size + 2} width={30} height={10} fill="rgba(255,255,255,0.7)" rx={2} />
      <text x={cx} y={cy + size + 9} textAnchor="middle" fill="#1e293b" fontSize="7" fontWeight="bold" fontFamily="var(--font-mono)">
        {device.name.toUpperCase()}
      </text>
    </g>
  );

  /** Render a realistic warm light */
  const renderLight = (device, cx, cy, r = 9) => (
    <g key={device.id}>
      {device.status === 'on' && (
        <circle cx={cx} cy={cy} r={r * 2.5} fill="rgba(251,191,36,0.3)" filter="blur(8px)" />
      )}
      <circle cx={cx} cy={cy} r={r} fill={lightColor(device)} filter={lightGlow(device)} stroke="#d1d5db" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r - 2} fill={device.status === 'on' ? '#fde047' : '#f8fafc'} />
      <rect x={cx - 15} y={cy + r + 2} width={30} height={10} fill="rgba(255,255,255,0.7)" rx={2} />
      <text x={cx} y={cy + r + 9} textAnchor="middle" fill="#1e293b" fontSize="7" fontWeight="bold" fontFamily="var(--font-mono)">
        {device.name.toUpperCase()}
      </text>
    </g>
  );

  /** Realistic Wooden Desk with PC */
  const renderDesk = (x, y, w = 45, h = 30) => (
    <g>
      {/* Desk surface */}
      <rect x={x} y={y} width={w} height={h} rx={2} fill="#d7a976" stroke="#8b5a2b" strokeWidth="1" filter="drop-shadow(2px 3px 3px rgba(0,0,0,0.3))" />
      {/* Monitor */}
      <rect x={x + w / 2 - 12} y={y + 4} width={24} height={6} rx={1} fill="#111827" />
      {/* Keyboard */}
      <rect x={x + w / 2 - 10} y={y + 16} width={20} height={5} rx={1} fill="#e2e8f0" />
      {/* Chair (tucked under) */}
      <circle cx={x + w / 2} cy={y + h + 8} r={7} fill="#334155" stroke="#0f172a" strokeWidth="1" filter="drop-shadow(1px 2px 2px rgba(0,0,0,0.3))" />
    </g>
  );

  /** Upward facing desk */
  const renderDeskUp = (x, y, w = 45, h = 30) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={2} fill="#d7a976" stroke="#8b5a2b" strokeWidth="1" filter="drop-shadow(2px 3px 3px rgba(0,0,0,0.3))" />
      <rect x={x + w / 2 - 12} y={y + h - 10} width={24} height={6} rx={1} fill="#111827" />
      <rect x={x + w / 2 - 10} y={y + h - 21} width={20} height={5} rx={1} fill="#e2e8f0" />
      <circle cx={x + w / 2} cy={y - 8} r={7} fill="#334155" stroke="#0f172a" strokeWidth="1" filter="drop-shadow(1px -2px 2px rgba(0,0,0,0.3))" />
    </g>
  );

  /** Sofa and Table for Drawing Room */
  const renderDrawingFurniture = () => (
    <g>
      {/* Rug */}
      <rect x={70} y={110} width={130} height={180} rx={4} fill="#d5c8b5" opacity="0.8" />
      {/* Large Sofa on left wall */}
      <rect x={25} y={100} width={35} height={180} rx={5} fill="#d4c3ac" stroke="#bca88f" strokeWidth="1.5" filter="drop-shadow(3px 0px 4px rgba(0,0,0,0.2))" />
      <rect x={40} y={110} width={20} height={50} rx={3} fill="#e6d5bc" />
      <rect x={40} y={165} width={20} height={50} rx={3} fill="#e6d5bc" />
      <rect x={40} y={220} width={20} height={50} rx={3} fill="#e6d5bc" />
      
      {/* Coffee Table */}
      <rect x={100} y={140} width={35} height={90} rx={2} fill="#8d6e63" stroke="#5d4037" strokeWidth="1" filter="drop-shadow(2px 4px 4px rgba(0,0,0,0.3))" />
      
      {/* Armchair bottom left */}
      <g transform="translate(45, 300) rotate(-30)">
        <rect x={0} y={0} width={40} height={40} rx={5} fill="#d4c3ac" stroke="#bca88f" strokeWidth="1.5" filter="drop-shadow(2px 2px 3px rgba(0,0,0,0.2))" />
        <rect x={10} y={10} width={20} height={20} rx={2} fill="#e6d5bc" />
      </g>
    </g>
  );

  /** Decorative Plant */
  const renderPlant = (cx, cy) => (
    <g filter="drop-shadow(2px 2px 3px rgba(0,0,0,0.4))">
      <circle cx={cx} cy={cy} r={12} fill="#4caf50" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <path key={angle} d={`M ${cx} ${cy} Q ${cx-10} ${cy-5} ${cx} ${cy-16} Q ${cx+10} ${cy-5} ${cx} ${cy}`} fill="#2e7d32" transform={`rotate(${angle}, ${cx}, ${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r={6} fill="#1b5e20" />
    </g>
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

      <div className="floorplan-card" style={{ background: '#0F172A', padding: '16px' }}>
        <svg viewBox="0 0 900 450" className="floorplan-svg" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', borderRadius: '8px' }}>
          <defs>
            <filter id="lightGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <pattern id="tilePattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#f1f5f9" />
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            </pattern>
            <pattern id="woodPattern" width="60" height="20" patternUnits="userSpaceOnUse">
              <rect width="60" height="20" fill="#dcb184" />
              <path d="M 0 0 L 60 0 M 30 10 L 90 10" fill="none" stroke="#c09467" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Wall background / Outline */}
          <rect x="0" y="0" width="900" height="450" fill="#334155" rx="8" />

          {/* ─── Drawing Room ─────────────────── */}
          <g>
            <rect x="15" y="15" width="280" height="340" fill="#f5ebe0" />
            <text x="155" y="45" textAnchor="middle" fill="#334155" fontSize="14" fontWeight="800" fontFamily="var(--font-mono)" letterSpacing="2">DRAWING ROOM</text>
            {renderPlant(40, 45)}
            {renderPlant(270, 330)}
            {renderDrawingFurniture()}
            
            {/* Devices: 2 Fans, 3 Lights */}
            {renderFan(dr.fans[0] || defaultDevice('f1', 'Fan 1'), 155, 95)}
            {renderFan(dr.fans[1] || defaultDevice('f2', 'Fan 2'), 155, 275)}
            {renderLight(dr.lights[0] || defaultDevice('l1', 'Light 1'), 90, 50)}
            {renderLight(dr.lights[1] || defaultDevice('l2', 'Light 2'), 220, 50)}
            {renderLight(dr.lights[2] || defaultDevice('l3', 'Light 3'), 155, 330)}
            
            {/* Door to corridor */}
            <path d="M 230 355 A 45 45 0 0 1 185 400 L 185 355 Z" fill="rgba(0,0,0,0.1)" stroke="#1e293b" strokeWidth="1.5" />
          </g>

          {/* ─── Work Room 1 (Tile) ───────────── */}
          <g>
            <rect x="310" y="15" width="280" height="340" fill="url(#tilePattern)" />
            <text x="450" y="45" textAnchor="middle" fill="#334155" fontSize="14" fontWeight="800" fontFamily="var(--font-mono)" letterSpacing="2">WORK ROOM 1</text>
            
            {renderDesk(340, 110, 80, 45)}
            {renderDeskUp(340, 220, 80, 45)}
            {renderDesk(480, 110, 80, 45)}
            {renderDeskUp(480, 220, 80, 45)}
            
            {/* Devices: 2 Fans, 3 Lights */}
            {renderFan(w1.fans[0] || defaultDevice('f3', 'Fan 1'), 450, 95)}
            {renderFan(w1.fans[1] || defaultDevice('f4', 'Fan 2'), 450, 275)}
            {renderLight(w1.lights[0] || defaultDevice('l4', 'Light 1'), 380, 50)}
            {renderLight(w1.lights[1] || defaultDevice('l5', 'Light 2'), 520, 50)}
            {renderLight(w1.lights[2] || defaultDevice('l6', 'Light 3'), 450, 330)}
            
            {/* Door to corridor */}
            <path d="M 400 355 A 45 45 0 0 1 355 400 L 355 355 Z" fill="rgba(0,0,0,0.1)" stroke="#1e293b" strokeWidth="1.5" />
          </g>

          {/* ─── Work Room 2 (Wood) ───────────── */}
          <g>
            <rect x="605" y="15" width="280" height="340" fill="url(#woodPattern)" />
            <text x="745" y="45" textAnchor="middle" fill="#334155" fontSize="14" fontWeight="800" fontFamily="var(--font-mono)" letterSpacing="2">WORK ROOM 2</text>
            
            {renderDesk(635, 110, 80, 45)}
            {renderDeskUp(635, 220, 80, 45)}
            {renderDesk(775, 110, 80, 45)}
            {renderDeskUp(775, 220, 80, 45)}
            
            {/* Devices: 2 Fans, 3 Lights */}
            {renderFan(w2.fans[0] || defaultDevice('f5', 'Fan 1'), 745, 95)}
            {renderFan(w2.fans[1] || defaultDevice('f6', 'Fan 2'), 745, 275)}
            {renderLight(w2.lights[0] || defaultDevice('l7', 'Light 1'), 675, 50)}
            {renderLight(w2.lights[1] || defaultDevice('l8', 'Light 2'), 815, 50)}
            {renderLight(w2.lights[2] || defaultDevice('l9', 'Light 3'), 745, 330)}
            
            {/* Door to corridor */}
            <path d="M 695 355 A 45 45 0 0 1 650 400 L 650 355 Z" fill="rgba(0,0,0,0.1)" stroke="#1e293b" strokeWidth="1.5" />
          </g>

          {/* ─── Corridor ─────────────────────── */}
          <g>
            <rect x="15" y="370" width="870" height="65" fill="#f5ebe0" />
            {renderPlant(850, 400)}
            
            {/* Main Entrance Door */}
            <path d="M 450 435 A 45 45 0 0 0 495 390 L 450 390 Z" fill="rgba(0,0,0,0.1)" stroke="#1e293b" strokeWidth="1.5" />
            <text x="450" y="465" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold" fontFamily="var(--font-mono)">
              ↑ ENTRY
            </text>
          </g>
          
          {/* Walls overlay (thick lines) */}
          <path d="M 15 15 L 885 15 M 15 355 L 885 355 M 15 435 L 885 435 M 15 15 L 15 435 M 295 15 L 295 355 M 310 15 L 310 355 M 590 15 L 590 355 M 605 15 L 605 355 M 885 15 L 885 435" fill="none" stroke="#1e293b" strokeWidth="4" />
        </svg>
      </div>
    </div>
  );
}
