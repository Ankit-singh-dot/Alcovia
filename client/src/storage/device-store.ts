

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceState, Subject, FocusSession, StudentStats, Operation } from '../types';
import { SEED_SUBJECTS } from '../constants/seed-data';

function createInitialStats(): StudentStats {
  const today = new Date().toISOString().split('T')[0];
  return {
    streak: 0,
    coins: 0,
    todayFocusMinutes: 0,
    todayDate: today,
    lastSuccessDate: '',
  };
}

export class DeviceStore {
  private deviceId: string;
  private prefix: string;

  // In-memory cache (faster than reading AsyncStorage every time)
  private subjects: Subject[];
  private sessions: FocusSession[];
  private stats: StudentStats;
  private operations: Operation[];
  private lastSyncCounter: number;
  private isOnline: boolean;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
    this.prefix = `${deviceId}:`;

    // Initialize with seed data
    this.subjects = JSON.parse(JSON.stringify(SEED_SUBJECTS));
    this.sessions = [];
    this.stats = createInitialStats();
    this.operations = [];
    this.lastSyncCounter = 0;
    this.isOnline = true;
  }

  /** Load persisted state from AsyncStorage */
  async load(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(`${this.prefix}state`);
      if (data) {
        const parsed: DeviceState = JSON.parse(data);
        this.subjects = parsed.subjects;
        this.sessions = parsed.sessions;
        this.stats = parsed.stats;
        this.operations = parsed.operations;
        this.lastSyncCounter = parsed.lastSyncCounter;
        this.isOnline = parsed.isOnline;
      }
    } catch (e) {
      console.error(`[STORE:${this.deviceId}] Load failed:`, e);
    }
  }

  /** Persist current state to AsyncStorage */
  async save(): Promise<void> {
    try {
      const state: DeviceState = {
        subjects: this.subjects,
        sessions: this.sessions,
        stats: this.stats,
        operations: this.operations,
        lastSyncCounter: this.lastSyncCounter,
        isOnline: this.isOnline,
      };
      await AsyncStorage.setItem(`${this.prefix}state`, JSON.stringify(state));
    } catch (e) {
      console.error(`[STORE:${this.deviceId}] Save failed:`, e);
    }
  }

  /** Clear all stored data and reset to initial state */
  async reset(): Promise<void> {
    this.subjects = JSON.parse(JSON.stringify(SEED_SUBJECTS));
    this.sessions = [];
    this.stats = createInitialStats();
    this.operations = [];
    this.lastSyncCounter = 0;
    this.isOnline = true;
    await AsyncStorage.removeItem(`${this.prefix}state`);
  }

  // --------------------------------------------------------
  // Getters
  // --------------------------------------------------------
  getDeviceId(): string { return this.deviceId; }
  getSubjects(): Subject[] { return this.subjects; }
  getSessions(): FocusSession[] { return this.sessions; }
  getStats(): StudentStats { return { ...this.stats }; }
  getOperations(): Operation[] { return this.operations; }
  getLastSyncCounter(): number { return this.lastSyncCounter; }
  getIsOnline(): boolean { return this.isOnline; }
  getUnsyncedCount(): number { return this.operations.filter(op => !op.synced).length; }

  getState(): DeviceState {
    return {
      subjects: this.subjects,
      sessions: this.sessions,
      stats: { ...this.stats },
      operations: this.operations,
      lastSyncCounter: this.lastSyncCounter,
      isOnline: this.isOnline,
    };
  }

  // --------------------------------------------------------
  // Setters (with auto-save)
  // --------------------------------------------------------
  async setSubjects(subjects: Subject[]): Promise<void> {
    this.subjects = subjects;
    await this.save();
  }

  async setSessions(sessions: FocusSession[]): Promise<void> {
    this.sessions = sessions;
    await this.save();
  }

  async setStats(stats: StudentStats): Promise<void> {
    this.stats = stats;
    await this.save();
  }

  async addOperation(op: Operation): Promise<void> {
    this.operations.push(op);
    await this.save();
  }

  async setOperations(ops: Operation[]): Promise<void> {
    this.operations = ops;
    await this.save();
  }

  async setLastSyncCounter(counter: number): Promise<void> {
    this.lastSyncCounter = counter;
    await this.save();
  }

  async setIsOnline(online: boolean): Promise<void> {
    this.isOnline = online;
    await this.save();
  }

  /** Bulk update after sync — applies server state */
  async applyServerState(
    subjects: Subject[],
    sessions: FocusSession[],
    stats: StudentStats,
    syncCounter: number
  ): Promise<void> {
    this.subjects = subjects;
    this.sessions = sessions;
    this.stats = stats;
    this.lastSyncCounter = syncCounter;
    // Mark all ops as synced
    this.operations = this.operations.map(op => ({ ...op, synced: true }));
    await this.save();
  }
}
