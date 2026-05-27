import { NavLink } from 'react-router-dom';
import { useDevice } from '../context/DeviceContext';

function Navbar() {
  const { deviceId } = useDevice();

  return (
    <nav className="navbar">
      <div className="navbar-brand">🌿 SmartFarm</div>
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>
          Analytics
        </NavLink>
        <NavLink to="/alerts" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>
          Alerts
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>
          Settings
        </NavLink>
      </div>
      <div className="navbar-status">
        {deviceId
          ? <><span className="status-dot status-dot--on" />Device paired</>
          : <><span className="status-dot status-dot--off" />No device</>
        }
      </div>
    </nav>
  );
}

export default Navbar;
