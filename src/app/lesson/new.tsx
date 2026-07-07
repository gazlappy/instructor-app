import { useLocalSearchParams } from 'expo-router';

import { LessonForm } from '@/components/lesson-form';

export default function NewLessonScreen() {
  const { date, studentId } = useLocalSearchParams<{ date?: string; studentId?: string }>();
  return <LessonForm initialDate={date} initialStudentId={studentId ? Number(studentId) : undefined} />;
}
