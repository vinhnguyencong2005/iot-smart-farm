import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { lookupDevice, triggerPump, updatePumpConfig } from '../api/farm';

const MAX_HISTORY = 60;

function normalizeTrigger(trigger) {
  const fallback = { type: 'soil', condition: 'LESS_THAN', value: 30 };
  if (!trigger) return fallback;
  return Array.isArray(trigger) ? (trigger[0] ?? fallback) : trigger;
}

export function useFarmDevice() {
  const [deviceId, setDeviceId] = useState(null);
  const [pumpConfig, setPumpConfig] = useState(null);
  const [readings, setReadings] = useState(null);
  const [history, setHistory] = useState([]);
  const [pairError, setPairError] = useState(null);
  const [isWatering, setIsWatering] = useState(false);
  const stompRef = useRef(null);

  useEffect(() => {
    if (!deviceId) return;

    const client = new Client({
      brokerURL: 'ws://localhost:15674/ws',
      login: 'admin',
      passcode: 'password',
      onConnect: () => {
        client.subscribe(
          `/exchange/telemetry/device.${deviceId}`,
          (msg) => {
            const event = JSON.parse(msg.body);
            setReadings(event.readings);
            setHistory(prev => {
              const next = [...prev, { time: new Date(), readings: event.readings }];
              return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
            });
          },
        );
      },
    });

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [deviceId]);

  const pair = async (macAddress) => {
    setPairError(null);
    try {
      const device = await lookupDevice(macAddress);
      setDeviceId(device._id);
      setPumpConfig(device.pumpConfig ?? null);
      setHistory([]);
      setReadings(null);
    } catch {
      setPairError('Device not found. Check the MAC address and try again.');
    }
  };

  const saveRunDuration = async (durationMs) => {
    if (!deviceId || !pumpConfig) return;
    const payload = {
      enabled: pumpConfig.enabled ?? true,
      cooldownMs: pumpConfig.cooldownMs ?? 60000,
      defaultRunTimeMs: durationMs,
      trigger: normalizeTrigger(pumpConfig.trigger),
    };
    const updated = await updatePumpConfig(deviceId, payload);
    setPumpConfig(updated.pumpConfig ?? { ...pumpConfig, defaultRunTimeMs: durationMs });
  };

  const water = async () => {
    if (!deviceId || isWatering) return;
    setIsWatering(true);
    try {
      await triggerPump(deviceId);
    } catch (err) {
      console.error('Pump trigger failed:', err.message);
    } finally {
      setIsWatering(false);
    }
  };

  return { deviceId, pumpConfig, readings, history, pairError, pair, water, isWatering, saveRunDuration };
}
