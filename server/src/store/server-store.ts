

import { v4 as uuidv4 } from 'uuid';
import {
  Operation,
  FocusSession,
  Subject,
  StudentStats,
  Task,
  HLCTimestamp,
  NotificationEvent,
} from '../types';


function createInitialHLC(): HLCTimestamp {
  return { wallTime: 0, counter: 0, nodeId: 'server' };
}

function createSeedData(): Subject[] {
  return [
    {
      id: 'subject-math',
      title: 'Mathematics',
      chapters: [
        {
          id: 'ch-math-1',
          title: 'Algebra',
          tasks: [
            { id: 'task-math-1-1', title: 'Linear Equations', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
            { id: 'task-math-1-2', title: 'Quadratic Equations', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
            { id: 'task-math-1-3', title: 'Polynomials', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
          ],
        },
        {
          id: 'ch-math-2',
          title: 'Geometry',
          tasks: [
            { id: 'task-math-2-1', title: 'Triangles', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
            { id: 'task-math-2-2', title: 'Circles', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
            { id: 'task-math-2-3', title: 'Coordinate Geometry', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
          ],
        },
      ],
    },
    {
      id: 'subject-science',
      title: 'Science',
      chapters: [
        {
          id: 'ch-sci-1',
          title: 'Physics',
          tasks: [
            { id: 'task-sci-1-1', title: 'Laws of Motion', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
            { id: 'task-sci-1-2', title: 'Gravitation', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
            { id: 'task-sci-1-3', title: 'Light & Optics', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
          ],
        },
        {
          id: 'ch-sci-2',
          title: 'Chemistry',
          tasks: [
            { id: 'task-sci-2-1', title: 'Periodic Table', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
            { id: 'task-sci-2-2', title: 'Chemical Reactions', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
            { id: 'task-sci-2-3', title: 'Acids & Bases', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
            { id: 'task-sci-2-4', title: 'Carbon Compounds', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
          ],
        },
      ],
    },
    {
      id: 'subject-english',
      title: 'English',
      chapters: [
        {
          id: 'ch-eng-1',
          title: 'Grammar',
          tasks: [
            { id: 'task-eng-1-1', title: 'Tenses', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
            { id: 'task-eng-1-2', title: 'Active & Passive Voice', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
            { id: 'task-eng-1-3', title: 'Direct & Indirect Speech', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
          ],
        },
        {
          id: 'ch-eng-2',
          title: 'Literature',
          tasks: [
            { id: 'task-eng-2-1', title: 'Poetry Analysis', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
            { id: 'task-eng-2-2', title: 'Short Stories', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
            { id: 'task-eng-2-3', title: 'Essay Writing', status: 'not_started', deleted: false, lastModifiedHlc: createInitialHLC() },
          ],
        },
      ],
    },
  ];
}

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

// ----------------------------------------------------------
// Server Store
// ----------------------------------------------------------
export class ServerStore {

  private operationLog: Operation[] = [];


  private processedOpIds: Set<string> = new Set();


  private firedWebhookSessionIds: Set<string> = new Set();


  private syncCounter: number = 0;


  private counterToOp: Map<number, Operation> = new Map();


  private subjects: Subject[] = createSeedData();
  private sessions: FocusSession[] = [];
  private stats: StudentStats = createInitialStats();
  private notifications: NotificationEvent[] = [];

  
  processOperations(operations: Operation[]): Operation[] {
    const newOps: Operation[] = [];

    for (const op of operations) {
      // DEDUP: Skip if already processed
      if (this.processedOpIds.has(op.id)) {
        console.log(`[DEDUP] Skipping already-processed operation: ${op.id} (${op.type})`);
        continue;
      }

      // Mark as processed
      this.processedOpIds.add(op.id);
      op.synced = true;

      // Assign a sync counter (for ordering and sync protocol)
      this.syncCounter++;
      this.counterToOp.set(this.syncCounter, op);
      this.operationLog.push(op);

      // Apply the operation to our state
      this.applyOperation(op);

      newOps.push(op);
    }

    return newOps;
  }

  /**
   * Apply a single operation to the server state.
   * This is where the business logic lives.
   */
  private applyOperation(op: Operation): void {
    switch (op.type) {
      case 'FOCUS_SESSION_START':
        this.applyFocusStart(op);
        break;
      case 'FOCUS_SESSION_COMPLETE':
        this.applyFocusComplete(op);
        break;
      case 'FOCUS_SESSION_FAIL':
        this.applyFocusFail(op);
        break;
      case 'TASK_STATUS_CHANGE':
        this.applyTaskStatusChange(op);
        break;
      case 'TASK_DELETE':
        this.applyTaskDelete(op);
        break;
    }
  }

  private applyFocusStart(op: Operation): void {
    const payload = op.payload as unknown as { sessionId: string; targetDuration: number; startedAt: string };
    // Don't duplicate sessions
    if (this.sessions.find(s => s.id === payload.sessionId)) return;

    this.sessions.push({
      id: payload.sessionId,
      targetDuration: payload.targetDuration,
      startedAt: payload.startedAt,
      status: 'active',
    });
  }

  private applyFocusComplete(op: Operation): void {
    const payload = op.payload as unknown as { sessionId: string; completedAt: string; actualDuration: number };
    
    let session = this.sessions.find(s => s.id === payload.sessionId);
    if (!session) {
      // Session start might not have synced yet, create it
      session = {
        id: payload.sessionId,
        targetDuration: payload.actualDuration,
        startedAt: payload.completedAt,
        status: 'active',
      };
      this.sessions.push(session);
    }

    // Only process if not already completed
    if (session.status === 'success') return;

    session.status = 'success';
    session.completedAt = payload.completedAt;

    // IDEMPOTENT REWARDS
    this.processReward(payload.sessionId, payload.actualDuration);
  }

  private applyFocusFail(op: Operation): void {
    const payload = op.payload as unknown as { sessionId: string; failedAt: string; reason: string };
    
    let session = this.sessions.find(s => s.id === payload.sessionId);
    if (!session) {
      session = {
        id: payload.sessionId,
        targetDuration: 0,
        startedAt: payload.failedAt,
        status: 'active',
      };
      this.sessions.push(session);
    }

    if (session.status !== 'active') return;

    session.status = 'failed';
    session.failedAt = payload.failedAt;
    session.failReason = payload.reason as 'give_up' | 'app_switch';
  }

  private applyTaskStatusChange(op: Operation): void {
    const payload = op.payload as unknown as {
      taskId: string; subjectId: string; chapterId: string;
      newStatus: string; previousStatus: string;
    };

    const task = this.findTask(payload.subjectId, payload.chapterId, payload.taskId);
    if (!task || task.deleted) return;

    // CONFLICT RESOLUTION: Higher HLC wins
    // If the current task was modified with a higher HLC, skip this op
    if (this.compareHLC(task.lastModifiedHlc, op.hlc) > 0) {
      console.log(`[CONFLICT] Keeping existing state for task ${payload.taskId} — existing HLC is higher`);
      return;
    }

    task.status = payload.newStatus as 'not_started' | 'in_progress' | 'done';
    task.lastModifiedHlc = op.hlc;
  }

  private applyTaskDelete(op: Operation): void {
    const payload = op.payload as unknown as { taskId: string; subjectId: string; chapterId: string };
    const task = this.findTask(payload.subjectId, payload.chapterId, payload.taskId);
    if (!task) return;

    // DELETE ALWAYS WINS over edits
    task.deleted = true;
    task.lastModifiedHlc = op.hlc;
  }

 
  private rewardedSessionIds: Set<string> = new Set();

  private processReward(sessionId: string, durationMinutes: number): void {
    if (this.rewardedSessionIds.has(sessionId)) {
      console.log(`[REWARD] Already rewarded session ${sessionId}, skipping`);
      return;
    }

    this.rewardedSessionIds.add(sessionId);


    const today = new Date().toISOString().split('T')[0];
    if (this.stats.todayDate !== today) {
      this.stats.todayDate = today;
      this.stats.todayFocusMinutes = 0;
    }


    const coinsEarned = Math.max(10, Math.floor(durationMinutes / 5) * 10);
    this.stats.coins += coinsEarned;


    this.stats.todayFocusMinutes += durationMinutes;


    if (this.stats.lastSuccessDate === '') {

      this.stats.streak = 1;
    } else if (this.stats.lastSuccessDate === today) {

    } else {
      const lastDate = new Date(this.stats.lastSuccessDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day
        this.stats.streak += 1;
      } else {
        // Streak broken
        this.stats.streak = 1;
      }
    }

    this.stats.lastSuccessDate = today;

    console.log(`[REWARD] Session ${sessionId}: +${coinsEarned} coins, streak=${this.stats.streak}, today=${this.stats.todayFocusMinutes}min`);
  }

  
  shouldFireWebhook(sessionId: string): boolean {
    if (this.firedWebhookSessionIds.has(sessionId)) {
      console.log(`[WEBHOOK] Already fired for session ${sessionId}, skipping`);
      return false;
    }
    this.firedWebhookSessionIds.add(sessionId);
    return true;
  }

  addNotification(event: NotificationEvent): void {
    this.notifications.push(event);
  }

  
  getOperationsSince(lastSyncCounter: number, deviceId: string): { ops: Operation[]; newCounter: number } {
    const ops: Operation[] = [];
    
    for (let i = lastSyncCounter + 1; i <= this.syncCounter; i++) {
      const op = this.counterToOp.get(i);
      if (op && op.deviceId !== deviceId) {
        ops.push(op);
      }
    }

    return { ops, newCounter: this.syncCounter };
  }

  getState() {
    return {
      subjects: this.subjects,
      sessions: this.sessions,
      stats: { ...this.stats },
    };
  }

  getNotifications(): NotificationEvent[] {
    return [...this.notifications];
  }

  getStats(): StudentStats {
    return { ...this.stats };
  }

 

  private findTask(subjectId: string, chapterId: string, taskId: string): Task | null {
    const subject = this.subjects.find(s => s.id === subjectId);
    if (!subject) return null;
    const chapter = subject.chapters.find(c => c.id === chapterId);
    if (!chapter) return null;
    return chapter.tasks.find(t => t.id === taskId) || null;
  }


  private compareHLC(a: HLCTimestamp, b: HLCTimestamp): number {
    if (a.wallTime !== b.wallTime) return a.wallTime < b.wallTime ? -1 : 1;
    if (a.counter !== b.counter) return a.counter < b.counter ? -1 : 1;
    return a.nodeId < b.nodeId ? -1 : a.nodeId > b.nodeId ? 1 : 0;
  }
}


export const serverStore = new ServerStore();
