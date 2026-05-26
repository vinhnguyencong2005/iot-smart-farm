import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { lookupDevice, triggerPump } from '../api/farm';

export function useFarmDevice() {
  const [deviceId, setDeviceId] = useState(null);
  const [readings, setReadings] = useState(null);
  const [pairError, setPairError] = useState(null);
  const [isWatering, setIsWatering] = useState(false);
  const stompRef = useRef(null);

  // Subscribe to RabbitMQ STOMP whenever deviceId changes
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
    } catch {
      setPairError('Device not found. Check the MAC address and try again.');
    }
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

  return { deviceId, readings, pairError, pair, water, isWatering };
}
