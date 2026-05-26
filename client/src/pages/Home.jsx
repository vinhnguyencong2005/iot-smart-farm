import { useState, useEffect } from 'react';
import DataDisplay from '../components/DisplayCard';
import LoginButton from '../components/Account';
import heatIcon from '../assets/heat-removebg-preview.png';
import humidIcon from '../assets/humid-removebg-preview.png';
import lightIcon from '../assets/light-removebg-preview.png';
import soilIcon from '../assets/soil_moist-removebg-preview.png';
import gIcon from "../assets/Google_Favicon_2025.png";

function Home() {
  const [deviceId, setDeviceId] = useState('');
  const [watering, setWatering] = useState(false);
  
  // tạo state
  const [currentTime, setCurrentTime] = useState(new Date());

  // cập nhật đồng hồ chạy mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer); // clear 
  }, []);

  const formatTime = (date) => {
    const timeStr = date.toLocaleTimeString('vi-VN', { hour12: false });
    const dateStr = date.toLocaleDateString('vi-VN');
    return `${timeStr} - ${dateStr}`;
  };

  return (
    <>
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

        <LoginButton logo={gIcon} />
      </div>

      <div className="home-container">
        <div className="pair-section">
          <input
            className="pair-input"
            type="text"
            placeholder="Enter device ID"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
          />
          <button className="pair-button">Pair</button>
        </div>
        <div>
          <DataDisplay data={[
            { properties: { title: 'Temperature', icon: heatIcon, unit: '°C' }, value: 36 },
            { properties: { title: 'Light intensity', icon: lightIcon, unit: 'lux' }, value: '20 000' },
            { properties: { title: 'Soil moisture', icon: soilIcon, unit: '%' }, value: 100 },
            { properties: { title: 'Humidity', icon: humidIcon, unit: '%' }, value: 100 },
          ]} />
        </div>
        <div className="controls">
          <button
            className={`watering-button${watering ? ' watering-button--active' : ''}`}
            onClick={() => setWatering((v) => !v)}
          >
            Watering
          </button>
        </div>
      </div>
    </>
  );
}

export default Home;
