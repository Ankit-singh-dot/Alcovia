

import { v4 as uuidv4 } from 'uuid';
import { Operation, OperationType, HLCTimestamp } from '../types';

const STUDENT_ID = 'student-1'; // Hardcoded as per assignment


export function createOperation(
  type: OperationType,
  payload: Record<string, unknown>,
  hlc: HLCTimestamp,
  deviceId: string
): Operation {
  return {
    id: uuidv4(),
    type,
    payload,
    hlc,
    deviceId,
    studentId: STUDENT_ID,
    synced: false, // Will be set to true after server acknowledges
  };
}


export function getUnsyncedOps(operations: Operation[]): Operation[] {
  return operations.filter(op => !op.synced);
}


export function markOpsSynced(operations: Operation[], syncedIds: Set<string>): Operation[] {
  return operations.map(op => {
    if (syncedIds.has(op.id)) {
      return { ...op, synced: true };
    }
    return op;
  });
}
