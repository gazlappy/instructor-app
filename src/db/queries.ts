import { type SQLiteDatabase } from 'expo-sqlite';

import type {
  Instructor,
  Lesson,
  LessonListItem,
  LessonRecap,
  LessonStatus,
  LessonType,
  MockFaultEntry,
  MockTestResult,
  MockTestResultVerdict,
  RecapListItem,
  Skill,
  SkillProgressRow,
  StudentListItem,
  StudentStats,
  StudentStatus,
  TheoryAttempt,
  TheoryMode,
  TheoryReviewItem,
  Transmission,
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
         s.phone, s.email, s.pickup_address AS pickupAddress,
         s.date_of_birth AS dateOfBirth, s.licence_number AS licenceNumber, s.transmission,
         s.theory_passed AS theoryPassed, s.theory_test_date AS theoryTestDate,
         s.test_date AS testDate, s.test_centre AS testCentre, s.emergency_contact AS emergencyContact,
         s.status, s.notes, i.name AS instructorName, i.color AS instructorColor
  FROM students s JOIN instructors i ON i.id = s.instructor_id`;

export function listStudents(
  db: SQLiteDatabase,
  opts: {
    instructorId?: number | null;
    search?: string;
    includePassed?: boolean;
    /** 'nextLesson' needs `today` (date key) to find each student's next scheduled lesson. */
    sort?: 'name' | 'nextLesson';
    today?: string;
  } = {}
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
  if (opts.includePassed === false) {
    where.push("s.status != 'passed'");
  }

  const byName = "s.first_name COLLATE NOCASE, s.last_name COLLATE NOCASE";
  const byStatus = "CASE s.status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 ELSE 2 END";

  if (opts.sort === 'nextLesson' && opts.today) {
    return db.getAllAsync<StudentListItem>(
      `${STUDENT_SELECT}
       LEFT JOIN (
         SELECT student_id, MIN(date) AS next_lesson FROM lessons
         WHERE status = 'scheduled' AND date >= ? GROUP BY student_id
       ) nl ON nl.student_id = s.id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY ${byStatus}, nl.next_lesson IS NULL, nl.next_lesson, ${byName}`,
      opts.today,
      ...params
    );
  }

  return db.getAllAsync<StudentListItem>(
    `${STUDENT_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY ${byStatus}, ${byName}`,
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
  dateOfBirth?: string | null;
  licenceNumber?: string | null;
  transmission: Transmission;
  theoryPassed: boolean;
  theoryTestDate?: string | null;
  testDate?: string | null;
  testCentre?: string | null;
  emergencyContact?: string | null;
  status: StudentStatus;
  notes?: string | null;
}

function studentParams(input: StudentInput): (string | number | null)[] {
  return [
    input.instructorId,
    input.firstName,
    input.lastName,
    input.phone ?? null,
    input.email ?? null,
    input.pickupAddress ?? null,
    input.dateOfBirth ?? null,
    input.licenceNumber ?? null,
    input.transmission,
    input.theoryPassed ? 1 : 0,
    input.theoryTestDate ?? null,
    input.testDate ?? null,
    input.testCentre ?? null,
    input.emergencyContact ?? null,
    input.status,
    input.notes ?? null,
  ];
}

export async function createStudent(db: SQLiteDatabase, input: StudentInput): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO students (instructor_id, first_name, last_name, phone, email, pickup_address,
       date_of_birth, licence_number, transmission, theory_passed, theory_test_date,
       test_date, test_centre, emergency_contact, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ...studentParams(input)
  );
  return result.lastInsertRowId;
}

export async function updateStudent(db: SQLiteDatabase, id: number, input: StudentInput): Promise<void> {
  await db.runAsync(
    `UPDATE students SET instructor_id = ?, first_name = ?, last_name = ?, phone = ?, email = ?,
       pickup_address = ?, date_of_birth = ?, licence_number = ?, transmission = ?,
       theory_passed = ?, theory_test_date = ?, test_date = ?, test_centre = ?,
       emergency_contact = ?, status = ?, notes = ? WHERE id = ?`,
    ...studentParams(input),
    id
  );
}

/** Lesson totals for a student's detail page. */
export function getStudentStats(db: SQLiteDatabase, studentId: number, today: string): Promise<StudentStats> {
  return db
    .getFirstAsync<StudentStats>(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS completedLessons,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN duration_minutes ELSE 0 END), 0) AS completedMinutes,
         COALESCE(SUM(CASE WHEN status = 'scheduled' AND date >= ? THEN 1 ELSE 0 END), 0) AS upcomingLessons,
         COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelledLessons,
         COALESCE(SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END), 0) AS noShowLessons
       FROM lessons WHERE student_id = ?`,
      today,
      studentId
    )
    .then(
      (row) =>
        row ?? {
          completedLessons: 0,
          completedMinutes: 0,
          upcomingLessons: 0,
          cancelledLessons: 0,
          noShowLessons: 0,
        }
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
         l.cancellation_reason AS cancellationReason,
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
            type, pickup_location AS pickupLocation, notes, status,
            cancellation_reason AS cancellationReason
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
  cancellationReason?: string | null;
}

export async function createLesson(db: SQLiteDatabase, input: LessonInput): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO lessons (student_id, instructor_id, date, start_minutes, duration_minutes, type, pickup_location, notes, status, cancellation_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.studentId,
    input.instructorId,
    input.date,
    input.startMinutes,
    input.durationMinutes,
    input.type,
    input.pickupLocation ?? null,
    input.notes ?? null,
    input.status,
    input.cancellationReason ?? null
  );
  return result.lastInsertRowId;
}

export async function updateLesson(db: SQLiteDatabase, id: number, input: LessonInput): Promise<void> {
  await db.runAsync(
    `UPDATE lessons SET student_id = ?, instructor_id = ?, date = ?, start_minutes = ?, duration_minutes = ?,
       type = ?, pickup_location = ?, notes = ?, status = ?, cancellation_reason = ? WHERE id = ?`,
    input.studentId,
    input.instructorId,
    input.date,
    input.startMinutes,
    input.durationMinutes,
    input.type,
    input.pickupLocation ?? null,
    input.notes ?? null,
    input.status,
    input.cancellationReason ?? null,
    id
  );
}

export async function setLessonStatus(
  db: SQLiteDatabase,
  id: number,
  status: LessonStatus,
  cancellationReason?: string | null
): Promise<void> {
  await db.runAsync(
    'UPDATE lessons SET status = ?, cancellation_reason = ? WHERE id = ?',
    status,
    cancellationReason ?? null,
    id
  );
}

/**
 * Scheduled lessons that overlap the proposed slot for the same instructor
 * or the same student. Used to warn when booking (and skip recurring copies).
 */
export function findLessonConflicts(
  db: SQLiteDatabase,
  input: {
    instructorId: number;
    studentId: number;
    date: string;
    startMinutes: number;
    durationMinutes: number;
    excludeLessonId?: number;
  }
): Promise<LessonListItem[]> {
  const params: (string | number)[] = [
    input.date,
    input.startMinutes + input.durationMinutes,
    input.startMinutes,
    input.instructorId,
    input.studentId,
  ];
  let where = `WHERE l.date = ? AND l.status = 'scheduled'
    AND l.start_minutes < ? AND l.start_minutes + l.duration_minutes > ?
    AND (l.instructor_id = ? OR l.student_id = ?)`;
  if (input.excludeLessonId) {
    where += ' AND l.id != ?';
    params.push(input.excludeLessonId);
  }
  return db.getAllAsync<LessonListItem>(`${LESSON_SELECT} ${where} ORDER BY l.start_minutes`, ...params);
}

export async function deleteLesson(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM lessons WHERE id = ?', id);
}

// --- theory practice attempts ---

export async function createTheoryAttempt(
  db: SQLiteDatabase,
  input: {
    studentId: number | null;
    score: number;
    total: number;
    mode: TheoryMode;
    topic: string | null;
    wrong?: TheoryReviewItem[];
  }
): Promise<void> {
  await db.runAsync(
    'INSERT INTO theory_attempts (student_id, score, total, mode, topic, wrong_json) VALUES (?, ?, ?, ?, ?, ?)',
    input.studentId,
    input.score,
    input.total,
    input.mode,
    input.topic,
    input.wrong && input.wrong.length ? JSON.stringify(input.wrong) : null
  );
}

export async function listTheoryAttempts(db: SQLiteDatabase, limit = 15): Promise<TheoryAttempt[]> {
  const rows = await db.getAllAsync<Omit<TheoryAttempt, 'wrong'> & { wrongJson: string | null }>(
    `SELECT t.id, t.student_id AS studentId, t.score, t.total, t.taken_at AS takenAt,
            t.mode, t.topic, t.wrong_json AS wrongJson,
            s.first_name AS studentFirstName, s.last_name AS studentLastName
     FROM theory_attempts t
     LEFT JOIN students s ON s.id = t.student_id
     ORDER BY t.id DESC LIMIT ?`,
    limit
  );
  return rows.map(({ wrongJson, ...row }) => ({
    ...row,
    wrong: wrongJson ? (JSON.parse(wrongJson) as TheoryReviewItem[]) : [],
  }));
}

// --- lesson recaps ---

export async function getLessonRecap(db: SQLiteDatabase, lessonId: number): Promise<LessonRecap | null> {
  const row = await db.getFirstAsync<{ lessonId: number; note: string | null; skillIds: string; createdAt: string }>(
    'SELECT lesson_id AS lessonId, note, skill_ids AS skillIds, created_at AS createdAt FROM lesson_recaps WHERE lesson_id = ?',
    lessonId
  );
  if (!row) return null;
  return { ...row, skillIds: JSON.parse(row.skillIds) as number[] };
}

export async function upsertLessonRecap(
  db: SQLiteDatabase,
  input: { lessonId: number; note: string | null; skillIds: number[] }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO lesson_recaps (lesson_id, note, skill_ids, created_at)
     VALUES (?, ?, ?, datetime('now', 'localtime'))
     ON CONFLICT (lesson_id) DO UPDATE SET note = excluded.note, skill_ids = excluded.skill_ids`,
    input.lessonId,
    input.note,
    JSON.stringify(input.skillIds)
  );
}

export async function listRecapsForStudent(
  db: SQLiteDatabase,
  studentId: number,
  limit = 20
): Promise<RecapListItem[]> {
  const rows = await db.getAllAsync<Omit<RecapListItem, 'skillIds'> & { skillIds: string }>(
    `SELECT r.lesson_id AS lessonId, r.note, r.skill_ids AS skillIds,
            l.date, l.start_minutes AS startMinutes, l.duration_minutes AS durationMinutes, l.type
     FROM lesson_recaps r
     JOIN lessons l ON l.id = r.lesson_id
     WHERE l.student_id = ?
     ORDER BY l.date DESC, l.start_minutes DESC LIMIT ?`,
    studentId,
    limit
  );
  return rows.map((row) => ({ ...row, skillIds: JSON.parse(row.skillIds) as number[] }));
}

// --- mock driving tests ---

export async function createMockTestResult(
  db: SQLiteDatabase,
  input: {
    studentId: number;
    result: MockTestResultVerdict;
    faults: MockFaultEntry[];
    notes: string | null;
  }
): Promise<number> {
  const drivingFaults = input.faults.reduce((sum, f) => sum + f.driving, 0);
  const seriousFaults = input.faults.filter((f) => f.serious).length;
  const dangerousFaults = input.faults.filter((f) => f.dangerous).length;
  const kept = input.faults.filter((f) => f.driving > 0 || f.serious || f.dangerous);
  const result = await db.runAsync(
    `INSERT INTO mock_test_results (student_id, result, driving_faults, serious_faults, dangerous_faults, faults_json, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.studentId,
    input.result,
    drivingFaults,
    seriousFaults,
    dangerousFaults,
    JSON.stringify(kept),
    input.notes
  );
  return result.lastInsertRowId;
}

export async function listMockTestsForStudent(
  db: SQLiteDatabase,
  studentId: number,
  limit = 10
): Promise<MockTestResult[]> {
  const rows = await db.getAllAsync<Omit<MockTestResult, 'faults'> & { faultsJson: string }>(
    `SELECT id, student_id AS studentId, taken_at AS takenAt, result,
            driving_faults AS drivingFaults, serious_faults AS seriousFaults,
            dangerous_faults AS dangerousFaults, faults_json AS faultsJson, notes
     FROM mock_test_results WHERE student_id = ? ORDER BY id DESC LIMIT ?`,
    studentId,
    limit
  );
  return rows.map(({ faultsJson, ...row }) => ({ ...row, faults: JSON.parse(faultsJson) as MockFaultEntry[] }));
}

export async function deleteMockTestResult(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM mock_test_results WHERE id = ?', id);
}

// --- syllabus (skills) management ---

export function listSkills(db: SQLiteDatabase): Promise<Skill[]> {
  return db.getAllAsync<Skill>('SELECT id, category, name, sort FROM skills ORDER BY sort');
}

export async function renameSkill(db: SQLiteDatabase, id: number, name: string): Promise<void> {
  await db.runAsync('UPDATE skills SET name = ? WHERE id = ?', name, id);
}

export async function renameSkillCategory(
  db: SQLiteDatabase,
  oldName: string,
  newName: string
): Promise<void> {
  await db.runAsync('UPDATE skills SET category = ? WHERE category = ?', newName, oldName);
}

/** Deleting a skill also removes any recorded progress for it (FK cascade). */
export async function deleteSkill(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM skills WHERE id = ?', id);
}

export async function deleteSkillCategory(db: SQLiteDatabase, category: string): Promise<void> {
  await db.runAsync('DELETE FROM skills WHERE category = ?', category);
}

/** Appends a skill at the end of its category block (or the very end for a new category). */
export async function addSkill(db: SQLiteDatabase, category: string, name: string): Promise<void> {
  const rows = await listSkills(db);
  const lastInCategory = [...rows].reverse().find((s) => s.category === category);
  const newSort = lastInCategory ? lastInCategory.sort + 1 : (rows[rows.length - 1]?.sort ?? -1) + 1;
  await db.runAsync('UPDATE skills SET sort = sort + 1 WHERE sort >= ?', newSort);
  await db.runAsync('INSERT INTO skills (category, name, sort) VALUES (?, ?, ?)', category, name, newSort);
}

/** Swaps a skill with its neighbour within the same category. */
export async function moveSkill(db: SQLiteDatabase, id: number, direction: -1 | 1): Promise<void> {
  const rows = await listSkills(db);
  const index = rows.findIndex((s) => s.id === id);
  if (index === -1) return;
  const skill = rows[index];
  for (let i = index + direction; i >= 0 && i < rows.length; i += direction) {
    if (rows[i].category === skill.category) {
      const neighbour = rows[i];
      await db.runAsync('UPDATE skills SET sort = ? WHERE id = ?', neighbour.sort, skill.id);
      await db.runAsync('UPDATE skills SET sort = ? WHERE id = ?', skill.sort, neighbour.id);
      return;
    }
    break; // hit another category — already at the edge
  }
}

/** Moves a whole category block up/down and resequences every sort value. */
export async function moveSkillCategory(
  db: SQLiteDatabase,
  category: string,
  direction: -1 | 1
): Promise<void> {
  const rows = await listSkills(db);
  const order: string[] = [];
  for (const row of rows) {
    if (!order.includes(row.category)) order.push(row.category);
  }
  const index = order.indexOf(category);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= order.length) return;
  [order[index], order[target]] = [order[target], order[index]];

  let sort = 0;
  for (const cat of order) {
    for (const row of rows.filter((r) => r.category === cat)) {
      await db.runAsync('UPDATE skills SET sort = ? WHERE id = ?', sort++, row.id);
    }
  }
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
