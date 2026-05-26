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
