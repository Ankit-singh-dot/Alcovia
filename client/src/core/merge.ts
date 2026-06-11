

import { Operation, Subject, Task, FocusSession, StudentStats, HLCTimestamp } from '../types';
import { HLC } from './hlc';


export function applyRemoteOperations(
  subjects: Subject[],
  sessions: FocusSession[],
  stats: StudentStats,
  operations: Operation[],
  hlc: HLC
): { subjects: Subject[]; sessions: FocusSession[]; stats: StudentStats } {

  let updatedSubjects = JSON.parse(JSON.stringify(subjects)) as Subject[];
  let updatedSessions = [...sessions];
  let updatedStats = { ...stats };

  for (const op of operations) {

    hlc.receive(op.hlc);

    switch (op.type) {
      case 'FOCUS_SESSION_START': {
        const p = op.payload as any;
        if (!updatedSessions.find(s => s.id === p.sessionId)) {
          updatedSessions.push({
            id: p.sessionId,
            targetDuration: p.targetDuration,
            startedAt: p.startedAt,
            status: 'active',
          });
        }
        break;
      }

      case 'FOCUS_SESSION_COMPLETE': {
        const p = op.payload as any;
        let session = updatedSessions.find(s => s.id === p.sessionId);
        if (!session) {
          session = {
            id: p.sessionId,
            targetDuration: p.actualDuration,
            startedAt: p.completedAt,
            status: 'active',
          };
          updatedSessions.push(session);
        }
        if (session.status !== 'success') {
          session.status = 'success';
          session.completedAt = p.completedAt;
        }
        break;
      }

      case 'FOCUS_SESSION_FAIL': {
        const p = op.payload as any;
        let session = updatedSessions.find(s => s.id === p.sessionId);
        if (!session) {
          session = {
            id: p.sessionId,
            targetDuration: 0,
            startedAt: p.failedAt,
            status: 'active',
          };
          updatedSessions.push(session);
        }
        if (session.status === 'active') {
          session.status = 'failed';
          session.failedAt = p.failedAt;
          session.failReason = p.reason;
        }
        break;
      }

      case 'TASK_STATUS_CHANGE': {
        const p = op.payload as any;
        const task = findTask(updatedSubjects, p.subjectId, p.chapterId, p.taskId);
        if (task && !task.deleted) {
          // CONFLICT RESOLUTION: Higher HLC wins
          if (HLC.compare(op.hlc, task.lastModifiedHlc) > 0) {
            task.status = p.newStatus;
            task.lastModifiedHlc = op.hlc;
          }
        }
        break;
      }

      case 'TASK_DELETE': {
        const p = op.payload as any;
        const task = findTask(updatedSubjects, p.subjectId, p.chapterId, p.taskId);
        if (task) {
          // DELETE ALWAYS WINS
          task.deleted = true;
          task.lastModifiedHlc = op.hlc;
        }
        break;
      }
    }
  }

  return {
    subjects: updatedSubjects,
    sessions: updatedSessions,
    stats: updatedStats,
  };
}

function findTask(subjects: Subject[], subjectId: string, chapterId: string, taskId: string): Task | null {
  const subject = subjects.find(s => s.id === subjectId);
  if (!subject) return null;
  const chapter = subject.chapters.find(c => c.id === chapterId);
  if (!chapter) return null;
  return chapter.tasks.find(t => t.id === taskId) || null;
}
