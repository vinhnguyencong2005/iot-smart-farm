import { useState, useEffect } from 'react';
import DataDisplay from '../components/DisplayCard';
import { useFarmDevice } from '../hooks/useFarmDevice';
import heatIcon from '../assets/heat-removebg-preview.png';
import humidIcon from '../assets/humid-removebg-preview.png';
import lightIcon from '../assets/light-removebg-preview.png';
import soilIcon from '../assets/soil_moist-removebg-preview.png';

function Home() {
  const [macInput, setMacInput] = useState('');
  const { deviceId, readings, pairError, pair, water, isWatering } = useFarmDevice();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    const timeStr = date.toLocaleTimeString('vi-VN', { hour12: false });
    const dateStr = date.toLocaleDateString('vi-VN');
    return `${timeStr} - ${dateStr}`;
  };

  const handlePair = () => {
    if (macInput.trim()) pair(macInput.trim());
  };

  return (
    <>
      {/* Giữ giao diện Header đẹp và có đồng hồ của Phú */}
      <div className="header">
        <div className="header-left-block">
          <h1 className="logo-text">Logo here</h1>
          <div className="system-status-bar">
            <span className="dashboard-title">SMART FARM IOT SYSTEM DASHBOARD</span>
            <div className="time-display">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Giữ phần kết nối bằng MAC Address và báo lỗi/thành công của Vinh */}
      <div className="home-container">
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

        {/* Đổ dữ liệu thật từ cảm biến của Vinh vào giao diện Card */}
        <div>
          <DataDisplay data={[
            { properties: { title: 'Temperature', icon: heatIcon, unit: '°C' }, value: readings?.temp || 0 },
            { properties: { title: 'Light intensity', icon: lightIcon, unit: 'lux' }, value: readings?.light || 0 },
            { properties: { title: 'Soil moisture', icon: soilIcon, unit: '%' }, value: readings?.soil || 0 },
            { properties: { title: 'Humidity', icon: humidIcon, unit: '%' }, value: readings?.humid || 0 },
          ]} />
        </div>

        {/* Nút điều khiển tưới cây bằng logic thật của Vinh */}
        <div className="controls">
          <button
            className={`watering-button${isWatering ? ' watering-button--active' : ''}`}
            onClick={water}
            disabled={!deviceId}
          >
            {isWatering ? 'Watering...' : 'Watering'}
          </button>
        </div>
      </div>
    </>
  );
}

export default Home;