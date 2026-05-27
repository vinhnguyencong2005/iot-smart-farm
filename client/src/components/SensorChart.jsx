import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

const CHART_CONFIGS = {
  temp:  { label: 'Temperature', unit: '°C',  color: '#e84040' },
  light: { label: 'Light intensity', unit: 'lux', color: '#e6a800' },
  soil:  { label: 'Soil moisture', unit: '%',  color: '#4169e1' },
  humid: { label: 'Humidity', unit: '%',  color: '#0096c7' },
};

function SensorChart({ history, sensorKey }) {
  const config = CHART_CONFIGS[sensorKey];

  const data = {
    labels: history.map(e => e.time.toLocaleTimeString()),
    datasets: [{
      label: `${config.label} (${config.unit})`,
      data: history.map(e => e.readings[sensorKey]),
      borderColor: config.color,
      backgroundColor: config.color + '22',
      borderWidth: 2,
      pointRadius: 2,
      tension: 0.3,
      fill: true,
    }],
  };

  const options = {
    responsive: true,
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { maxTicksLimit: 6, maxRotation: 0 } },
      y: { ticks: { maxTicksLimit: 5 } },
    },
  };

  return (
    <div className="chart-card">
      <p className="chart-title">{config.label} ({config.unit})</p>
      {history.length === 0
        ? <p className="chart-empty">Waiting for data...</p>
        : <Line data={data} options={options} />
      }
    </div>
  );
}

export default SensorChart;
