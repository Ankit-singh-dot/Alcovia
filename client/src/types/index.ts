// ============================================================
// Client Types — Mirrors Server Types
// ============================================================
// We duplicate types here so the client can work fully offline
// without importing from the server. In a real project, you'd
// share types via a shared package.
// ============================================================

export interface HLCTimestamp {
  wallTime: number;
  counter: number;
  nodeId: string;
}

export type OperationType =
  | 'FOCUS_SESSION_START'
  | 'FOCUS_SESSION_COMPLETE'
  | 'FOCUS_SESSION_FAIL'
  | 'TASK_STATUS_CHANGE'
  | 'TASK_DELETE';

export interface Operation {
  id: string;
  type: OperationType;
  payload: Record<string, unknown>;
  hlc: HLCTimestamp;
  deviceId: string;
  studentId: string;
  synced: boolean;
}

export type SessionStatus = 'active' | 'success' | 'failed';
export type FailReason = 'give_up' | 'app_switch';

export interface FocusSession {
  id: string;
  targetDuration: number;
  startedAt: string;
  completedAt?: string;
  failedAt?: string;
  status: SessionStatus;
  failReason?: FailReason;
}

export interface StudentStats {
  streak: number;
  coins: number;
  todayFocusMinutes: number;
  todayDate: string;
  lastSuccessDate: string;
}

export type TaskStatus = 'not_started' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  deleted: boolean;
  lastModifiedHlc: HLCTimestamp;
}

export interface Chapter {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Subject {
  id: string;
  title: string;
  chapters: Chapter[];
}

export interface SyncRequest {
  deviceId: string;
  studentId: string;
  operations: Operation[];
  lastSyncCounter: number;
}

export interface SyncResponse {
  operations: Operation[];
  state: {
    subjects: Subject[];
    sessions: FocusSession[];
    stats: StudentStats;
  };
  syncCounter: number;
  notifications: NotificationEvent[];
}

export interface NotificationEvent {
  sessionId: string;
  message: string;
  firedAt: string;
}

// Device state — everything a single device tracks locally
export interface DeviceState {
  subjects: Subject[];
  sessions: FocusSession[];
  stats: StudentStats;
  operations: Operation[];
  lastSyncCounter: number;
  isOnline: boolean;
}
