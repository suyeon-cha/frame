import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEYS = {
  pairCode: "alarm_pair_code",
  deviceRole: "alarm_device_role",
  deviceId: "alarm_device_id",
};

type DeviceRole = "primary" | "secondary";

interface AlarmContextValue {
  isLoading: boolean;
  isSetup: boolean;
  pairCode: string | null;
  deviceRole: DeviceRole | null;
  deviceId: number | null;
  setPairInfo: (pairCode: string, role: DeviceRole, deviceId: number) => Promise<void>;
  clearSetup: () => Promise<void>;
}

const AlarmContext = createContext<AlarmContextValue | null>(null);

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [deviceRole, setDeviceRole] = useState<DeviceRole | null>(null);
  const [deviceId, setDeviceId] = useState<number | null>(null);

  useEffect(() => {
    async function loadFromStorage() {
      try {
        const [storedCode, storedRole, storedId] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.pairCode),
          AsyncStorage.getItem(STORAGE_KEYS.deviceRole),
          AsyncStorage.getItem(STORAGE_KEYS.deviceId),
        ]);
        if (storedCode) setPairCode(storedCode);
        if (storedRole) setDeviceRole(storedRole as DeviceRole);
        if (storedId) setDeviceId(parseInt(storedId, 10));
      } finally {
        setIsLoading(false);
      }
    }
    loadFromStorage();
  }, []);

  const setPairInfo = useCallback(async (code: string, role: DeviceRole, id: number) => {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.pairCode, code),
      AsyncStorage.setItem(STORAGE_KEYS.deviceRole, role),
      AsyncStorage.setItem(STORAGE_KEYS.deviceId, id.toString()),
    ]);
    setPairCode(code);
    setDeviceRole(role);
    setDeviceId(id);
  }, []);

  const clearSetup = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.pairCode),
      AsyncStorage.removeItem(STORAGE_KEYS.deviceRole),
      AsyncStorage.removeItem(STORAGE_KEYS.deviceId),
    ]);
    setPairCode(null);
    setDeviceRole(null);
    setDeviceId(null);
  }, []);

  const isSetup = !!pairCode && !!deviceRole;

  return (
    <AlarmContext.Provider
      value={{ isLoading, isSetup, pairCode, deviceRole, deviceId, setPairInfo, clearSetup }}
    >
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarm() {
  const ctx = useContext(AlarmContext);
  if (!ctx) throw new Error("useAlarm must be used within AlarmProvider");
  return ctx;
}
