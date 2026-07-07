import { type SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'instructor-app.db';

/**
 * Skills syllabus seeded on first launch, loosely based on the DVSA
 * "learning to drive" syllabus. Grouped by category.
 */
const SKILL_SYLLABUS: [category: string, skills: string[]][] = [
  [
    'Basics',
    [
      'Cockpit checks & controls',
      'Moving away & stopping',
      'Safe road positioning',
      'Use of mirrors',
      'Signals',
      'Anticipation & planning',
    ],
  ],
  [
    'Junctions',
    [
      'Approaching junctions',
      'Emerging at junctions',
      'Crossroads',
      'Roundabouts',
      'Pedestrian crossings',
      'Dual carriageways',
    ],
  ],
  [
    'Manoeuvres',
    [
      'Parallel parking',
      'Bay parking',
      'Pull up on right & reverse',
      'Emergency stop',
      'Turn in the road',
    ],
  ],
  [
    'Independent driving',
    ['Following a sat nav', 'Following road signs'],
  ],
  [
    'Advanced',
    [
      'Rural roads',
      'Night driving',
      'Adverse weather',
      'Motorways',
      'Eco-safe driving',
    ],
  ],
];

export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version >= 1) {
    await db.execAsync('PRAGMA foreign_keys = ON;');
    return;
  }

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS instructors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      archived INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instructor_id INTEGER NOT NULL REFERENCES instructors(id),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      pickup_address TEXT,
      test_date TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      instructor_id INTEGER NOT NULL REFERENCES instructors(id),
      date TEXT NOT NULL,
      start_minutes INTEGER NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      type TEXT NOT NULL DEFAULT 'lesson',
      pickup_location TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_lessons_date ON lessons(date);
    CREATE INDEX IF NOT EXISTS idx_lessons_student ON lessons(student_id);

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      sort INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS skill_progress (
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      level INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (student_id, skill_id)
    );
  `);

  let sort = 0;
  for (const [category, skills] of SKILL_SYLLABUS) {
    for (const name of skills) {
      await db.runAsync('INSERT INTO skills (category, name, sort) VALUES (?, ?, ?)', category, name, sort++);
    }
  }

  // A starter instructor so the app is usable immediately; rename in Settings.
  await db.runAsync('INSERT INTO instructors (name, color) VALUES (?, ?)', 'Me', '#3c87f7');

  await db.execAsync('PRAGMA user_version = 1');
}
