

import { v4 as uuidv4 } from 'uuid';
import { FocusSession, StudentStats, Operation } from '../types';
import { HLC } from '../core/hlc';
import { createOperation } from '../core/operation-log';
import { DeviceStore } from '../storage/device-store';


export async function startSession(
  store: DeviceStore,
  hlc: HLC,
  targetDuration: number
): Promise<string> {
  const sessionId = uuidv4();
  const now = new Date().toISOString();
  const hlcTimestamp = hlc.now();

  const session: FocusSession = {
    id: sessionId,
    targetDuration,
    startedAt: now,
    status: 'active',
  };


  const sessions = [...store.getSessions(), session];
  await store.setSessions(sessions);


  const op = createOperation(
    'FOCUS_SESSION_START',
    { sessionId, targetDuration, startedAt: now },
    hlcTimestamp,
    store.getDeviceId()
  );
  await store.addOperation(op);

  console.log(`[FOCUS] Started session ${sessionId} (${targetDuration} min)`);
  return sessionId;
}


export async function completeSession(
  store: DeviceStore,
  hlc: HLC,
  sessionId: string,
  actualDuration: number
): Promise<void> {
  const now = new Date().toISOString();
  const hlcTimestamp = hlc.now();


  const sessions = store.getSessions().map(s => {
    if (s.id === sessionId) {
      return { ...s, status: 'success' as const, completedAt: now };
    }
    return s;
  });
  await store.setSessions(sessions);

  const op = createOperation(
    'FOCUS_SESSION_COMPLETE',
    { sessionId, completedAt: now, actualDuration },
    hlcTimestamp,
    store.getDeviceId()
  );
  await store.addOperation(op);


  await applyLocalReward(store, actualDuration);

  console.log(`[FOCUS] Completed session ${sessionId} (${actualDuration} min)`);
}

/**
 * Fail a focus session.
 * No rewards — just record the failure.
 */
export async function failSession(
  store: DeviceStore,
  hlc: HLC,
  sessionId: string,
  reason: 'give_up' | 'app_switch'
): Promise<void> {
  const now = new Date().toISOString();
  const hlcTimestamp = hlc.now();

  const sessions = store.getSessions().map(s => {
    if (s.id === sessionId) {
      return { ...s, status: 'failed' as const, failedAt: now, failReason: reason };
    }
    return s;
  });
  await store.setSessions(sessions);

  const op = createOperation(
    'FOCUS_SESSION_FAIL',
    { sessionId, failedAt: now, reason },
    hlcTimestamp,
    store.getDeviceId()
  );
  await store.addOperation(op);

  console.log(`[FOCUS] Failed session ${sessionId} (${reason})`);
}

/**
 * Apply rewards locally (optimistic update).
 * The server will independently compute the same rewards.
 */
async function applyLocalReward(store: DeviceStore, durationMinutes: number): Promise<void> {
  const stats = store.getStats();
  const today = new Date().toISOString().split('T')[0];

  // Reset today counter if it's a new day
  if (stats.todayDate !== today) {
    stats.todayDate = today;
    stats.todayFocusMinutes = 0;
  }

  // Coins: 10 per 5 minutes, minimum 10
  const coinsEarned = Math.max(10, Math.floor(durationMinutes / 5) * 10);
  stats.coins += coinsEarned;
  stats.todayFocusMinutes += durationMinutes;

  // Streak
  if (stats.lastSuccessDate === '') {
    stats.streak = 1;
  } else if (stats.lastSuccessDate === today) {
    // Already had a session today
  } else {
    const lastDate = new Date(stats.lastSuccessDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    stats.streak = diffDays === 1 ? stats.streak + 1 : 1;
  }
  stats.lastSuccessDate = today;

  await store.setStats(stats);
}
