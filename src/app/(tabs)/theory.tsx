import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { Field } from '@/components/ui/form';
import { Select } from '@/components/ui/select';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { THEORY_QUESTIONS, type TheoryQuestion } from '@/data/theory-questions';
import { createTheoryAttempt, listStudents, listTheoryAttempts } from '@/db/queries';
import { useQuery } from '@/db/use-query';
import { useTheme } from '@/hooks/use-theme';
import { formatDateUK } from '@/lib/dates';

const PASS_MARK = 0.86; // the real test needs 43/50
const CORRECT_COLOR = '#30a46c';

interface QuizQuestion extends TheoryQuestion {
  shuffledOptions: string[];
  correctIndex: number;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildQuiz(length: number): QuizQuestion[] {
  return shuffle(THEORY_QUESTIONS)
    .slice(0, length)
    .map((question) => {
      const order = shuffle([0, 1, 2, 3]);
      return {
        ...question,
        shuffledOptions: order.map((i) => question.options[i]),
        correctIndex: order.indexOf(question.answer),
      };
    });
}

const LENGTH_OPTIONS = [
  { value: 10, label: 'Quick — 10 questions' },
  { value: 20, label: 'Standard — 20 questions' },
  { value: THEORY_QUESTIONS.length, label: `Full bank — ${THEORY_QUESTIONS.length} questions` },
];

export default function TheoryScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();

  const [phase, setPhase] = useState<'start' | 'quiz' | 'results'>('start');
  const [length, setLength] = useState(10);
  const [studentId, setStudentId] = useState<number>(0); // 0 = nobody
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const { data: students } = useQuery((db) => listStudents(db, { includePassed: false }));
  const { data: attempts, refresh: refreshAttempts } = useQuery((db) => listTheoryAttempts(db));

  const start = () => {
    setQuiz(buildQuiz(length));
    setIndex(0);
    setPicked(null);
    setScore(0);
    setPhase('quiz');
  };

  const finish = async (finalScore: number) => {
    await createTheoryAttempt(db, {
      studentId: studentId || null,
      score: finalScore,
      total: quiz.length,
    });
    refreshAttempts();
    setPhase('results');
  };

  const pick = (optionIndex: number) => {
    if (picked !== null) return;
    setPicked(optionIndex);
    if (optionIndex === quiz[index].correctIndex) setScore((s) => s + 1);
  };

  const next = () => {
    const finalScore = score;
    if (index + 1 >= quiz.length) {
      finish(finalScore);
    } else {
      setIndex((i) => i + 1);
      setPicked(null);
    }
  };

  const question = quiz[index];
  const percent = quiz.length ? Math.round((score / quiz.length) * 100) : 0;
  const passed = quiz.length > 0 && score / quiz.length >= PASS_MARK;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle" style={styles.title}>
            Theory practice
          </ThemedText>

          {phase === 'start' && (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                Practice questions in the style of the theory test. The real test needs 86% to
                pass (43 out of 50).
              </ThemedText>

              <Field label="Quiz length">
                <Select options={LENGTH_OPTIONS} value={length} onChange={setLength} />
              </Field>

              <Field label="Practising student (optional)">
                <Select
                  options={[
                    { value: 0, label: 'Nobody — just practising' },
                    ...(students ?? []).map((s) => ({
                      value: s.id,
                      label: `${s.firstName} ${s.lastName}`.trim(),
                      dotColor: s.instructorColor,
                    })),
                  ]}
                  value={studentId}
                  onChange={setStudentId}
                />
              </Field>

              <View style={styles.startRow}>
                <Chip label="Start quiz" selected onPress={start} />
              </View>

              {(attempts ?? []).length > 0 && (
                <>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.historyHeader}>
                    RECENT ATTEMPTS
                  </ThemedText>
                  {(attempts ?? []).map((attempt) => {
                    const pct = Math.round((attempt.score / attempt.total) * 100);
                    const ok = attempt.score / attempt.total >= PASS_MARK;
                    return (
                      <ThemedView key={attempt.id} type="backgroundElement" style={styles.attemptRow}>
                        <View style={styles.flex}>
                          <ThemedText type="small">
                            {attempt.studentFirstName
                              ? `${attempt.studentFirstName} ${attempt.studentLastName ?? ''}`.trim()
                              : 'Practice'}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {formatDateUK(attempt.takenAt.slice(0, 10))}
                          </ThemedText>
                        </View>
                        <ThemedText type="smallBold" style={{ color: ok ? CORRECT_COLOR : theme.danger }}>
                          {attempt.score}/{attempt.total} · {pct}%
                        </ThemedText>
                      </ThemedView>
                    );
                  })}
                </>
              )}
            </>
          )}

          {phase === 'quiz' && question && (
            <>
              <View style={styles.progressRow}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Question {index + 1} of {quiz.length}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {question.category}
                </ThemedText>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: theme.tint, width: `${((index + (picked !== null ? 1 : 0)) / quiz.length) * 100}%` },
                  ]}
                />
              </View>

              <ThemedText style={styles.questionText}>{question.question}</ThemedText>

              {question.shuffledOptions.map((option, optionIndex) => {
                const isCorrect = optionIndex === question.correctIndex;
                const isPicked = optionIndex === picked;
                let background: string = theme.backgroundElement;
                if (picked !== null && isCorrect) background = CORRECT_COLOR;
                else if (picked !== null && isPicked && !isCorrect) background = theme.danger;
                const answered = picked !== null && (isCorrect || isPicked);
                return (
                  <Pressable
                    key={optionIndex}
                    onPress={() => pick(optionIndex)}
                    disabled={picked !== null}
                    style={({ pressed }) => [
                      styles.option,
                      { backgroundColor: background },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="small" style={answered ? { color: '#fff' } : undefined}>
                      {option}
                    </ThemedText>
                  </Pressable>
                );
              })}

              {picked !== null && (
                <>
                  <ThemedView type="backgroundElement" style={styles.explanation}>
                    <ThemedText type="smallBold" style={{ color: picked === question.correctIndex ? CORRECT_COLOR : theme.danger }}>
                      {picked === question.correctIndex ? 'Correct!' : 'Not quite.'}
                    </ThemedText>
                    <ThemedText type="small">{question.explanation}</ThemedText>
                  </ThemedView>
                  <View style={styles.startRow}>
                    <Chip label={index + 1 >= quiz.length ? 'See results' : 'Next question'} selected onPress={next} />
                  </View>
                </>
              )}
            </>
          )}

          {phase === 'results' && (
            <>
              <ThemedView type="backgroundElement" style={styles.resultCard}>
                <ThemedText type="title" style={{ color: passed ? CORRECT_COLOR : theme.danger }}>
                  {percent}%
                </ThemedText>
                <ThemedText>
                  {score} out of {quiz.length} correct
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {passed
                    ? 'That would be a pass — the real test needs 86%.'
                    : 'The real test needs 86% — keep practising!'}
                </ThemedText>
              </ThemedView>
              <View style={styles.resultButtons}>
                <Chip label="Back to start" onPress={() => setPhase('start')} />
                <Chip label="Try again" selected onPress={start} />
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  scroll: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six,
  },
  title: {
    paddingTop: Spacing.three + TopTabInset,
  },
  flex: {
    flex: 1,
  },
  startRow: {
    flexDirection: 'row',
  },
  historyHeader: {
    paddingTop: Spacing.two,
  },
  attemptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  questionText: {
    paddingVertical: Spacing.two,
  },
  option: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  explanation: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  resultCard: {
    alignItems: 'center',
    borderRadius: Spacing.four,
    padding: Spacing.five,
    gap: Spacing.two,
  },
  resultButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
