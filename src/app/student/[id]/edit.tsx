import { useLocalSearchParams } from 'expo-router';

import { StudentForm } from '@/components/student-form';
import { getStudent } from '@/db/queries';
import { useQuery } from '@/db/use-query';

export default function EditStudentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: student } = useQuery((db) => getStudent(db, Number(id)), [id]);

  if (!student) return null;
  return <StudentForm existing={student} />;
}
