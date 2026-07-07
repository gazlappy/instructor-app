export type StudentStatus = 'active' | 'passed' | 'paused';
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
  testDate: string | null;
  status: StudentStatus;
  notes: string | null;
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
}

export interface LessonListItem extends Lesson {
  studentFirstName: string;
  studentLastName: string;
  instructorName: string;
  instructorColor: string;
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
