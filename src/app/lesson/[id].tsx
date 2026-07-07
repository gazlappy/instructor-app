import { useLocalSearchParams } from 'expo-router';

import { LessonForm } from '@/components/lesson-form';
import { getLesson } from '@/db/queries';
import { useQuery } from '@/db/use-query';

export default function EditLessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lesson } = useQuery((db) => getLesson(db, Number(id)), [id]);

  if (!lesson) return null;
  return <LessonForm existing={lesson} />;
}
