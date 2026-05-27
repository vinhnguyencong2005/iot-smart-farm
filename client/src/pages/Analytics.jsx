import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend,
} from 'chart.js';
import { useDevice } from '../context/DeviceContext';
import {
  getTelemetryTrend,
  getTelemetryHistory,
  getIrrigationUsage,
  getIrrigationHistory,
  seedFakeData,
} from '../api/farm';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const today = new Date().toISOString().split('T')[0];
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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

function Analytics() {
  const { deviceId } = useDevice();

  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [resolution, setResolution] = useState('day');

  const [trend, setTrend] = useState([]);
  const [usage, setUsage] = useState(null);
  const [telHistory, setTelHistory] = useState(null);
  const [irrHistory, setIrrHistory] = useState(null);
  const [telPage, setTelPage] = useState(1);
  const [irrPage, setIrrPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seedLoading, setSeedLoading] = useState(false);

  if (!deviceId) {
    return (
      <div className="page">
        <p className="empty-state">No device paired. Go to Dashboard to pair a device first.</p>
      </div>
    );
  }

  const fetchData = async (tp = telPage, ip = irrPage) => {
    setLoading(true);
    setError(null);
    try {
      const [trendData, usageData, telData, irrData] = await Promise.all([
        getTelemetryTrend({ deviceId, startDate, endDate, resolution }),
        getIrrigationUsage({ deviceId, startDate, endDate }),
        getTelemetryHistory({ deviceId, startDate, endDate, page: tp }),
        getIrrigationHistory({ deviceId, startDate, endDate, page: ip }),
      ]);
      setTrend(trendData);
      setUsage(usageData);
      setTelHistory(telData);
      setIrrHistory(irrData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = () => {
    setTelPage(1);
    setIrrPage(1);
    fetchData(1, 1);
  };

  const handleTelPage = (p) => { setTelPage(p); fetchData(p, irrPage); };
  const handleIrrPage = (p) => { setIrrPage(p); fetchData(telPage, p); };

  const handleSeed = async () => {
    setSeedLoading(true);
    try {
      await seedFakeData(deviceId);
      alert('Fake data seeded! Click Fetch to see results.');
    } catch (e) {
      alert(e.message);
    } finally {
      setSeedLoading(false);
    }
  };

  const trendChartData = {
    labels: trend.map(d => d._id),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: trend.map(d => d.avgTemperature != null ? +d.avgTemperature.toFixed(1) : null),
        borderColor: '#e84040',
        backgroundColor: '#e8404015',
        tension: 0.3,
        fill: true,
        pointRadius: 3,
      },
      {
        label: 'Humidity (%)',
        data: trend.map(d => d.avgHumidity != null ? +d.avgHumidity.toFixed(1) : null),
        borderColor: '#0096c7',
        backgroundColor: '#0096c715',
        tension: 0.3,
        fill: true,
        pointRadius: 3,
      },
      {
        label: 'Soil (%)',
        data: trend.map(d => d.avgSoilMoisture != null ? +d.avgSoilMoisture.toFixed(1) : null),
        borderColor: '#4169e1',
        backgroundColor: '#4169e115',
        tension: 0.3,
        fill: true,
        pointRadius: 3,
      },
      {
        label: 'Light (lux)',
        data: trend.map(d => d.avgLight != null ? +d.avgLight.toFixed(0) : null),
        borderColor: '#e6a800',
        backgroundColor: '#e6a80015',
        tension: 0.3,
        fill: true,
        pointRadius: 3,
        hidden: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: {
      x: { ticks: { maxTicksLimit: 8, maxRotation: 30 } },
      y: { ticks: { maxTicksLimit: 6 } },
    },
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
        <label className="filter-label">
          Resolution
          <select className="select-input" value={resolution} onChange={e => setResolution(e.target.value)}>
            <option value="hour">Hour</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
          </select>
        </label>
        <button className="fetch-button" onClick={handleFetch} disabled={loading}>
          {loading ? 'Loading…' : 'Fetch'}
        </button>
        <button className="seed-button" onClick={handleSeed} disabled={seedLoading}>
          {seedLoading ? 'Seeding…' : 'Seed Fake Data'}
        </button>
      </div>

      {error && <p className="pair-error" style={{ marginTop: 12 }}>{error}</p>}

      {trend.length > 0 && (
        <section className="analytics-section">
          <h2 className="section-title">Telemetry Trend</h2>
          <div className="trend-chart-wrap">
            <Line data={trendChartData} options={chartOptions} />
          </div>
        </section>
      )}

      {usage && (
        <section className="analytics-section">
          <h2 className="section-title">Irrigation Usage</h2>
          <div className="usage-stats">
            <div className="usage-stat-card">
              <p className="usage-stat-label">Total Activations</p>
              <p className="usage-stat-value">{usage.totalActivations}</p>
            </div>
            <div className="usage-stat-card">
              <p className="usage-stat-label">Total Duration</p>
              <p className="usage-stat-value">{(usage.totalDurationMs / 1000).toFixed(1)}s</p>
            </div>
          </div>
        </section>
      )}

      {telHistory && (
        <section className="analytics-section">
          <h2 className="section-title">Telemetry History</h2>
          {telHistory.data.length === 0
            ? <p className="empty-state">No records in this date range.</p>
            : (
              <>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Temp °C</th>
                      <th>Humidity %</th>
                      <th>Soil %</th>
                      <th>Light lux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telHistory.data.map(row => (
                      <tr key={row.id}>
                        <td>{new Date(row.timestamp).toLocaleString()}</td>
                        <td>{row.readings?.temperature ?? '—'}</td>
                        <td>{row.readings?.humidity ?? '—'}</td>
                        <td>{row.readings?.soilMoisture ?? '—'}</td>
                        <td>{row.readings?.light ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination current={telPage} total={telHistory.pagination?.totalPages ?? 1} onChange={handleTelPage} />
              </>
            )
          }
        </section>
      )}

      {irrHistory && (
        <section className="analytics-section">
          <h2 className="section-title">Irrigation History</h2>
          {irrHistory.data.length === 0
            ? <p className="empty-state">No irrigation events in this date range.</p>
            : (
              <>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Duration</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {irrHistory.data.map(row => (
                      <tr key={row.id}>
                        <td>{new Date(row.timestamp).toLocaleString()}</td>
                        <td>{(row.durationMs / 1000).toFixed(1)}s</td>
                        <td><span className="source-badge">{row.source}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination current={irrPage} total={irrHistory.pagination?.totalPages ?? 1} onChange={handleIrrPage} />
              </>
            )
          }
        </section>
      )}

      {!trend.length && !telHistory && !irrHistory && !loading && (
        <p className="empty-state" style={{ marginTop: 48 }}>
          Select a date range and click Fetch to load analytics data.
        </p>
      )}
    </div>
  );
}

export default Analytics;
