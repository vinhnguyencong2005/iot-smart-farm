import { useState } from 'react';
import DataDisplay from '../components/DisplayCard';
import { useFarmDevice } from '../hooks/useFarmDevice';
import heatIcon from '../assets/heat-removebg-preview.png';
import humidIcon from '../assets/humid-removebg-preview.png';
import lightIcon from '../assets/light-removebg-preview.png';
import soilIcon from '../assets/soil_moist-removebg-preview.png';

function Home() {
  const [macInput, setMacInput] = useState('');
  const { deviceId, readings, pairError, pair, water, isWatering } = useFarmDevice();

  const handlePair = () => {
    if (macInput.trim()) pair(macInput.trim());
  };

  return (
    <>
      <div className="header">
        <h1>Logo here</h1>
      </div>

      <div className="pair-section">
        <input
          className="pair-input"
          type="text"
          placeholder="Enter MAC address (AA:BB:CC:DD:EE:FF)"
          value={macInput}
          onChange={(e) => setMacInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePair()}
        />
        <button className="pair-button" onClick={handlePair}>
          {deviceId ? 'Re-pair' : 'Pair'}
        </button>
      </div>

      {pairError && <p className="pair-error">{pairError}</p>}
      {deviceId && <p className="pair-success">Paired · {deviceId}</p>}

      <div>
        <DataDisplay data={[
          { properties: { title: 'Temperature', icon: heatIcon, unit: '°C' }, value: readings?.temp },
          { properties: { title: 'Light intensity', icon: lightIcon, unit: 'lux' }, value: readings?.light },
          { properties: { title: 'Soil moisture', icon: soilIcon, unit: '%' }, value: readings?.soil },
          { properties: { title: 'Humidity', icon: humidIcon, unit: '%' }, value: readings?.humid },
        ]} />
      </div>

      <div className="controls">
        <button
          className={`watering-button${isWatering ? ' watering-button--active' : ''}`}
          onClick={water}
          disabled={!deviceId}
        >
          {isWatering ? 'Watering...' : 'Watering'}
        </button>
      </div>
    </>
  );
}

export default Home;
