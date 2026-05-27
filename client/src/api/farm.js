const BASE_URL = 'http://localhost:3000';

export async function lookupDevice(macAddress) {
  const res = await fetch(`${BASE_URL}/device/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ macAddress: macAddress.toUpperCase() }),
  });
  if (!res.ok) throw new Error('Device not found');
  return res.json();
}

export async function triggerPump(deviceId) {
  const res = await fetch(`${BASE_URL}/irrigation/${deviceId}/pump`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Pump trigger failed');
  return data;
}

export async function getLatestTelemetry(deviceId) {
  const res = await fetch(`${BASE_URL}/analytic/telemetry/latest?deviceId=${deviceId}`);
  if (!res.ok) throw new Error('Failed to fetch latest telemetry');
  return res.json();
}

export async function getTelemetryTrend({ deviceId, startDate, endDate, resolution = 'day' }) {
  const params = new URLSearchParams({ deviceId, startDate, endDate, resolution });
  const res = await fetch(`${BASE_URL}/analytic/telemetry/trend?${params}`);
  if (!res.ok) throw new Error('Failed to fetch telemetry trend');
  return res.json();
}

export async function getTelemetryHistory({ deviceId, startDate, endDate, page = 1, limit = 10 }) {
  const params = new URLSearchParams({ deviceId, startDate, endDate, page, limit });
  const res = await fetch(`${BASE_URL}/analytic/telemetry/history?${params}`);
  if (!res.ok) throw new Error('Failed to fetch telemetry history');
  return res.json();
}

export async function getIrrigationUsage({ deviceId, startDate, endDate }) {
  const params = new URLSearchParams({ deviceId, startDate, endDate });
  const res = await fetch(`${BASE_URL}/analytic/irrigation/usage?${params}`);
  if (!res.ok) throw new Error('Failed to fetch irrigation usage');
  return res.json();
}

export async function getIrrigationHistory({ deviceId, startDate, endDate, page = 1, limit = 10 }) {
  const params = new URLSearchParams({ deviceId, startDate, endDate, page, limit });
  const res = await fetch(`${BASE_URL}/analytic/irrigation-history?${params}`);
  if (!res.ok) throw new Error('Failed to fetch irrigation history');
  return res.json();
}

export async function getAlerts({ deviceId, startDate, endDate, page = 1, limit = 15 }) {
  const params = new URLSearchParams({ page, limit });
  if (deviceId) params.set('deviceId', deviceId);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const res = await fetch(`${BASE_URL}/monitor/alerts?${params}`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function updateSensorConfig(deviceId, sensorType, { minThreshold, maxThreshold }) {
  const res = await fetch(`${BASE_URL}/device/${deviceId}/sensor-config/${sensorType}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minThreshold, maxThreshold }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update sensor config');
  return data;
}

export async function updatePumpConfig(deviceId, config) {
  const res = await fetch(`${BASE_URL}/device/${deviceId}/pump-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update pump config');
  return data;
}

export async function seedFakeData(deviceId) {
  const res = await fetch(`${BASE_URL}/analytic/seed-fake-data/${deviceId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to seed fake data');
  return res.json();
}
