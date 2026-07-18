export type StudentStatus = 'active' | 'passed' | 'paused';
export type Transmission = 'manual' | 'automatic';
export type LessonStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type LessonType = 'lesson' | 'mock_test' | 'driving_test';

export interface Instructor {
  id: number;
  name: string;
  color: string;
  phone: string | null;
  email: string | null;
  archived: number;
}

export interface Student {
  id: number;
  instructorId: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  pickupAddress: string | null;
  dateOfBirth: string | null;
  licenceNumber: string | null;
  transmission: Transmission;
  theoryPassed: number; // 0/1
  theoryTestDate: string | null;
  testDate: string | null;
  testCentre: string | null;
  emergencyContact: string | null;
  status: StudentStatus;
  notes: string | null;
}

export interface StudentStats {
  completedLessons: number;
  completedMinutes: number;
  upcomingLessons: number;
  cancelledLessons: number;
  noShowLessons: number;
}

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  manual: 'Manual',
  automatic: 'Automatic',
};

export type TheoryMode = 'practice' | 'topic' | 'mock' | 'signs' | 'safety';

/**
 * A self-contained snapshot of one question the pupil got wrong, stored on
 * the attempt so it can be reviewed any time — no dependency on the live
 * question bank, which may change.
 */
export interface TheoryReviewItem {
  category: string;
  question: string;
  /** Options exactly as shown (already shuffled). */
  options: string[];
  /** Index into `options` the pupil chose, or null if they ran out of time. */
  given: number | null;
  /** Index into `options` of the correct answer. */
  correct: number;
  explanation: string;
  /** Set for sign-recognition questions: renders the sign graphic. */
  signId?: string;
}

export interface TheoryAttempt {
  id: number;
  studentId: number | null;
  score: number;
  total: number;
  takenAt: string;
  mode: TheoryMode;
  topic: string | null;
  /** Questions answered wrong, for later review. Empty for older attempts. */
  wrong: TheoryReviewItem[];
  studentFirstName: string | null;
  studentLastName: string | null;
}

export interface StudentListItem extends Student {
  instructorName: string;
  instructorColor: string;
}

export interface Lesson {
  id: number;
  studentId: number;
  instructorId: number;
  date: string; // YYYY-MM-DD (local)
  startMinutes: number; // minutes past midnight
  durationMinutes: number;
  type: LessonType;
  pickupLocation: string | null;
  notes: string | null;
  status: LessonStatus;
  cancellationReason: string | null;
}

export interface LessonListItem extends Lesson {
  studentFirstName: string;
  studentLastName: string;
  instructorName: string;
  instructorColor: string;
}

export interface Skill {
  id: number;
  category: string;
  name: string;
  sort: number;
}

export interface SkillProgressRow {
  skillId: number;
  category: string;
  name: string;
  level: number; // 0–5
}

export const SKILL_LEVELS = [
  'Not covered',
  'Introduced',
  'Full guidance',
  'Prompted',
  'Seldom prompted',
  'Independent',
] as const;

export const MAX_SKILL_LEVEL = SKILL_LEVELS.length - 1;

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  lesson: 'Lesson',
  mock_test: 'Mock test',
  driving_test: 'Driving test',
};

export const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
};

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  active: 'Active',
  passed: 'Passed',
  paused: 'Paused',
};

// --- lesson recaps ---

export interface LessonRecap {
  lessonId: number;
  note: string | null;
  skillIds: number[];
  createdAt: string;
}

/** A recap joined with its lesson, for the student-page timeline. */
export interface RecapListItem {
  lessonId: number;
  note: string | null;
  skillIds: number[];
  date: string;
  startMinutes: number;
  durationMinutes: number;
  type: LessonType;
}

// --- mock driving tests ---

export type MockTestResultVerdict = 'pass' | 'fail';

/** One assessment row on the mock test marking sheet (our own wording). */
export interface MockFaultEntry {
  item: string;
  driving: number;
  serious: boolean;
  dangerous: boolean;
}

export interface MockTestResult {
  id: number;
  studentId: number;
  takenAt: string;
  result: MockTestResultVerdict;
  drivingFaults: number;
  seriousFaults: number;
  dangerousFaults: number;
  faults: MockFaultEntry[];
  notes: string | null;
}

/**
 * Assessment items marked during a mock driving test. Our own labels,
 * covering the same ground an examiner watches on the practical test.
 */
export const MOCK_TEST_ITEMS = [
  'Safety checks & precautions',
  'Vehicle control',
  'Moving away safely',
  'Use of mirrors',
  'Signals',
  'Junction approach & turns',
  'Judgement when meeting traffic',
  'Road positioning',
  'Pedestrian crossings',
  'Following distance',
  'Making progress',
  'Responding to signs & signals',
  'Awareness & planning',
  'Reversing manoeuvre',
  'Emergency stop',
  'Independent driving',
] as const;

/** A mock fails on any serious/dangerous fault, or 16+ driving faults. */
export const MOCK_TEST_DRIVING_FAULT_LIMIT = 15;

export const INSTRUCTOR_COLORS = [
  '#3c87f7',
  '#e5484d',
  '#30a46c',
  '#f76b15',
  '#8e4ec6',
  '#00a2c7',
  '#ad7f58',
  '#e93d82',
] as const;
