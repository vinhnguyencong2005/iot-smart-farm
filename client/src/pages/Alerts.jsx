import { useState } from 'react';
import { useDevice } from '../context/DeviceContext';
import { getAlerts } from '../api/farm';

const today = new Date().toISOString().split('T')[0];
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const STATUS_STYLE = {
  low:  { bg: '#dbeafe', border: '#3b82f6', icon: '▼', label: 'LOW' },
  high: { bg: '#fee2e2', border: '#ef4444', icon: '▲', label: 'HIGH' },
};

function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;
  return (
    <div className="pagination">
      <button className="page-btn" onClick={() => onChange(current - 1)} disabled={current <= 1}>←</button>
      <span className="page-info">{current} / {total}</span>
      <button className="page-btn" onClick={() => onChange(current + 1)} disabled={current >= total}>→</button>
    </div>
  );
}

function Alerts() {
  const { deviceId } = useDevice();
  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAlerts = async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAlerts({
        deviceId: deviceId || undefined,
        startDate,
        endDate,
        page: p,
      });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = () => {
    setPage(1);
    fetchAlerts(1);
  };

  const handlePageChange = (p) => {
    setPage(p);
    fetchAlerts(p);
  };

  return (
    <div className="page">
      <div className="analytics-controls">
        <label className="filter-label">
          From
          <input type="date" className="date-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </label>
        <label className="filter-label">
          To
          <input type="date" className="date-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </label>
        <button className="fetch-button" onClick={handleFetch} disabled={loading}>
          {loading ? 'Loading…' : 'Fetch Alerts'}
        </button>
      </div>

      {!deviceId && (
        <p style={{ margin: '12px 0 0', color: '#888', fontSize: 13 }}>
          No device paired — showing all alerts across all devices.
        </p>
      )}
      {error && <p className="pair-error" style={{ marginTop: 12 }}>{error}</p>}

      {result && (
        <section className="analytics-section">
          <h2 className="section-title">
            Alerts <span style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>({result.meta.totalItems} total)</span>
          </h2>

          {result.data.length === 0
            ? <p className="empty-state">No alerts found for this period.</p>
            : result.data.map(alert => {
                const style = STATUS_STYLE[alert.status] ?? STATUS_STYLE.high;
                return (
                  <div
                    key={alert._id}
                    className="alert-card"
                    style={{ background: style.bg, borderColor: style.border }}
                  >
                    <div className="alert-header">
                      <span className="alert-icon">{style.icon}</span>
                      <span className="alert-sensor">{alert.sensor_type}</span>
                      <span className="alert-status-badge" style={{ color: style.border }}>{style.label}</span>
                      <span className="alert-time">{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="alert-message">{alert.message}</p>
                    <p className="alert-value">Recorded value: <strong>{alert.value}</strong></p>
                  </div>
                );
              })
          }

          <Pagination current={page} total={result.meta.totalPages} onChange={handlePageChange} />
        </section>
      )}

      {!result && !loading && (
        <p className="empty-state" style={{ marginTop: 48 }}>
          Select a date range and click Fetch Alerts.
        </p>
      )}
    </div>
  );
}

export default Alerts;
