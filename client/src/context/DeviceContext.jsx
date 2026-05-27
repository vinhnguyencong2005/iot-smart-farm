import { createContext, useContext } from 'react';
import { useFarmDevice } from '../hooks/useFarmDevice';

const DeviceContext = createContext(null);

export function DeviceProvider({ children }) {
  const farmDevice = useFarmDevice();
  return <DeviceContext.Provider value={farmDevice}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
  return useContext(DeviceContext);
}
