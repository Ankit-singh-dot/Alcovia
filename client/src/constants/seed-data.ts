

import { Subject, HLCTimestamp } from '../types';

function initialHLC(): HLCTimestamp {
  return { wallTime: 0, counter: 0, nodeId: 'seed' };
}

export const SEED_SUBJECTS: Subject[] = [
  {
    id: 'subject-math',
    title: 'Mathematics',
    chapters: [
      {
        id: 'ch-math-1',
        title: 'Algebra',
        tasks: [
          { id: 'task-math-1-1', title: 'Linear Equations', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
          { id: 'task-math-1-2', title: 'Quadratic Equations', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
          { id: 'task-math-1-3', title: 'Polynomials', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
        ],
      },
      {
        id: 'ch-math-2',
        title: 'Geometry',
        tasks: [
          { id: 'task-math-2-1', title: 'Triangles', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
          { id: 'task-math-2-2', title: 'Circles', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
          { id: 'task-math-2-3', title: 'Coordinate Geometry', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
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
          { id: 'task-sci-1-1', title: 'Laws of Motion', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
          { id: 'task-sci-1-2', title: 'Gravitation', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
          { id: 'task-sci-1-3', title: 'Light & Optics', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
        ],
      },
      {
        id: 'ch-sci-2',
        title: 'Chemistry',
        tasks: [
          { id: 'task-sci-2-1', title: 'Periodic Table', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
          { id: 'task-sci-2-2', title: 'Chemical Reactions', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
          { id: 'task-sci-2-3', title: 'Acids & Bases', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
          { id: 'task-sci-2-4', title: 'Carbon Compounds', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
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
          { id: 'task-eng-1-1', title: 'Tenses', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
          { id: 'task-eng-1-2', title: 'Active & Passive Voice', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
          { id: 'task-eng-1-3', title: 'Direct & Indirect Speech', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
        ],
      },
      {
        id: 'ch-eng-2',
        title: 'Literature',
        tasks: [
          { id: 'task-eng-2-1', title: 'Poetry Analysis', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
          { id: 'task-eng-2-2', title: 'Short Stories', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
          { id: 'task-eng-2-3', title: 'Essay Writing', status: 'not_started', deleted: false, lastModifiedHlc: initialHLC() },
        ],
      },
    ],
  },
];
