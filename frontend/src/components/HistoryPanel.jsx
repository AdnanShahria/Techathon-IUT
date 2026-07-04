import { useEffect, useState } from 'react';
import { History } from 'lucide-react';

export default function HistoryPanel({ lastUpdate }) {
  const [history, setHistory] = useState([]);

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

  return (
    <div className="history-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <h2 className="section-title">
        <span className="section-title-icon gray">
          <History size={16} />
        </span>
        Power Usage History
      </h2>
      <div className="history-card" style={{ flex: 1, maxHeight: '250px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {history.length === 0 ? (
            <div className="history-empty" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No history recorded yet.</div>
          ) : (
            history.map((record, idx) => {
              const time = new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              return (
                <div key={record.id} className="history-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.03)' : 'transparent', borderRadius: '8px', transition: 'background 0.2s' }}>
                  <div className="history-time" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>{time}</div>
                  <div className="history-details" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent-amber)', fontSize: '0.95rem' }}>{record.total_power_watts}W</span>
                    <span className="history-sub" style={{ opacity: 0.6, fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                      {record.devices_on} ON
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
