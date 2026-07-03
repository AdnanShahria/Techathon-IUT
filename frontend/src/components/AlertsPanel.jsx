import { AlertTriangle, Clock } from 'lucide-react';

/**
 * Alerts panel showing active anomalies:
 * - Devices ON after office hours
 * - All devices ON for 2+ hours
 * - High power consumption
 */
export default function AlertsPanel({ alerts }) {
  return (
    <div className="alerts-section">
      <h2 className="section-title">
        <span className="section-title-icon rose">
          <AlertTriangle size={16} />
        </span>
        Active Alerts
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
