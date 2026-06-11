

import { Subject, Task, TaskStatus, Chapter } from '../types';
import { HLC } from '../core/hlc';
import { createOperation } from '../core/operation-log';
import { DeviceStore } from '../storage/device-store';


export async function updateTaskStatus(
  store: DeviceStore,
  hlc: HLC,
  subjectId: string,
  chapterId: string,
  taskId: string,
  newStatus: TaskStatus
): Promise<void> {
  const hlcTimestamp = hlc.now();
  const subjects = store.getSubjects();

  // Find and update the task
  const updatedSubjects = subjects.map(subject => {
    if (subject.id !== subjectId) return subject;
    return {
      ...subject,
      chapters: subject.chapters.map(chapter => {
        if (chapter.id !== chapterId) return chapter;
        return {
          ...chapter,
          tasks: chapter.tasks.map(task => {
            if (task.id !== taskId) return task;

            // Create the operation BEFORE updating
            const previousStatus = task.status;

            return {
              ...task,
              status: newStatus,
              lastModifiedHlc: hlcTimestamp,
            };
          }),
        };
      }),
    };
  });

  await store.setSubjects(updatedSubjects);

  // Find previous status for the operation payload
  const task = findTask(subjects, subjectId, chapterId, taskId);
  const previousStatus = task?.status || 'not_started';

  const op = createOperation(
    'TASK_STATUS_CHANGE',
    { taskId, chapterId, subjectId, previousStatus, newStatus },
    hlcTimestamp,
    store.getDeviceId()
  );
  await store.addOperation(op);

  console.log(`[SYLLABUS] Task ${taskId}: ${previousStatus} → ${newStatus}`);
}

/**
 * Delete a task (soft delete).
 * The task is marked as deleted, not removed from the array.
 * This is the "tombstone" pattern — it ensures that even if
 * another device edits this task, the delete still wins.
 */
export async function deleteTask(
  store: DeviceStore,
  hlc: HLC,
  subjectId: string,
  chapterId: string,
  taskId: string
): Promise<void> {
  const hlcTimestamp = hlc.now();
  const subjects = store.getSubjects();

  const updatedSubjects = subjects.map(subject => {
    if (subject.id !== subjectId) return subject;
    return {
      ...subject,
      chapters: subject.chapters.map(chapter => {
        if (chapter.id !== chapterId) return chapter;
        return {
          ...chapter,
          tasks: chapter.tasks.map(task => {
            if (task.id !== taskId) return task;
            return { ...task, deleted: true, lastModifiedHlc: hlcTimestamp };
          }),
        };
      }),
    };
  });

  await store.setSubjects(updatedSubjects);

  const op = createOperation(
    'TASK_DELETE',
    { taskId, chapterId, subjectId },
    hlcTimestamp,
    store.getDeviceId()
  );
  await store.addOperation(op);

  console.log(`[SYLLABUS] Deleted task ${taskId}`);
}

/**
 * Compute chapter progress (% of completed tasks).
 * Only counts non-deleted tasks.
 */
export function getChapterProgress(chapter: Chapter): number {
  const activeTasks = chapter.tasks.filter(t => !t.deleted);
  if (activeTasks.length === 0) return 100; // No tasks = complete
  const done = activeTasks.filter(t => t.status === 'done').length;
  return Math.round((done / activeTasks.length) * 100);
}

/**
 * Compute subject progress (average of chapter progress).
 */
export function getSubjectProgress(subject: Subject): number {
  if (subject.chapters.length === 0) return 100;
  const total = subject.chapters.reduce((sum, ch) => sum + getChapterProgress(ch), 0);
  return Math.round(total / subject.chapters.length);
}

function findTask(subjects: Subject[], subjectId: string, chapterId: string, taskId: string): Task | null {
  const subject = subjects.find(s => s.id === subjectId);
  if (!subject) return null;
  const chapter = subject.chapters.find(c => c.id === chapterId);
  if (!chapter) return null;
  return chapter.tasks.find(t => t.id === taskId) || null;
}
