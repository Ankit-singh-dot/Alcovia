
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

export interface FocusSessionStartPayload {
  sessionId: string;
  targetDuration: number; 
  startedAt: string;      
}

export interface FocusSessionCompletePayload {
  sessionId: string;
  completedAt: string;    // ISO timestamp
  actualDuration: number; 
}

export interface FocusSessionFailPayload {
  sessionId: string;
  failedAt: string;       
  reason: 'give_up' | 'app_switch';
}

export interface TaskStatusChangePayload {
  taskId: string;
  chapterId: string;
  subjectId: string;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
}

export interface TaskDeletePayload {
  taskId: string;
  chapterId: string;
  subjectId: string;
}

export type SessionStatus = 'active' | 'success' | 'failed';
export type FailReason = 'give_up' | 'app_switch';

export interface FocusSession {
  id: string;
  targetDuration: number;  // minutes
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

  state: ServerState;

  syncCounter: number;

  notifications: NotificationEvent[];
}

export interface ServerState {
  subjects: Subject[];
  sessions: FocusSession[];
  stats: StudentStats;
}


export interface NotificationEvent {
  sessionId: string;
  message: string;
  firedAt: string;
}

export interface WebhookPayload {
  sessionId: string;
  studentId: string;
  streak: number;
  coins: number;
  coinsEarned: number;
  focusMinutes: number;
  message: string;
}
