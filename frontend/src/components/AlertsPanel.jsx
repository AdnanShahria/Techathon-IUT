import { AlertTriangle, Clock, RefreshCw, Trash2, X } from 'lucide-react';
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
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissed_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  const activeAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id));

  const handleDeleteAlert = (alertId) => {
    if (!alertId) return;
    const updated = [...dismissedAlerts, alertId];
    setDismissedAlerts(updated);
    localStorage.setItem('dismissed_alerts', JSON.stringify(updated));
  };

  const handleDeleteAll = () => {
    const currentIds = activeAlerts.map(a => a.id).filter(Boolean);
    const updated = [...new Set([...dismissedAlerts, ...currentIds])];
    setDismissedAlerts(updated);
    localStorage.setItem('dismissed_alerts', JSON.stringify(updated));
  };

  const handleResetDismissed = () => {
    setDismissedAlerts([]);
    localStorage.removeItem('dismissed_alerts');
  };

  return (
    <div className="alerts-section">
      <h2 className="section-title" style={{ display: 'flex', alignItems: 'center' }}>
        <span className="section-title-icon rose">
          <AlertTriangle size={16} />
        </span>
        Active Alerts

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeAlerts.length > 0 && (
            <button 
              onClick={handleDeleteAll}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-muted)', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center',
                padding: '4px',
                transition: 'color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-rose)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              title="Clear All Alerts"
            >
              <Trash2 size={16} />
            </button>
          )}

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

          {activeAlerts.length > 0 && (
            <span style={{
              background: 'rgba(244, 63, 94, 0.15)',
              color: 'var(--accent-rose)',
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              {activeAlerts.length}
            </span>
          )}
        </div>
      </h2>

      <div className="alerts-card">
        {activeAlerts.length === 0 ? (
          <div className="alerts-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="alerts-empty-icon">✅</div>
            <div className="alerts-empty-text">
              All clear! No anomalies detected.
            </div>
            {dismissedAlerts.length > 0 && (
              <button
                onClick={handleResetDismissed}
                style={{
                  marginTop: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Restore Dismissed Alerts
              </button>
            )}
          </div>
        ) : (
          <div className="alerts-list">
            {activeAlerts.map((alert, index) => (
              <div
                key={alert.id || index}
                className={`alert-item ${alert.severity}`}
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  position: 'relative',
                  paddingRight: '40px',
                }}
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
                
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: '50%',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                  title="Dismiss Alert"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
