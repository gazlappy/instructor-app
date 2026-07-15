import { type SQLiteDatabase } from 'expo-sqlite';

/**
 * Full-database backup as portable JSON. Tables are listed in FK-safe
 * insert order (parents before children); restore wipes in reverse.
 */
const BACKUP_TABLES = [
  'instructors',
  'skills',
  'students',
  'lessons',
  'lesson_recaps',
  'skill_progress',
  'theory_attempts',
  'mock_test_results',
  'settings',
] as const;

type BackupTable = (typeof BACKUP_TABLES)[number];
type Row = Record<string, string | number | null>;

export interface Backup {
  app: 'instructor-app';
  schemaVersion: number;
  exportedAt: string;
  tables: Record<BackupTable, Row[]>;
}

export async function createBackup(db: SQLiteDatabase): Promise<Backup> {
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const tables = {} as Record<BackupTable, Row[]>;
  for (const table of BACKUP_TABLES) {
    tables[table] = await db.getAllAsync<Row>(`SELECT * FROM ${table}`);
  }
  return {
    app: 'instructor-app',
    schemaVersion: version?.user_version ?? 0,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

/** Throws with a human-readable message if `parsed` isn't one of our backups. */
export function validateBackup(parsed: unknown, currentSchemaVersion: number): Backup {
  const backup = parsed as Backup;
  if (!backup || typeof backup !== 'object' || backup.app !== 'instructor-app' || !backup.tables) {
    throw new Error('This file is not an Instructor App backup.');
  }
  if (backup.schemaVersion > currentSchemaVersion) {
    throw new Error('This backup was made by a newer version of the app. Update the app first.');
  }
  for (const table of BACKUP_TABLES) {
    if (backup.tables[table] !== undefined && !Array.isArray(backup.tables[table])) {
      throw new Error('This backup file looks damaged.');
    }
  }
  return backup;
}

/**
 * Replaces everything in the database with the backup's contents.
 * Row objects may omit columns added since the backup was made —
 * those fall back to the schema defaults.
 */
export async function restoreBackup(db: SQLiteDatabase, backup: Backup): Promise<void> {
  // withTransactionAsync (not the exclusive variant) — the exclusive one
  // isn't supported by the web driver.
  await db.withTransactionAsync(async () => {
    for (const table of [...BACKUP_TABLES].reverse()) {
      await db.runAsync(`DELETE FROM ${table}`);
    }
    for (const table of BACKUP_TABLES) {
      for (const row of backup.tables[table] ?? []) {
        // Column names come from the file, so only accept plain identifiers.
        const columns = Object.keys(row).filter((name) => /^[a-z_][a-z0-9_]*$/i.test(name));
        if (columns.length === 0) continue;
        await db.runAsync(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
          ...columns.map((column) => row[column])
        );
      }
    }
    // The app assumes at least one instructor exists (old backups might lack one).
    const instructor = await db.getFirstAsync('SELECT id FROM instructors LIMIT 1');
    if (!instructor) {
      await db.runAsync('INSERT INTO instructors (name, color) VALUES (?, ?)', 'Me', '#3c87f7');
    }
  });
}

export async function getSchemaVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}
