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
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Stamp the version after each step so an interrupted run resumes cleanly.
  const migrations = [migrateToV1, migrateToV2, migrateToV3, migrateToV4, migrateToV5];
  for (let v = version; v < migrations.length; v++) {
    await migrations[v](db);
    await db.execAsync(`PRAGMA user_version = ${v + 1}`);
  }

  // Safety net: these steps are pure CREATE TABLE IF NOT EXISTS, so re-running
  // them heals a database whose version was stamped ahead of its actual schema
  // (e.g. by an interrupted update).
  await migrateToV2(db);
  await migrateToV4(db);
}

async function migrateToV1(db: SQLiteDatabase): Promise<void> {
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
}

async function migrateToV2(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

async function migrateToV3(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE students ADD COLUMN date_of_birth TEXT;
    ALTER TABLE students ADD COLUMN licence_number TEXT;
    ALTER TABLE students ADD COLUMN transmission TEXT NOT NULL DEFAULT 'manual';
    ALTER TABLE students ADD COLUMN theory_passed INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE students ADD COLUMN theory_test_date TEXT;
    ALTER TABLE students ADD COLUMN test_centre TEXT;
    ALTER TABLE students ADD COLUMN emergency_contact TEXT;
  `);
}

async function migrateToV4(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS theory_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      taken_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);
}

async function migrateToV5(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE theory_attempts ADD COLUMN mode TEXT NOT NULL DEFAULT 'practice';
    ALTER TABLE theory_attempts ADD COLUMN topic TEXT;
  `);
}

/** Wipes every user record (keeps the skills syllabus) and reseeds the starter instructor. */
export async function eraseAllData(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM lessons;
    DELETE FROM skill_progress;
    DELETE FROM theory_attempts;
    DELETE FROM students;
    DELETE FROM instructors;
    DELETE FROM settings;
  `);
  await db.runAsync('INSERT INTO instructors (name, color) VALUES (?, ?)', 'Me', '#3c87f7');
}
