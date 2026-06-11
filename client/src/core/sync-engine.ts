

import { Operation, SyncRequest, SyncResponse, DeviceState } from '../types';
import { getUnsyncedOps } from './operation-log';

const API_BASE = 'http://localhost:3001/api';
const STUDENT_ID = 'student-1';

/**
 * Perform a sync with the server.
 *
 * @param deviceId - This device's unique identifier
 * @param operations - All local operations (synced + unsynced)
 * @param lastSyncCounter - The server's sync counter from last sync
 * @returns The server's response, or null if sync failed
 */
export async function performSync(
  deviceId: string,
  operations: Operation[],
  lastSyncCounter: number
): Promise<SyncResponse | null> {
  const unsynced = getUnsyncedOps(operations);

  if (unsynced.length === 0 && lastSyncCounter > 0) {
    // Still sync even with no unsynced ops — we might have
    // remote operations to pull from the other device
  }

  const request: SyncRequest = {
    deviceId,
    studentId: STUDENT_ID,
    operations: unsynced,
    lastSyncCounter,
  };

  console.log(`[SYNC] Pushing ${unsynced.length} operations, pulling since counter ${lastSyncCounter}`);

  try {
    const response = await fetch(`${API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      console.error(`[SYNC] Server returned ${response.status}`);
      return null;
    }

    const data: SyncResponse = await response.json();
    console.log(`[SYNC] Received ${data.operations.length} remote operations, new counter: ${data.syncCounter}`);
    return data;
  } catch (error) {
    console.error('[SYNC] Network error:', error);
    return null;
  }
}

/**
 * Fetch notification history from the server.
 * Used by the dev panel to show webhook activity.
 */
export async function fetchNotifications(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE}/notifications`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}
