import { useEffect, useState } from 'react';
import { History, Maximize2, X, BarChart2, List } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function HistoryPanel({ lastUpdate }) {
  const [history, setHistory] = useState([]);
  const [viewMode, setViewMode] = useState('graph'); // 'graph' or 'data'
  const [timeRange, setTimeRange] = useState('Hourly');
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const API_URL = import.meta.env.DEV ? 'http://localhost:4000/api' : '/api';
        const res = await fetch(`${API_URL}/usage/history`);
        const data = await res.json();
        if (data.history) setHistory(data.history);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
    };
    fetchHistory();
  }, [lastUpdate]);

  // Generate mock data for extended timelines based on selected range
  const getGraphData = () => {
    if (timeRange === 'Hourly') {
      return history.map(h => ({
        time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        power: h.total_power_watts,
      })).reverse();
    }
    
    // Mock data for longer ranges
    const data = [];
    const points = timeRange === 'Daily' ? 24 : timeRange === 'Weekly' ? 7 : timeRange === 'Monthly' ? 30 : 12;
    const labels = timeRange === 'Daily' ? Array.from({length: 24}, (_, i) => `${i}:00`) :
                   timeRange === 'Weekly' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                   timeRange === 'Monthly' ? Array.from({length: 30}, (_, i) => `${i+1}`) :
                   ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                   
    let base = 500;
    for (let i = 0; i < points; i++) {
      base += (Math.random() - 0.5) * 300;
      data.push({ time: labels[i], power: Math.max(100, Math.round(base)) });
    }
    return data;
  };

  const graphData = getGraphData();

  const renderContent = (height = 250) => (
    <>
      {/* View Toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
          <button 
            onClick={() => setViewMode('graph')}
            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: viewMode === 'graph' ? 'var(--accent-blue)' : 'transparent', color: viewMode === 'graph' ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}>
            <BarChart2 size={14} /> Graph
          </button>
          <button 
            onClick={() => setViewMode('data')}
            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: viewMode === 'data' ? 'var(--accent-blue)' : 'transparent', color: viewMode === 'data' ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}>
            <List size={14} /> Data
          </button>
        </div>
        
        {viewMode === 'graph' && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {['Hourly', 'Daily', 'Weekly', 'Monthly', 'Yearly'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid', borderColor: timeRange === range ? 'var(--accent-blue)' : 'transparent', background: timeRange === range ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: timeRange === range ? 'var(--accent-blue)' : 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500 }}
              >
                {range}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: height, overflow: 'hidden' }}>
        {viewMode === 'graph' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="power" stroke="var(--accent-blue)" strokeWidth={2} fillOpacity={1} fill="url(#colorPower)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', overflowY: 'auto', paddingRight: '8px' }}>
            {history.length === 0 ? (
              <div className="history-empty" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No history recorded yet.</div>
            ) : (
              history.map((record, idx) => {
                const time = new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                return (
                  <div key={record.id} className="history-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.03)' : 'transparent', borderRadius: '8px', transition: 'background 0.2s', cursor: 'pointer' }}>
                    <div className="history-time" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{time}</div>
                    <div className="history-details" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent-amber)', fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>{record.total_power_watts}W</span>
                      <span className="history-sub" style={{ opacity: 0.6, fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                        {record.devices_on} ON
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <div className="history-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h2 className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="section-title-icon" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
              <History size={16} />
            </span>
            Power Usage History
          </div>
          <button 
            onClick={() => setIsZoomed(true)}
            style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            title="Maximize"
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-glass-hover)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
          >
            <Maximize2 size={16} />
          </button>
        </h2>
        
        <div className="history-card" style={{ flex: 1, height: '350px', display: 'flex', flexDirection: 'column', padding: '1rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          {renderContent('100%')}
        </div>
      </div>

      {/* Zoom Modal */}
      {isZoomed && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', animation: 'fade-in 0.3s ease-out' }}>
          <div style={{ width: '100%', maxWidth: '1100px', height: '80vh', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', padding: '2rem', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)' }}>
            <button 
              onClick={() => setIsZoomed(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-subtle)', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <X size={18} />
            </button>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <History size={24} color="var(--accent-blue)" /> Expanded Power History
            </h2>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {renderContent('100%')}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
