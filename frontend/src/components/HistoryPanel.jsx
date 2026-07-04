import { useEffect, useState, useCallback, useRef } from 'react';
import { History, Maximize2, X, MoreVertical } from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';

const API_URL = import.meta.env.DEV ? 'http://localhost:4000/api' : '/api';

// Map UI tab label → API range param
const RANGE_MAP = {
  Hourly:  'hourly',
  Daily:   'daily',
  Weekly:  'weekly',
  Monthly: 'monthly',
  Yearly:  'yearly',
};

/**
 * Format a raw DB/aggregated row into a display-ready object.
 * Works for both hourly (raw) rows and aggregated (bucketed) rows.
 */
function formatRow(row, index) {
  // Aggregated rows have `bucket` and `avg_power`; raw rows have `timestamp` and `total_power_watts`
  const isAggregated = row.bucket !== undefined;
  const rawTs = isAggregated ? row.bucket : row.timestamp;
  const power = isAggregated
    ? Math.round(Number(row.avg_power) || 0)
    : Math.round(Number(row.total_power_watts) || 0);
  const cost = isAggregated
    ? Number(row.avg_cost || 0)
    : Number(row.cost || 0);
  const devicesOn = isAggregated
    ? Math.round(Number(row.avg_devices_on) || 0)
    : Math.round(Number(row.devices_on) || 0);

  // Format time label based on bucket format
  let timeLabel;
  try {
    const d = new Date(rawTs);
    if (rawTs.length === 10) {
      // 'YYYY-MM-DD' → yearly
      timeLabel = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else if (rawTs.endsWith(':00') && rawTs.length === 16) {
      // 'YYYY-MM-DDTHH:00' → weekly
      timeLabel = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) +
        ' ' + d.toLocaleTimeString([], { hour: '2-digit', hour12: false });
    } else if (rawTs.length === 16) {
      // 'YYYY-MM-DDTHH:MM' → daily / monthly buckets
      timeLabel = d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
    } else {
      // Full ISO → hourly raw
      timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  } catch {
    timeLabel = rawTs;
  }

  const hourlyRate = (power / 1000) * 9;

  return {
    id: row.id || `agg-${index}`,
    time: timeLabel,
    power,
    cost: hourlyRate.toFixed(4),
    totalCost: isAggregated ? Number(row.total_cost || 0) : Number(row.cost || 0),
    devicesOn,
    rawTimestamp: rawTs,
    isAggregated,
    drawingRoom: Number(row.drawing_room_watts || 0),
    workRoom1: Number(row.work_room_1_watts || 0),
    workRoom2: Number(row.work_room_2_watts || 0),
  };
}

/**
 * HistoryPanel — Power Usage History
 *
 * Props:
 *   latestHistoryRecord  {object|null}  Live record pushed via Socket.IO
 *   liveDailyCost        {number}       Live daily bill from PowerMeter ticker (tk)
 */
export default function HistoryPanel({ latestHistoryRecord, liveDailyCost = 0 }) {
  const [history, setHistory]           = useState([]);   // display-ready rows
  const [timeRange, setTimeRange]       = useState('Hourly');
  const [loading, setLoading]           = useState(false);
  const [isZoomed, setIsZoomed]         = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile]         = useState(window.innerWidth <= 768);
  const activeRange = useRef('Hourly');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Fetch data from real API whenever range changes ──────────
  const fetchHistory = useCallback(async (range) => {
    setLoading(true);
    try {
      const apiRange = RANGE_MAP[range] || 'hourly';
      const res = await fetch(`${API_URL}/usage/history?range=${apiRange}`);
      const data = await res.json();

      if (data.history) {
        const rows = data.history.map((row, i) => formatRow(row, i));
        // Hourly comes DESC from DB → reverse to chronological for chart
        const sorted = apiRange === 'hourly' ? [...rows].reverse() : rows;
        setHistory(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on tab change
  useEffect(() => {
    activeRange.current = timeRange;
    fetchHistory(timeRange);
  }, [timeRange, fetchHistory]);

  // ── Real-time: prepend new record when server pushes one ──────
  useEffect(() => {
    if (!latestHistoryRecord || activeRange.current !== 'Hourly') return;

    const formatted = formatRow(latestHistoryRecord, 0);
    setHistory((prev) => {
      // Avoid duplicates by timestamp
      if (prev.length > 0 && prev[prev.length - 1].rawTimestamp === formatted.rawTimestamp) {
        return prev;
      }
      const next = [...prev, formatted];
      // Keep at most 120 points in the Hourly view
      return next.length > 120 ? next.slice(next.length - 120) : next;
    });
  }, [latestHistoryRecord]);

  // ── Chart tooltip ─────────────────────────────────────────────
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '10px',
          boxShadow: 'var(--shadow-md)',
          minWidth: '180px',
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px', fontSize: '0.82rem' }}>{label}</p>
          <p style={{ margin: '2px 0', color: 'var(--accent-blue)', fontSize: '0.85rem' }}>⚡ Power: {d.power}W</p>
          <p style={{ margin: '2px 0', color: '#4ade80', fontSize: '0.85rem' }}>💰 Cost: {d.cost} tk/hr</p>
          {d.devicesOn > 0 && (
            <p style={{ margin: '2px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>🔌 Devices ON: {d.devicesOn}</p>
          )}
          {d.isAggregated && d.drawingRoom > 0 && (
            <div style={{ marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
              <p style={{ margin: '1px 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>🏠 Drawing Room: {d.drawingRoom}W</p>
              <p style={{ margin: '1px 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>💼 Work Room 1: {d.workRoom1}W</p>
              <p style={{ margin: '1px 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>💼 Work Room 2: {d.workRoom2}W</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // ── Summary stats ─────────────────────────────────────────────
  const avgPower = history.length > 0
    ? Math.round(history.reduce((s, d) => s + d.power, 0) / history.length)
    : 0;

  const displayCost = timeRange === 'Hourly'
    ? liveDailyCost.toFixed(2)         // live ticker from PowerMeter
    : history.reduce((s, d) => s + parseFloat(d.totalCost), 0).toFixed(2); // sum from DB

  const ROW_HEIGHT = 50;
  const MAX_VISIBLE_ROWS = 6;
  const listMaxHeight = MAX_VISIBLE_ROWS * ROW_HEIGHT;

  // ── Data list renderer ────────────────────────────────────────
  const renderDataList = (isModal = false) => {
    const listData = [...history].reverse(); // show newest first in list

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        overflowY: 'auto',
        maxHeight: isModal || isMobile ? '100%' : `${listMaxHeight}px`,
        flex: isModal ? 1 : undefined,
        paddingRight: listData.length > MAX_VISIBLE_ROWS ? '4px' : '0',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(59,130,246,0.4) transparent',
      }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ marginBottom: '8px', fontSize: '1.5rem' }}>⏳</div>
            Loading history...
          </div>
        ) : listData.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No history data available for this range.
          </div>
        ) : (
          listData.map((record, idx) => (
            <div
              key={`${record.id}-${record.rawTimestamp}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.6rem 1rem',
                background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                borderRadius: '8px',
                transition: 'background 0.2s',
                cursor: 'default',
                flexShrink: 0,
                minHeight: '40px',
              }}
            >
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                {record.time}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--accent-amber)', fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums' }}>
                  {record.power}W
                </span>
                <span style={{ fontWeight: 600, color: '#4ade80', fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums' }}>
                  {record.cost} tk
                </span>
                <span style={{ opacity: 0.6, fontSize: '0.78rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', minWidth: '45px', textAlign: 'center' }}>
                  {record.devicesOn} ON
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // ── Range buttons ─────────────────────────────────────────────
  const renderRangeButtons = () => {
    const allRanges = ['Hourly', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

    if (isMobile) {
      const visible = ['Daily', 'Weekly'];
      const overflow = ['Hourly', 'Monthly', 'Yearly'];
      return (
        <>
          {visible.map((range) => (
            <button key={range} onClick={() => { setTimeRange(range); setIsMobileMenuOpen(false); }}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid', borderColor: timeRange === range ? 'var(--accent-blue)' : 'transparent', background: timeRange === range ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: timeRange === range ? 'var(--accent-blue)' : 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500 }}>
              {range}
            </button>
          ))}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid transparent', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <MoreVertical size={14} />
          </button>
          {isMobileMenuOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 10, boxShadow: 'var(--shadow-md)' }}>
              {overflow.map((range) => (
                <button key={range} onClick={() => { setTimeRange(range); setIsMobileMenuOpen(false); }}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: timeRange === range ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: timeRange === range ? 'var(--accent-blue)' : 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500, textAlign: 'left', whiteSpace: 'nowrap' }}>
                  {range}
                </button>
              ))}
            </div>
          )}
        </>
      );
    }

    return allRanges.map((range) => (
      <button key={range} onClick={() => setTimeRange(range)}
        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid', borderColor: timeRange === range ? 'var(--accent-blue)' : 'transparent', background: timeRange === range ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: timeRange === range ? 'var(--accent-blue)' : 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500 }}>
        {range}
      </button>
    ));
  };

  // ── Main content ──────────────────────────────────────────────
  const renderContent = (isModal = false) => (
    <>
      {/* Header row: cost summary + range buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {timeRange === 'Hourly' ? 'Live Daily Cost' : `Total Cost (${timeRange})`}:{' '}
            <span style={{
              color: '#4ade80',
              fontWeight: 'bold',
              textShadow: '0 0 4px rgba(74, 222, 128, 0.3), 0 0 8px rgba(74, 222, 128, 0.15)',
            }}>
              {displayCost} tk
            </span>
            {timeRange === 'Hourly' && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                (live)
              </span>
            )}
          </div>
          {avgPower > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Avg power: <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{avgPower}W</span>
              {' · '}
              <span style={{ color: 'var(--text-secondary)' }}>{history.length} data points</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', position: 'relative' }}>
          {renderRangeButtons()}
        </div>
      </div>

      {/* Side-by-side: Graph (left 60%) + Data list (right 40%) */}
      <div className="history-layout-row">
        {/* Chart */}
        <div className="history-chart-wrapper">
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Loading chart data...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} minTickGap={40} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Area
                  type="monotone"
                  dataKey="power"
                  stroke="var(--accent-blue)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPower)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Data list */}
        <div className="history-list-wrapper">
          {renderDataList(isModal)}
        </div>
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
            {/* Live indicator when Hourly is selected */}
            {timeRange === 'Hourly' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '0.7rem', color: '#4ade80', fontWeight: 600,
                background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74,222,128,0.3)',
                borderRadius: '12px', padding: '2px 8px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 4px #4ade80', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                LIVE
              </span>
            )}
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

        <div className="history-card" style={{ height: isMobile ? '500px' : '380px', display: 'flex', flexDirection: 'column', padding: '1rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          {renderContent(false)}
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
              {renderContent(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
