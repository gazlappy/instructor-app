import { type SQLiteDatabase } from 'expo-sqlite';

import type {
  Instructor,
  Lesson,
  LessonListItem,
  LessonStatus,
  LessonType,
  SkillProgressRow,
  StudentListItem,
  StudentStatus,
} from './types';

// --- instructors ---

export function listInstructors(db: SQLiteDatabase, includeArchived = false): Promise<Instructor[]> {
  return db.getAllAsync<Instructor>(
    `SELECT id, name, color, phone, email, archived FROM instructors
     ${includeArchived ? '' : 'WHERE archived = 0'} ORDER BY name COLLATE NOCASE`
  );
}

export async function createInstructor(
  db: SQLiteDatabase,
  input: { name: string; color: string; phone?: string | null; email?: string | null }
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO instructors (name, color, phone, email) VALUES (?, ?, ?, ?)',
    input.name,
    input.color,
    input.phone ?? null,
    input.email ?? null
  );
  return result.lastInsertRowId;
}

export async function updateInstructor(
  db: SQLiteDatabase,
  id: number,
  input: { name: string; color: string; phone?: string | null; email?: string | null }
): Promise<void> {
  await db.runAsync(
    'UPDATE instructors SET name = ?, color = ?, phone = ?, email = ? WHERE id = ?',
    input.name,
    input.color,
    input.phone ?? null,
    input.email ?? null,
    id
  );
}

export async function setInstructorArchived(db: SQLiteDatabase, id: number, archived: boolean): Promise<void> {
  await db.runAsync('UPDATE instructors SET archived = ? WHERE id = ?', archived ? 1 : 0, id);
}

// --- students ---

const STUDENT_SELECT = `
  SELECT s.id, s.instructor_id AS instructorId, s.first_name AS firstName, s.last_name AS lastName,
         s.phone, s.email, s.pickup_address AS pickupAddress, s.test_date AS testDate,
         s.status, s.notes, i.name AS instructorName, i.color AS instructorColor
  FROM students s JOIN instructors i ON i.id = s.instructor_id`;

export function listStudents(
  db: SQLiteDatabase,
  opts: { instructorId?: number | null; search?: string } = {}
): Promise<StudentListItem[]> {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts.instructorId) {
    where.push('s.instructor_id = ?');
    params.push(opts.instructorId);
  }
  if (opts.search?.trim()) {
    where.push("(s.first_name || ' ' || s.last_name) LIKE ?");
    params.push(`%${opts.search.trim()}%`);
  }
  return db.getAllAsync<StudentListItem>(
    `${STUDENT_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY CASE s.status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 ELSE 2 END,
              s.first_name COLLATE NOCASE, s.last_name COLLATE NOCASE`,
    ...params
  );
}

export function getStudent(db: SQLiteDatabase, id: number): Promise<StudentListItem | null> {
  return db.getFirstAsync<StudentListItem>(`${STUDENT_SELECT} WHERE s.id = ?`, id);
}

export interface StudentInput {
  instructorId: number;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  pickupAddress?: string | null;
  testDate?: string | null;
  status: StudentStatus;
  notes?: string | null;
}

export async function createStudent(db: SQLiteDatabase, input: StudentInput): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO students (instructor_id, first_name, last_name, phone, email, pickup_address, test_date, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.instructorId,
    input.firstName,
    input.lastName,
    input.phone ?? null,
    input.email ?? null,
    input.pickupAddress ?? null,
    input.testDate ?? null,
    input.status,
    input.notes ?? null
  );
  return result.lastInsertRowId;
}

export async function updateStudent(db: SQLiteDatabase, id: number, input: StudentInput): Promise<void> {
  await db.runAsync(
    `UPDATE students SET instructor_id = ?, first_name = ?, last_name = ?, phone = ?, email = ?,
       pickup_address = ?, test_date = ?, status = ?, notes = ? WHERE id = ?`,
    input.instructorId,
    input.firstName,
    input.lastName,
    input.phone ?? null,
    input.email ?? null,
    input.pickupAddress ?? null,
    input.testDate ?? null,
    input.status,
    input.notes ?? null,
    id
  );
}

export async function deleteStudent(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM students WHERE id = ?', id);
}

// --- lessons ---

const LESSON_SELECT = `
  SELECT l.id, l.student_id AS studentId, l.instructor_id AS instructorId, l.date,
         l.start_minutes AS startMinutes, l.duration_minutes AS durationMinutes,
         l.type, l.pickup_location AS pickupLocation, l.notes, l.status,
         s.first_name AS studentFirstName, s.last_name AS studentLastName,
         i.name AS instructorName, i.color AS instructorColor
  FROM lessons l
  JOIN students s ON s.id = l.student_id
  JOIN instructors i ON i.id = l.instructor_id`;

export function listLessonsForDay(
  db: SQLiteDatabase,
  date: string,
  instructorId?: number | null
): Promise<LessonListItem[]> {
  const params: (string | number)[] = [date];
  let where = 'WHERE l.date = ?';
  if (instructorId) {
    where += ' AND l.instructor_id = ?';
    params.push(instructorId);
  }
  return db.getAllAsync<LessonListItem>(`${LESSON_SELECT} ${where} ORDER BY l.start_minutes`, ...params);
}

/** Date keys within [from, to] that have at least one non-cancelled lesson. */
export async function listLessonDays(
  db: SQLiteDatabase,
  from: string,
  to: string,
  instructorId?: number | null
): Promise<string[]> {
  const params: (string | number)[] = [from, to];
  let where = "WHERE date BETWEEN ? AND ? AND status != 'cancelled'";
  if (instructorId) {
    where += ' AND instructor_id = ?';
    params.push(instructorId);
  }
  const rows = await db.getAllAsync<{ date: string }>(`SELECT DISTINCT date FROM lessons ${where}`, ...params);
  return rows.map((r) => r.date);
}

export function listUpcomingLessonsForStudent(
  db: SQLiteDatabase,
  studentId: number,
  fromDate: string,
  limit = 10
): Promise<LessonListItem[]> {
  return db.getAllAsync<LessonListItem>(
    `${LESSON_SELECT} WHERE l.student_id = ? AND l.date >= ? AND l.status = 'scheduled'
     ORDER BY l.date, l.start_minutes LIMIT ?`,
    studentId,
    fromDate,
    limit
  );
}

export function getLesson(db: SQLiteDatabase, id: number): Promise<Lesson | null> {
  return db.getFirstAsync<Lesson>(
    `SELECT id, student_id AS studentId, instructor_id AS instructorId, date,
            start_minutes AS startMinutes, duration_minutes AS durationMinutes,
            type, pickup_location AS pickupLocation, notes, status
     FROM lessons WHERE id = ?`,
    id
  );
}

export interface LessonInput {
  studentId: number;
  instructorId: number;
  date: string;
  startMinutes: number;
  durationMinutes: number;
  type: LessonType;
  pickupLocation?: string | null;
  notes?: string | null;
  status: LessonStatus;
}

export async function createLesson(db: SQLiteDatabase, input: LessonInput): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO lessons (student_id, instructor_id, date, start_minutes, duration_minutes, type, pickup_location, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.studentId,
    input.instructorId,
    input.date,
    input.startMinutes,
    input.durationMinutes,
    input.type,
    input.pickupLocation ?? null,
    input.notes ?? null,
    input.status
  );
  return result.lastInsertRowId;
}

export async function updateLesson(db: SQLiteDatabase, id: number, input: LessonInput): Promise<void> {
  await db.runAsync(
    `UPDATE lessons SET student_id = ?, instructor_id = ?, date = ?, start_minutes = ?, duration_minutes = ?,
       type = ?, pickup_location = ?, notes = ?, status = ? WHERE id = ?`,
    input.studentId,
    input.instructorId,
    input.date,
    input.startMinutes,
    input.durationMinutes,
    input.type,
    input.pickupLocation ?? null,
    input.notes ?? null,
    input.status,
    id
  );
}

export async function deleteLesson(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM lessons WHERE id = ?', id);
}

// --- skill progress ---

export function getProgressForStudent(db: SQLiteDatabase, studentId: number): Promise<SkillProgressRow[]> {
  return db.getAllAsync<SkillProgressRow>(
    `SELECT sk.id AS skillId, sk.category, sk.name, COALESCE(sp.level, 0) AS level
     FROM skills sk
     LEFT JOIN skill_progress sp ON sp.skill_id = sk.id AND sp.student_id = ?
     ORDER BY sk.sort`,
    studentId
  );
}

export async function setSkillLevel(
  db: SQLiteDatabase,
  studentId: number,
  skillId: number,
  level: number
): Promise<void> {
  await db.runAsync(
    `INSERT INTO skill_progress (student_id, skill_id, level, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT (student_id, skill_id) DO UPDATE SET level = excluded.level, updated_at = excluded.updated_at`,
    studentId,
    skillId,
    level
  );
}
