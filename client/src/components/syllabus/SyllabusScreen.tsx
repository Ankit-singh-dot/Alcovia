

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDeviceContext } from '../../hooks/useDeviceContext';
import {
  updateTaskStatus,
  deleteTask,
  getChapterProgress,
  getSubjectProgress,
} from '../../services/syllabus-service';
import { Button, Card, ProgressBar, SectionHeader, StatusBadge } from '../ui/SharedComponents';
import { Subject, Chapter, Task, TaskStatus } from '../../types';

const STATUS_CYCLE: TaskStatus[] = ['not_started', 'in_progress', 'done'];
const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  done: 'Done',
};

export default function SyllabusScreen() {
  const { store, hlc, state, refreshState } = useDeviceContext();
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const handleStatusChange = useCallback(async (
    subjectId: string,
    chapterId: string,
    taskId: string,
    currentStatus: TaskStatus
  ) => {
    const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
    await updateTaskStatus(store, hlc, subjectId, chapterId, taskId, nextStatus);
    refreshState();
  }, [store, hlc, refreshState]);

  const handleDelete = useCallback(async (
    subjectId: string,
    chapterId: string,
    taskId: string,
    taskTitle: string
  ) => {
    await deleteTask(store, hlc, subjectId, chapterId, taskId);
    refreshState();
  }, [store, hlc, refreshState]);

  const toggleChapter = useCallback((chapterId: string) => {
    setExpandedChapter(prev => prev === chapterId ? null : chapterId);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {state.subjects.map(subject => (
        <SubjectSection
          key={subject.id}
          subject={subject}
          expandedChapter={expandedChapter}
          onToggleChapter={toggleChapter}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      ))}
    </ScrollView>
  );
}

// ----------------------------------------------------------
// Subject Section
// ----------------------------------------------------------
function SubjectSection({
  subject,
  expandedChapter,
  onToggleChapter,
  onStatusChange,
  onDelete,
}: {
  subject: Subject;
  expandedChapter: string | null;
  onToggleChapter: (id: string) => void;
  onStatusChange: (subjectId: string, chapterId: string, taskId: string, status: TaskStatus) => void;
  onDelete: (subjectId: string, chapterId: string, taskId: string, title: string) => void;
}) {
  const progress = getSubjectProgress(subject);

  return (
    <View style={styles.subjectSection}>
      <View style={styles.subjectHeader}>
        <View style={styles.subjectTitleRow}>
          <Text style={styles.subjectTitle}>{subject.title}</Text>
          <Text style={styles.subjectProgress}>{progress}%</Text>
        </View>
        <ProgressBar progress={progress} height={4} style={styles.subjectProgressBar} />
      </View>

      {subject.chapters.map(chapter => (
        <ChapterAccordion
          key={chapter.id}
          chapter={chapter}
          subjectId={subject.id}
          isExpanded={expandedChapter === chapter.id}
          onToggle={() => onToggleChapter(chapter.id)}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
}

// ----------------------------------------------------------
// Chapter Accordion
// ----------------------------------------------------------
function ChapterAccordion({
  chapter,
  subjectId,
  isExpanded,
  onToggle,
  onStatusChange,
  onDelete,
}: {
  chapter: Chapter;
  subjectId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (subjectId: string, chapterId: string, taskId: string, status: TaskStatus) => void;
  onDelete: (subjectId: string, chapterId: string, taskId: string, title: string) => void;
}) {
  const progress = getChapterProgress(chapter);
  const activeTasks = chapter.tasks.filter(t => !t.deleted);
  const doneTasks = activeTasks.filter(t => t.status === 'done').length;

  return (
    <Card style={styles.chapterCard}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.chapterHeader}>
          <View style={styles.chapterTitleArea}>
            <Text style={styles.chapterArrow}>{isExpanded ? '▼' : '▶'}</Text>
            <View>
              <Text style={styles.chapterTitle}>{chapter.title}</Text>
              <Text style={styles.chapterMeta}>
                {doneTasks}/{activeTasks.length} tasks • {progress}%
              </Text>
            </View>
          </View>
          <ProgressBar progress={progress} height={3} style={styles.chapterProgress} />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.taskList}>
          {chapter.tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onStatusChange={() => onStatusChange(subjectId, chapter.id, task.id, task.status)}
              onDelete={() => onDelete(subjectId, chapter.id, task.id, task.title)}
            />
          ))}
        </View>
      )}
    </Card>
  );
}

// ----------------------------------------------------------
// Task Row
// ----------------------------------------------------------
function TaskRow({
  task,
  onStatusChange,
  onDelete,
}: {
  task: Task;
  onStatusChange: () => void;
  onDelete: () => void;
}) {
  if (task.deleted) {
    return (
      <View style={[styles.taskRow, styles.taskDeleted]}>
        <Text style={styles.taskDeletedText}>⊘ {task.title} (deleted)</Text>
      </View>
    );
  }

  const statusIcon = task.status === 'done' ? '✓' : task.status === 'in_progress' ? '◑' : '○';

  return (
    <View style={styles.taskRow}>
      <TouchableOpacity
        style={styles.taskStatusButton}
        onPress={onStatusChange}
        activeOpacity={0.6}
      >
        <Text style={[
          styles.taskStatusIcon,
          task.status === 'done' && styles.taskStatusDone
        ]}>
          {statusIcon}
        </Text>
      </TouchableOpacity>

      <View style={styles.taskInfo}>
        <Text style={[
          styles.taskTitle,
          task.status === 'done' && styles.taskTitleDone
        ]}>
          {task.title}
        </Text>
        <Text style={styles.taskStatus}>
          {STATUS_LABELS[task.status]}
        </Text>
      </View>

      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ----------------------------------------------------------
// Styles
// ----------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  subjectSection: {
    marginBottom: 24,
  },
  subjectHeader: {
    marginBottom: 8,
  },
  subjectTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  subjectTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.3,
  },
  subjectProgress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  subjectProgressBar: {
    marginTop: 8,
  },
  chapterCard: {
    marginVertical: 4,
    padding: 0,
  },
  chapterHeader: {
    padding: 14,
  },
  chapterTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chapterArrow: {
    fontSize: 10,
    color: '#999999',
    width: 16,
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  chapterMeta: {
    fontSize: 12,
    color: '#999999',
    marginTop: 1,
  },
  chapterProgress: {
    marginTop: 10,
    marginLeft: 26,
  },
  taskList: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  taskDeleted: {
    opacity: 0.4,
  },
  taskDeletedText: {
    fontSize: 13,
    color: '#999999',
    fontStyle: 'italic',
    paddingLeft: 26,
  },
  taskStatusButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskStatusIcon: {
    fontSize: 18,
    color: '#CCCCCC',
  },
  taskStatusDone: {
    color: '#000000',
    fontWeight: '700',
  },
  taskInfo: {
    flex: 1,
    marginLeft: 8,
  },
  taskTitle: {
    fontSize: 14,
    color: '#000000',
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#999999',
  },
  taskStatus: {
    fontSize: 11,
    color: '#AAAAAA',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
});
