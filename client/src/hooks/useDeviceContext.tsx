

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DeviceStore } from '../storage/device-store';
import { HLC } from '../core/hlc';
import { performSync, fetchNotifications } from '../core/sync-engine';
import { applyRemoteOperations } from '../core/merge';
import {
  DeviceState,
  Subject,
  FocusSession,
  StudentStats,
  Operation,
  NotificationEvent,
} from '../types';
import { SEED_SUBJECTS } from '../constants/seed-data';

interface DeviceContextType {
  deviceId: string;
  store: DeviceStore;
  hlc: HLC;
  state: DeviceState;
  notifications: NotificationEvent[];
  isOnline: boolean;
  isSyncing: boolean;
  unsyncedCount: number;
  setOnline: (online: boolean) => Promise<void>;
  sync: () => Promise<void>;
  refreshState: () => void;
  resetDevice: () => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | null>(null);

export function useDeviceContext(): DeviceContextType {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error('useDeviceContext must be used within DeviceProvider');
  return ctx;
}

interface DeviceProviderProps {
  deviceId: string;
  children: React.ReactNode;
}

export function DeviceProvider({ deviceId, children }: DeviceProviderProps) {
  const storeRef = useRef(new DeviceStore(deviceId));
  const hlcRef = useRef(new HLC(deviceId));

  const [state, setState] = useState<DeviceState>({
    subjects: JSON.parse(JSON.stringify(SEED_SUBJECTS)),
    sessions: [],
    stats: { streak: 0, coins: 0, todayFocusMinutes: 0, todayDate: new Date().toISOString().split('T')[0], lastSuccessDate: '' },
    operations: [],
    lastSyncCounter: 0,
    isOnline: true,
  });
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    const load = async () => {
      await storeRef.current.load();
      setState(storeRef.current.getState());
    };
    load();
  }, []);

  const refreshState = useCallback(() => {
    setState(storeRef.current.getState());
  }, []);

  const setOnline = useCallback(async (online: boolean) => {
    await storeRef.current.setIsOnline(online);
    setState(storeRef.current.getState());
  }, []);

  const sync = useCallback(async () => {
    if (!storeRef.current.getIsOnline()) {
      console.log(`[DEVICE:${deviceId}] Cannot sync — offline`);
      return;
    }

    setIsSyncing(true);
    try {
      const response = await performSync(
        deviceId,
        storeRef.current.getOperations(),
        storeRef.current.getLastSyncCounter()
      );

      if (response) {
        // Apply server state (server is the source of truth after sync)
        await storeRef.current.applyServerState(
          response.state.subjects,
          response.state.sessions,
          response.state.stats,
          response.syncCounter
        );

        // Update notifications
        setNotifications(response.notifications);
        setState(storeRef.current.getState());

        console.log(`[DEVICE:${deviceId}] Sync complete ✓`);
      }
    } catch (error) {
      console.error(`[DEVICE:${deviceId}] Sync error:`, error);
    } finally {
      setIsSyncing(false);
    }
  }, [deviceId]);

  const resetDevice = useCallback(async () => {
    await storeRef.current.reset();
    hlcRef.current = new HLC(deviceId);
    setNotifications([]);
    setState(storeRef.current.getState());
  }, [deviceId]);

  const value: DeviceContextType = {
    deviceId,
    store: storeRef.current,
    hlc: hlcRef.current,
    state,
    notifications,
    isOnline: state.isOnline,
    isSyncing,
    unsyncedCount: state.operations.filter(op => !op.synced).length,
    setOnline,
    sync,
    refreshState,
    resetDevice,
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}
