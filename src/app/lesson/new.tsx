import { useLocalSearchParams } from 'expo-router';

import { LessonForm } from '@/components/lesson-form';

export default function NewLessonScreen() {
  const { date, studentId, startMinutes } = useLocalSearchParams<{
    date?: string;
    studentId?: string;
    startMinutes?: string;
  }>();
  return (
    <LessonForm
      initialDate={date}
      initialStudentId={studentId ? Number(studentId) : undefined}
      initialStartMinutes={startMinutes ? Number(startMinutes) : undefined}
    />
  );
}
