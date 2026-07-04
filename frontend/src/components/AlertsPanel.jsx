import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Alerts panel showing active anomalies:
 * - Devices ON after office hours
 * - All devices ON for 2+ hours
 * - High power consumption
 */
export default function AlertsPanel({ alerts: initialAlerts }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setAlerts(initialAlerts);
  }, [initialAlerts]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const API_URL = import.meta.env.DEV ? 'http://localhost:4000/api' : '/api';
      const res = await fetch(`${API_URL}/alerts`);
      const data = await res.json();
      if (data.alerts) setAlerts(data.alerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="alerts-section">
      <h2 className="section-title" style={{ display: 'flex', alignItems: 'center' }}>
        <span className="section-title-icon rose">
          <AlertTriangle size={16} />
        </span>
        Active Alerts

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={handleRefresh}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center',
              padding: '4px',
              transition: 'color 0.2s',
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            title="Refresh Alerts"
          >
            <RefreshCw size={16} />
          </button>

          {alerts.length > 0 && (
          <span style={{
            marginLeft: 'auto',
            background: 'rgba(244, 63, 94, 0.15)',
            color: 'var(--accent-rose)',
            padding: '2px 10px',
            borderRadius: 12,
            fontSize: '0.75rem',
            fontWeight: 700,
          }}>
            {alerts.length}
          </span>
          )}
        </div>
      </h2>

      <div className="alerts-card">
        {alerts.length === 0 ? (
          <div className="alerts-empty">
            <div className="alerts-empty-icon">✅</div>
            <div className="alerts-empty-text">
              All clear! No anomalies detected.
            </div>
          </div>
        ) : (
          <div className="alerts-list">
            {alerts.map((alert, index) => (
              <div
                key={alert.id || index}
                className={`alert-item ${alert.severity}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="alert-message">{alert.message}</div>
                <div className="alert-time">
                  <Clock size={12} />
                  {new Date(alert.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                  {alert.room && (
                    <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>
                      • {alert.room}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
