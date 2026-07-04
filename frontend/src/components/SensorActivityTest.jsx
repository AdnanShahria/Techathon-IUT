import { useState, useEffect } from 'react';
import { ShieldAlert, Flame, Wind, RefreshCw } from 'lucide-react';

export default function SensorActivityTest() {
  const [room, setRoom] = useState('Drawing Room');
  const [fire, setFire] = useState(0);
  const [co2, setCo2] = useState(400);

  const fetchCurrentSensors = async () => {
    try {
      const API_URL = import.meta.env.DEV ? 'http://localhost:4000/api' : '/api';
      const res = await fetch(`${API_URL}/sensors`);
      const data = await res.json();
      if (data[room]) {
        setFire(data[room].fire);
        setCo2(data[room].co2);
      } else {
        setFire(0);
        setCo2(400);
      }
    } catch (err) {
      console.error('Failed to fetch sensors', err);
    }
  };

  useEffect(() => {
    fetchCurrentSensors();
  }, [room]);

  const handleSend = async () => {
    try {
      const API_URL = import.meta.env.DEV ? 'http://localhost:4000/api' : '/api';
      await fetch(`${API_URL}/sensors/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, fire, co2 }),
      });
    } catch (err) {
      console.error('Failed to update sensors', err);
    }
  };

  return (
    <div className="sensor-test-section" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
      <h2 className="section-title">
        <span className="section-title-icon red"><ShieldAlert size={16} /></span>
        Sensor Activity Simulation & Testing
      </h2>

      <div className="sensor-test-card" style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '2rem', alignItems: 'center', minWidth: '800px' }}>
        
        {/* Room Selection */}
        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target Room</label>
          <select 
            value={room} 
            onChange={(e) => setRoom(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outline: 'none' }}
          >
            <option value="Drawing Room">Drawing Room</option>
            <option value="Work Room 1">Work Room 1</option>
            <option value="Work Room 2">Work Room 2</option>
          </select>
        </div>

        {/* Fire/Smoke Slider */}
        <div style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={16} color={fire >= 1024 ? '#ef4444' : 'var(--text-muted)'} /> 
              Fire/Smoke Level (Alert &gt;= 1024)
            </label>
            <span style={{ fontWeight: 'bold', color: fire >= 1024 ? '#ef4444' : 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{fire}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="2000" 
            value={fire} 
            onChange={(e) => setFire(Number(e.target.value))} 
            style={{ width: '100%', cursor: 'pointer', accentColor: fire >= 1024 ? '#ef4444' : 'var(--accent-blue)' }}
          />
        </div>

        {/* CO2 Slider */}
        <div style={{ flex: '2 1 200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wind size={16} color={co2 >= 800 ? '#f59e0b' : 'var(--text-muted)'} /> 
              CO2 Level (Alert &gt;= 800)
            </label>
            <span style={{ fontWeight: 'bold', color: co2 >= 800 ? '#f59e0b' : 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{co2} ppm</span>
          </div>
          <input 
            type="range" 
            min="400" 
            max="2000" 
            value={co2} 
            onChange={(e) => setCo2(Number(e.target.value))} 
            style={{ width: '100%', cursor: 'pointer', accentColor: co2 >= 800 ? '#f59e0b' : 'var(--accent-blue)' }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end', paddingBottom: '2px', gap: '12px' }}>
          <button 
            onClick={fetchCurrentSensors}
            title="Refresh values from server"
            style={{ 
              padding: '0.75rem', 
              borderRadius: '8px', 
              background: 'rgba(255,255,255,0.1)', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border-subtle)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RefreshCw size={20} />
          </button>
          
          <button 
            onClick={handleSend}
            style={{ 
              padding: '0.75rem 1.5rem', 
              borderRadius: '8px', 
              background: 'var(--accent-blue)', 
              color: 'white', 
              border: 'none', 
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Update
          </button>
        </div>

        </div>
      </div>
    </div>
  );
}
