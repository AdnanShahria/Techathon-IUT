import { useState, useEffect } from 'react';
import { Zap, Clock } from 'lucide-react';

/**
 * Header component with office name, live indicator, total power, and clock.
 */
export default function Header({ totalPower, devicesOn, connected }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">🏢</div>
        <div>
          <h1 className="header-title">Smart Office Monitor</h1>
          <p className="header-subtitle">Real-time device tracking & power analytics</p>
        </div>
      </div>

      <div className="header-right">
        <div className="live-badge">
          <span className={`live-dot ${!connected ? 'disconnected' : ''}`}></span>
          {connected ? 'LIVE' : 'OFFLINE'}
        </div>

        <div className="header-power">
          <Zap size={16} />
          <span>{totalPower}W</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
            • {devicesOn || 0} on
          </span>
        </div>

        <div className="header-time">
          <Clock size={14} style={{ marginRight: 4 }} />
          {formattedTime}
          <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>{formattedDate}</span>
        </div>
      </div>
    </header>
  );
}
