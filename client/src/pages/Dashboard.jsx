import { useState, useEffect } from 'react';
import DataDisplay from '../components/DisplayCard';
import SensorChart from '../components/SensorChart';
import { useDevice } from '../context/DeviceContext';
import heatIcon from '../assets/heat-removebg-preview.png';
import humidIcon from '../assets/humid-removebg-preview.png';
import lightIcon from '../assets/light-removebg-preview.png';
import soilIcon from '../assets/soil_moist-removebg-preview.png';

function Dashboard() {
  const [macInput, setMacInput] = useState('');
  const { deviceId, pumpConfig, readings, history, pairError, pair, water, isWatering, saveRunDuration } = useDevice();

  const [durationSec, setDurationSec] = useState(5);
  const [durationStatus, setDurationStatus] = useState(null); // 'saving' | 'saved' | 'error'

  useEffect(() => {
    if (pumpConfig?.defaultRunTimeMs != null) {
      setDurationSec(Math.round(pumpConfig.defaultRunTimeMs / 1000));
    }
  }, [pumpConfig]);

  const handleSetDuration = async () => {
    setDurationStatus('saving');
    try {
      await saveRunDuration(durationSec * 1000);
      setDurationStatus('saved');
      setTimeout(() => setDurationStatus(null), 2000);
    } catch {
      setDurationStatus('error');
      setTimeout(() => setDurationStatus(null), 3000);
    }
  };

  const handlePair = () => {
    if (macInput.trim()) pair(macInput.trim());
  };

  return (
    <div className="page">
      <section className="pair-section">
        <input
          className="pair-input"
          type="text"
          placeholder="Enter MAC address (AA:BB:CC:DD:EE:FF)"
          value={macInput}
          onChange={(e) => setMacInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePair()}
        />
        <button className="pair-button" onClick={handlePair}>
          {deviceId ? 'Re-pair' : 'Pair Device'}
        </button>
      </section>

      {pairError && <p className="pair-error">{pairError}</p>}
      {deviceId && <p className="pair-success">● Connected · {deviceId}</p>}

      <DataDisplay data={[
        { properties: { title: 'Temperature', icon: heatIcon, unit: '°C' }, value: readings?.temp },
        { properties: { title: 'Light intensity', icon: lightIcon, unit: 'lux' }, value: readings?.light },
        { properties: { title: 'Soil moisture', icon: soilIcon, unit: '%' }, value: readings?.soil },
        { properties: { title: 'Humidity', icon: humidIcon, unit: '%' }, value: readings?.humid },
      ]} />

      {deviceId && (
        <div className="charts-grid">
          <SensorChart history={history} sensorKey="temp" />
          <SensorChart history={history} sensorKey="light" />
          <SensorChart history={history} sensorKey="soil" />
          <SensorChart history={history} sensorKey="humid" />
        </div>
      )}

      {!deviceId && (
        <p className="empty-state">Pair a device above to see live sensor data and charts.</p>
      )}

      <div className="controls">
        <button
          className={`watering-button${isWatering ? ' watering-button--active' : ''}`}
          onClick={water}
          disabled={!deviceId}
        >
          {isWatering ? 'Watering...' : '💧 Water Now'}
        </button>

        <div className="duration-control">
          <label className="duration-label">Run for</label>
          <input
            type="number"
            className="duration-input"
            min={1}
            max={600}
            value={durationSec}
            onChange={e => setDurationSec(Number(e.target.value))}
            disabled={!deviceId}
          />
          <span className="duration-unit">s</span>
          <button
            className="duration-set-btn"
            onClick={handleSetDuration}
            disabled={!deviceId || durationStatus === 'saving'}
          >
            {durationStatus === 'saving' ? 'Saving…' : 'Set'}
          </button>
          {durationStatus === 'saved' && <span className="duration-feedback duration-feedback--ok">Saved</span>}
          {durationStatus === 'error'  && <span className="duration-feedback duration-feedback--err">Failed</span>}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
