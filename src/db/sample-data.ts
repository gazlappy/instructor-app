import { type SQLiteDatabase } from 'expo-sqlite';

import { createStudent, listInstructors, setSkillLevel, type StudentInput } from './queries';
import { addDays, todayKey } from '@/lib/dates';

/** Fictional students (07700 900xxx is the Ofcom-reserved fictional phone range). */
const SAMPLE_STUDENTS: Omit<StudentInput, 'instructorId'>[] = [
  {
    firstName: 'Alice', lastName: 'Johnson', phone: '07700 900101', email: 'alice.j@example.com',
    pickupAddress: '12 High Street, Wigan, WN1 1AA', dateOfBirth: '2009-03-14', licenceNumber: 'JOHNS903149AB2CD',
    transmission: 'manual', theoryPassed: true, theoryTestDate: addDays(todayKey(), -60),
    testDate: addDays(todayKey(), 45), testCentre: 'Wigan', emergencyContact: 'Mum — 07700 900201',
    status: 'active', notes: 'Confident driver, needs work on roundabouts.',
  },
  {
    firstName: 'Ben', lastName: 'Carter', phone: '07700 900102', email: 'ben.c@example.com',
    pickupAddress: '4 Mesnes Road, Wigan, WN1 2DD', dateOfBirth: '2008-07-22', licenceNumber: 'CARTE807229BC3DE',
    transmission: 'manual', theoryPassed: true, theoryTestDate: addDays(todayKey(), -30),
    testDate: null, testCentre: null, emergencyContact: 'Dad — 07700 900202',
    status: 'active', notes: null,
  },
  {
    firstName: 'Chloe', lastName: 'Davies', phone: '07700 900103', email: null,
    pickupAddress: '89 Ormskirk Road, Wigan, WN5 8AT', dateOfBirth: '2009-11-02', licenceNumber: null,
    transmission: 'automatic', theoryPassed: false, theoryTestDate: null,
    testDate: null, testCentre: null, emergencyContact: null,
    status: 'active', notes: 'Nervous at junctions — keep sessions calm.',
  },
  {
    firstName: 'Daniel', lastName: 'Evans', phone: '07700 900104', email: 'dan.evans@example.com',
    pickupAddress: '23 Wallgate, Wigan, WN3 4AB', dateOfBirth: '2007-01-30', licenceNumber: 'EVANS701309DE4FG',
    transmission: 'manual', theoryPassed: true, theoryTestDate: addDays(todayKey(), -120),
    testDate: addDays(todayKey(), 14), testCentre: 'St Helens', emergencyContact: null,
    status: 'active', notes: 'Test in two weeks — mock tests every lesson.',
  },
  {
    firstName: 'Ella', lastName: 'Foster', phone: '07700 900105', email: 'ella.f@example.com',
    pickupAddress: '7 Poolstock Lane, Wigan, WN3 5HL', dateOfBirth: '2004-05-18', licenceNumber: 'FOSTE405189EF5GH',
    transmission: 'automatic', theoryPassed: true, theoryTestDate: addDays(todayKey(), -300),
    testDate: addDays(todayKey(), -21), testCentre: 'Wigan', emergencyContact: null,
    status: 'passed', notes: 'Passed first time!',
  },
  {
    firstName: 'Freddie', lastName: 'Green', phone: '07700 900106', email: null,
    pickupAddress: '150 Gidlow Lane, Wigan, WN6 7EA', dateOfBirth: '2009-09-09', licenceNumber: null,
    transmission: 'manual', theoryPassed: false, theoryTestDate: null,
    testDate: null, testCentre: null, emergencyContact: 'Gran — 07700 900206',
    status: 'active', notes: 'Just started — first few lessons on the basics.',
  },
  {
    firstName: 'Grace', lastName: 'Hughes', phone: '07700 900107', email: 'grace.h@example.com',
    pickupAddress: '31 School Lane, Standish, WN6 0TG', dateOfBirth: '2006-12-01', licenceNumber: 'HUGHE612019GH6IJ',
    transmission: 'manual', theoryPassed: true, theoryTestDate: addDays(todayKey(), -90),
    testDate: null, testCentre: 'Wigan', emergencyContact: null,
    status: 'active', notes: null,
  },
  {
    firstName: 'Harry', lastName: 'Iqbal', phone: '07700 900108', email: 'harry.i@example.com',
    pickupAddress: '66 Warrington Road, Ince, WN3 4TQ', dateOfBirth: '2008-02-11', licenceNumber: 'IQBAL802119HI7JK',
    transmission: 'automatic', theoryPassed: false, theoryTestDate: null,
    testDate: null, testCentre: null, emergencyContact: null,
    status: 'paused', notes: 'Away at university until summer.',
  },
  {
    firstName: 'Isla', lastName: 'Kennedy', phone: '07700 900109', email: 'isla.k@example.com',
    pickupAddress: '2 Beech Hill Avenue, Wigan, WN6 7TA', dateOfBirth: '2009-06-25', licenceNumber: 'KENNE906259IJ8KL',
    transmission: 'manual', theoryPassed: true, theoryTestDate: addDays(todayKey(), -45),
    testDate: addDays(todayKey(), 90), testCentre: 'Atherton', emergencyContact: 'Mum — 07700 900209',
    status: 'active', notes: null,
  },
  {
    firstName: 'Jack', lastName: 'Lewis', phone: '07700 900110', email: null,
    pickupAddress: '18 Scholes, Wigan, WN1 3NY', dateOfBirth: '2001-08-08', licenceNumber: 'LEWIS108089JK9LM',
    transmission: 'manual', theoryPassed: false, theoryTestDate: null,
    testDate: null, testCentre: null, emergencyContact: null,
    status: 'active', notes: 'Returning learner — drove a bit years ago.',
  },
];

/**
 * Inserts the fictional students (spread across instructors, with varied
 * syllabus progress). Safe to call repeatedly — it skips students whose
 * name already exists.
 */
export async function seedSampleStudents(db: SQLiteDatabase): Promise<number> {
  const instructors = await listInstructors(db);
  if (instructors.length === 0) return 0;
  const skills = await db.getAllAsync<{ id: number }>('SELECT id FROM skills ORDER BY sort');

  let added = 0;
  for (let i = 0; i < SAMPLE_STUDENTS.length; i++) {
    const sample = SAMPLE_STUDENTS[i];
    const exists = await db.getFirstAsync(
      'SELECT id FROM students WHERE first_name = ? AND last_name = ?',
      sample.firstName,
      sample.lastName
    );
    if (exists) continue;

    const instructorId = instructors[i % instructors.length].id;
    const studentId = await createStudent(db, { ...sample, instructorId });

    // Vary progress: further along the list of samples ≈ further along the syllabus.
    const coveredSkills = Math.min(skills.length, i * 3);
    for (let s = 0; s < coveredSkills; s++) {
      const level = Math.max(1, Math.min(5, Math.ceil((coveredSkills - s) / 4)));
      await setSkillLevel(db, studentId, skills[s].id, level);
    }
    added++;
  }
  return added;
}
