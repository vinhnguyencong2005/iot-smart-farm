import { useState } from 'react';
import { useDevice } from '../context/DeviceContext';
import { updateSensorConfig, updatePumpConfig } from '../api/farm';

const SENSORS = [
  { key: 'temp',  label: 'Temperature',   unit: '°C',  color: '#FF8D8D' },
  { key: 'light', label: 'Light Level',   unit: 'lux', color: '#FFEC7D' },
  { key: 'soil',  label: 'Soil Moisture', unit: '%',   color: '#A1BEFF' },
  { key: 'humid', label: 'Humidity',      unit: '%',   color: '#81D9FF' },
];

const TRIGGER_CONDITIONS = ['LESS_THAN', 'GREATER_THAN', 'EQUAL'];
const TRIGGER_SENSORS = [
  { value: 'soil',  label: 'Soil Moisture' },
  { value: 'temp',  label: 'Temperature' },
  { value: 'humid', label: 'Humidity' },
  { value: 'light', label: 'Light Level' },
];

function Settings() {
  const { deviceId } = useDevice();

  const [sensorForms, setSensorForms] = useState(
    Object.fromEntries(SENSORS.map(s => [s.key, { minThreshold: '', maxThreshold: '' }]))
  );
  const [sensorStatus, setSensorStatus] = useState({});

  const [pumpForm, setPumpForm] = useState({
    enabled: true,
    cooldownMs: 60000,
    defaultRunTimeMs: 5000,
    trigger: { type: 'soil', condition: 'LESS_THAN', value: 30 },
  });
  const [pumpStatus, setPumpStatus] = useState(null);

  if (!deviceId) {
    return (
      <div className="page">
        <p className="empty-state">No device paired. Go to Dashboard to pair a device first.</p>
      </div>
    );
  }

  const handleSensorSave = async (key) => {
    setSensorStatus(prev => ({ ...prev, [key]: { loading: true, error: null, success: false } }));
    try {
      await updateSensorConfig(deviceId, key, {
        minThreshold: Number(sensorForms[key].minThreshold),
        maxThreshold: Number(sensorForms[key].maxThreshold),
      });
      setSensorStatus(prev => ({ ...prev, [key]: { loading: false, error: null, success: true } }));
    } catch (e) {
      setSensorStatus(prev => ({ ...prev, [key]: { loading: false, error: e.message, success: false } }));
    }
  };

  const handlePumpSave = async () => {
    setPumpStatus({ loading: true, error: null, success: false });
    try {
      await updatePumpConfig(deviceId, pumpForm);
      setPumpStatus({ loading: false, error: null, success: true });
    } catch (e) {
      setPumpStatus({ loading: false, error: e.message, success: false });
    }
  };

  const setSensor = (key, field, value) =>
    setSensorForms(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const setPump = (field, value) =>
    setPumpForm(prev => ({ ...prev, [field]: value }));

  const setTrigger = (field, value) =>
    setPumpForm(prev => ({ ...prev, trigger: { ...prev.trigger, [field]: value } }));

  return (
    <div className="page">
      <section className="analytics-section">
        <h2 className="section-title">Sensor Alert Thresholds</h2>
        <p style={{ marginBottom: 20, color: '#666', fontSize: 14 }}>
          Alerts are triggered when a sensor reading goes below min or above max.
        </p>
        <div className="settings-grid">
          {SENSORS.map(sensor => {
            const status = sensorStatus[sensor.key] || {};
            return (
              <div key={sensor.key} className="settings-card" style={{ borderTop: `4px solid ${sensor.color}` }}>
                <h3 className="settings-card-title">{sensor.label} <span style={{ color: '#888', fontWeight: 400 }}>({sensor.unit})</span></h3>
                <div className="settings-row">
                  <label className="field-label">
                    Min threshold
                    <input
                      type="number"
                      className="settings-input"
                      placeholder="e.g. 20"
                      value={sensorForms[sensor.key].minThreshold}
                      onChange={e => setSensor(sensor.key, 'minThreshold', e.target.value)}
                    />
                  </label>
                  <label className="field-label">
                    Max threshold
                    <input
                      type="number"
                      className="settings-input"
                      placeholder="e.g. 80"
                      value={sensorForms[sensor.key].maxThreshold}
                      onChange={e => setSensor(sensor.key, 'maxThreshold', e.target.value)}
                    />
                  </label>
                </div>
                <button
                  className="save-button"
                  onClick={() => handleSensorSave(sensor.key)}
                  disabled={status.loading}
                >
                  {status.loading ? 'Saving…' : 'Save'}
                </button>
                {status.success && <p className="pair-success" style={{ marginTop: 8 }}>Saved!</p>}
                {status.error && <p className="pair-error" style={{ marginTop: 8 }}>{status.error}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="analytics-section">
        <h2 className="section-title">Pump Configuration</h2>
        <div className="pump-config-card">
          <label className="toggle-row">
            <span>Auto Irrigation</span>
            <input
              type="checkbox"
              checked={pumpForm.enabled}
              onChange={e => setPump('enabled', e.target.checked)}
            />
            <span className="toggle-hint">{pumpForm.enabled ? 'Enabled' : 'Disabled'}</span>
          </label>

          <div className="settings-row" style={{ marginTop: 20 }}>
            <label className="field-label">
              Trigger sensor
              <select
                className="select-input"
                value={pumpForm.trigger.type}
                onChange={e => setTrigger('type', e.target.value)}
              >
                {TRIGGER_SENSORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label className="field-label">
              Condition
              <select
                className="select-input"
                value={pumpForm.trigger.condition}
                onChange={e => setTrigger('condition', e.target.value)}
              >
                {TRIGGER_CONDITIONS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </label>
            <label className="field-label">
              Threshold value
              <input
                type="number"
                className="settings-input"
                value={pumpForm.trigger.value}
                onChange={e => setTrigger('value', Number(e.target.value))}
              />
            </label>
          </div>

          <div className="settings-row" style={{ marginTop: 16 }}>
            <label className="field-label">
              Cooldown (ms)
              <input
                type="number"
                className="settings-input"
                value={pumpForm.cooldownMs}
                onChange={e => setPump('cooldownMs', Number(e.target.value))}
              />
            </label>
            <label className="field-label">
              Run duration (ms)
              <input
                type="number"
                className="settings-input"
                value={pumpForm.defaultRunTimeMs}
                onChange={e => setPump('defaultRunTimeMs', Number(e.target.value))}
              />
            </label>
          </div>

          <button className="save-button" style={{ marginTop: 20 }} onClick={handlePumpSave} disabled={pumpStatus?.loading}>
            {pumpStatus?.loading ? 'Saving…' : 'Save Pump Config'}
          </button>
          {pumpStatus?.success && <p className="pair-success" style={{ marginTop: 8 }}>Pump config saved!</p>}
          {pumpStatus?.error && <p className="pair-error" style={{ marginTop: 8 }}>{pumpStatus.error}</p>}
        </div>
      </section>
    </div>
  );
}

export default Settings;
