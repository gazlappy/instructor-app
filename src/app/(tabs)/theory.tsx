import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROAD_SIGNS, RoadSign, SIGN_KIND_LABELS, type SignKind } from '@/components/road-sign';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { Field } from '@/components/ui/form';
import { Select } from '@/components/ui/select';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { THEORY_QUESTIONS, type TheoryQuestion } from '@/data/theory-questions';
import { createTheoryAttempt, listStudents, listTheoryAttempts } from '@/db/queries';
import { type TheoryMode } from '@/db/types';
import { useQuery } from '@/db/use-query';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/alert';
import { formatDateUK } from '@/lib/dates';

const PASS_MARK = 0.86; // the real test needs 43/50
// Correct answers use the theme's primary-route green (theme.success).
const SECONDS_PER_QUESTION = 68.4; // the real test allows 57 minutes for 50 questions

interface QuizQuestion extends TheoryQuestion {
  shuffledOptions: string[];
  correctIndex: number;
  /** Set for sign-recognition questions: renders the sign graphic. */
  signId?: string;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildQuiz(pool: TheoryQuestion[], length: number): QuizQuestion[] {
  return shuffle(pool)
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

const TOPICS = [...new Set(THEORY_QUESTIONS.map((q) => q.category))].map((category) => ({
  value: category,
  label: `${category} (${THEORY_QUESTIONS.filter((q) => q.category === category).length})`,
}));

const LENGTH_OPTIONS = [
  { value: 10, label: 'Quick — 10 questions' },
  { value: 25, label: 'Standard — 25 questions' },
  { value: 50, label: 'Long — 50 questions' },
];

/** The real test is 50 questions in 57 minutes. */
const MOCK_LENGTH = Math.min(50, THEORY_QUESTIONS.length);
const MOCK_SECONDS = Math.round(MOCK_LENGTH * SECONDS_PER_QUESTION);

const MODE_TITLES: Record<TheoryMode, string> = {
  practice: 'Practice',
  topic: 'Topic practice',
  mock: 'Mock test',
  signs: 'Sign quiz',
};

function buildSignQuiz(): QuizQuestion[] {
  return shuffle(ROAD_SIGNS).map((sign, index) => {
    const others = shuffle(ROAD_SIGNS.filter((s) => s.id !== sign.id))
      .slice(0, 3)
      .map((s) => s.meaning);
    const options = [sign.meaning, ...others] as [string, string, string, string];
    const order = shuffle([0, 1, 2, 3]);
    return {
      id: 10000 + index,
      category: 'Road signs',
      question: 'What does this sign mean?',
      options,
      answer: 0,
      explanation: `${sign.name} — ${sign.meaning}.`,
      shuffledOptions: order.map((i) => options[i]),
      correctIndex: order.indexOf(0),
      signId: sign.id,
    };
  });
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TheoryScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();

  const [phase, setPhase] = useState<'start' | 'quiz' | 'review' | 'results' | 'browse'>('start');
  const [mode, setMode] = useState<TheoryMode>('practice');
  const [length, setLength] = useState(10);
  const [topic, setTopic] = useState<string>(TOPICS[0].value);
  const [studentId, setStudentId] = useState<number>(0); // 0 = nobody
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const answersRef = useRef<(number | null)[]>([]);
  const [flags, setFlags] = useState<boolean[]>([]);
  const [fromReview, setFromReview] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const finishedRef = useRef(false);

  const { data: students } = useQuery((db) => listStudents(db, { includePassed: false }));
  const { data: attempts, refresh: refreshAttempts } = useQuery((db) => listTheoryAttempts(db));

  const start = (startMode: TheoryMode) => {
    const pool =
      startMode === 'topic' ? THEORY_QUESTIONS.filter((q) => q.category === topic) : THEORY_QUESTIONS;
    const quizLength =
      startMode === 'practice' ? length : startMode === 'mock' ? MOCK_LENGTH : pool.length;
    const questions = startMode === 'signs' ? buildSignQuiz() : buildQuiz(pool, quizLength);
    setMode(startMode);
    setQuiz(questions);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setAnswers(Array(questions.length).fill(null));
    answersRef.current = Array(questions.length).fill(null);
    setFlags(Array(questions.length).fill(false));
    setFromReview(false);
    finishedRef.current = false;
    if (startMode === 'mock') setRemaining(Math.round(questions.length * SECONDS_PER_QUESTION));
    setPhase('quiz');
  };

  const finish = async (finalScore: number, quizOverride?: QuizQuestion[]) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setScore(finalScore);
    await createTheoryAttempt(db, {
      studentId: studentId || null,
      score: finalScore,
      total: (quizOverride ?? quiz).length,
      mode,
      topic: mode === 'topic' ? topic : null,
    });
    refreshAttempts();
    setPhase('results');
  };

  const scoreFromAnswers = (list: (number | null)[]) =>
    list.reduce((sum: number, answer, i) => sum + (answer === quiz[i]?.correctIndex ? 1 : 0), 0);

  // Mock test countdown; submits automatically when time runs out.
  useEffect(() => {
    if ((phase !== 'quiz' && phase !== 'review') || mode !== 'mock') return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          finish(scoreFromAnswers(answersRef.current));
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode, quiz]);

  const pick = (optionIndex: number) => {
    if (mode === 'mock') {
      const next = [...answersRef.current];
      next[index] = optionIndex;
      answersRef.current = next;
      setAnswers(next);
      if (fromReview) {
        setFromReview(false);
        setPhase('review');
      } else if (index + 1 >= quiz.length) {
        setPhase('review'); // the real test lets you review before submitting
      } else {
        setIndex((i) => i + 1);
      }
      return;
    }
    if (picked !== null) return;
    setPicked(optionIndex);
    if (optionIndex === quiz[index].correctIndex) setScore((s) => s + 1);
  };

  const toggleFlag = () => {
    setFlags((current) => {
      const next = [...current];
      next[index] = !next[index];
      return next;
    });
  };

  const jumpToQuestion = (questionIndex: number) => {
    setIndex(questionIndex);
    setFromReview(true);
    setPhase('quiz');
  };

  const submitMock = () => finish(scoreFromAnswers(answersRef.current));

  const next = () => {
    if (index + 1 >= quiz.length) {
      finish(score);
    } else {
      setIndex((i) => i + 1);
      setPicked(null);
    }
  };

  const quit = () => {
    const leave = () => {
      finishedRef.current = true; // stop a racing mock timer from saving an attempt
      setPhase('start');
    };
    if (mode === 'mock') {
      confirmDestructive('Quit the mock test?', 'This attempt will not be saved.', 'Quit', leave);
    } else {
      leave();
    }
  };

  const question = quiz[index];
  const percent = quiz.length ? Math.round((score / quiz.length) * 100) : 0;
  const passed = quiz.length > 0 && score / quiz.length >= PASS_MARK;

  const wrongAnswers = useMemo(
    () =>
      mode === 'mock' && phase === 'results'
        ? quiz
            .map((q, i) => ({ question: q, given: answers[i], flagged: flags[i] }))
            .filter(({ question: q, given }) => given !== q.correctIndex)
        : [],
    [mode, phase, quiz, answers, flags]
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle" style={styles.title}>
            Theory practice
          </ThemedText>

          {phase === 'start' && (
            <>
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

              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
                QUICK PRACTICE
              </ThemedText>
              <ThemedView type="backgroundElement" style={styles.modeCard}>
                <ThemedText type="small" themeColor="textSecondary">
                  Random questions with instant feedback and explanations.
                </ThemedText>
                <Select options={LENGTH_OPTIONS} value={length} onChange={setLength} />
                <View style={styles.startRow}>
                  <Chip label="Start practice" selected onPress={() => start('practice')} />
                </View>
              </ThemedView>

              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
                PICK A TOPIC
              </ThemedText>
              <ThemedView type="backgroundElement" style={styles.modeCard}>
                <ThemedText type="small" themeColor="textSecondary">
                  Drill one category at a time — every question in the topic, instant feedback.
                </ThemedText>
                <Select options={TOPICS} value={topic} onChange={setTopic} />
                <View style={styles.startRow}>
                  <Chip label="Practise this topic" selected onPress={() => start('topic')} />
                </View>
              </ThemedView>

              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
                ROAD SIGNS
              </ThemedText>
              <ThemedView type="backgroundElement" style={styles.modeCard}>
                <ThemedText type="small" themeColor="textSecondary">
                  Learn the shapes and meanings — {ROAD_SIGNS.length} signs to recognise, or browse
                  them all as a reference.
                </ThemedText>
                <View style={styles.signButtonRow}>
                  <Chip label="Sign quiz" selected onPress={() => start('signs')} />
                  <Chip label="Browse signs" onPress={() => setPhase('browse')} />
                </View>
              </ThemedView>

              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
                MOCK TEST
              </ThemedText>
              <ThemedView type="backgroundElement" style={styles.modeCard}>
                <ThemedText type="small" themeColor="textSecondary">
                  Under test conditions, like the real thing: {MOCK_LENGTH} questions,{' '}
                  {formatClock(MOCK_SECONDS)} on the clock, no feedback until the end. 86% to
                  pass, then review what you got wrong.
                </ThemedText>
                <View style={styles.startRow}>
                  <Chip label="Start mock test" selected onPress={() => start('mock')} />
                </View>
              </ThemedView>

              {(attempts ?? []).length > 0 && (
                <>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
                    RECENT ATTEMPTS
                  </ThemedText>
                  {(attempts ?? []).map((attempt) => {
                    const pct = Math.round((attempt.score / attempt.total) * 100);
                    const ok = attempt.score / attempt.total >= PASS_MARK;
                    const label = attempt.mode === 'topic' ? (attempt.topic ?? 'Topic') : MODE_TITLES[attempt.mode];
                    return (
                      <ThemedView key={attempt.id} type="backgroundElement" style={styles.attemptRow}>
                        <View style={styles.flex}>
                          <ThemedText type="small">
                            {attempt.studentFirstName
                              ? `${attempt.studentFirstName} ${attempt.studentLastName ?? ''}`.trim()
                              : 'Practice'}
                            {' · '}
                            {label}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {formatDateUK(attempt.takenAt.slice(0, 10))}
                          </ThemedText>
                        </View>
                        <ThemedText type="smallBold" style={{ color: ok ? theme.success : theme.danger }}>
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
                  {MODE_TITLES[mode]} · {index + 1} of {quiz.length}
                </ThemedText>
                <View style={styles.progressRight}>
                  {mode === 'mock' ? (
                    <ThemedText
                      type="smallBold"
                      style={{ color: remaining < 60 ? theme.danger : theme.textSecondary }}>
                      ⏱ {formatClock(remaining)}
                    </ThemedText>
                  ) : (
                    <ThemedText type="small" themeColor="textSecondary">
                      {question.category}
                    </ThemedText>
                  )}
                  {mode === 'mock' && (
                    <Chip label={flags[index] ? '🚩 Flagged' : '🚩 Flag'} selected={flags[index]} onPress={toggleFlag} />
                  )}
                  <Chip label="Quit" onPress={quit} />
                </View>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.tint,
                      width: `${((index + (picked !== null ? 1 : 0)) / quiz.length) * 100}%`,
                    },
                  ]}
                />
              </View>

              {question.signId && (
                <View style={styles.signGraphic}>
                  <RoadSign id={question.signId} size={140} />
                </View>
              )}
              <ThemedText style={styles.questionText}>{question.question}</ThemedText>

              {question.shuffledOptions.map((option, optionIndex) => {
                const isCorrect = optionIndex === question.correctIndex;
                const isPicked = optionIndex === picked;
                let background: string = theme.backgroundElement;
                if (mode !== 'mock' && picked !== null && isCorrect) background = theme.success;
                else if (mode !== 'mock' && picked !== null && isPicked && !isCorrect)
                  background = theme.danger;
                const highlighted = mode !== 'mock' && picked !== null && (isCorrect || isPicked);
                return (
                  <Pressable
                    key={optionIndex}
                    onPress={() => pick(optionIndex)}
                    disabled={mode !== 'mock' && picked !== null}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        backgroundColor: background,
                        borderColor: highlighted ? theme.tintBorder : theme.backgroundSelected,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="small" style={highlighted ? { color: '#fff' } : undefined}>
                      {option}
                    </ThemedText>
                  </Pressable>
                );
              })}

              {mode !== 'mock' && picked !== null && (
                <>
                  <ThemedView type="backgroundElement" style={styles.explanation}>
                    <ThemedText
                      type="smallBold"
                      style={{ color: picked === question.correctIndex ? theme.success : theme.danger }}>
                      {picked === question.correctIndex ? 'Correct!' : 'Not quite.'}
                    </ThemedText>
                    <ThemedText type="small">{question.explanation}</ThemedText>
                  </ThemedView>
                  <View style={styles.startRow}>
                    <Chip
                      label={index + 1 >= quiz.length ? 'See results' : 'Next question'}
                      selected
                      onPress={next}
                    />
                  </View>
                </>
              )}
            </>
          )}

          {phase === 'review' && (
            <>
              <View style={styles.progressRow}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Check your answers
                </ThemedText>
                <View style={styles.progressRight}>
                  <ThemedText
                    type="smallBold"
                    style={{ color: remaining < 60 ? theme.danger : theme.textSecondary }}>
                    ⏱ {formatClock(remaining)}
                  </ThemedText>
                  <Chip label="Quit" onPress={quit} />
                </View>
              </View>

              <ThemedView type="backgroundElement" style={styles.reviewSummary}>
                <ThemedText type="smallBold">
                  {answers.filter((a) => a !== null).length} of {quiz.length} answered ·{' '}
                  {flags.filter(Boolean).length} flagged
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {flags.some(Boolean) || answers.some((a) => a === null)
                    ? 'Tap a question to change your answer, then submit when you’re happy.'
                    : 'Nothing flagged — submit when you’re ready.'}
                </ThemedText>
              </ThemedView>

              {quiz
                .map((q, i) => ({ q, i }))
                .filter(({ i }) => flags[i] || answers[i] === null)
                .map(({ q, i }) => (
                  <Pressable
                    key={q.id}
                    onPress={() => jumpToQuestion(i)}
                    style={({ pressed }) => [
                      styles.reviewRow,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="smallBold" style={{ color: theme.tint }}>
                      {i + 1}
                    </ThemedText>
                    <View style={styles.flex}>
                      <ThemedText type="small" numberOfLines={1}>
                        {q.question}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {flags[i] ? '🚩 Flagged' : ''}
                        {flags[i] && answers[i] === null ? ' · ' : ''}
                        {answers[i] === null ? 'Not answered' : ''}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      ›
                    </ThemedText>
                  </Pressable>
                ))}

              <View style={styles.resultButtons}>
                <Chip label="Submit test" selected onPress={submitMock} />
              </View>
            </>
          )}

          {phase === 'browse' && (
            <>
              <View style={styles.startRow}>
                <Chip label="‹ Back" onPress={() => setPhase('start')} />
              </View>
              {(Object.keys(SIGN_KIND_LABELS) as SignKind[]).map((kind) => (
                <View key={kind} style={styles.browseGroup}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    {SIGN_KIND_LABELS[kind].toUpperCase()}
                  </ThemedText>
                  {ROAD_SIGNS.filter((sign) => sign.kind === kind).map((sign) => (
                    <ThemedView key={sign.id} type="backgroundElement" style={styles.browseRow}>
                      <RoadSign id={sign.id} size={56} />
                      <View style={styles.flex}>
                        <ThemedText type="smallBold">{sign.name}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {sign.meaning}
                        </ThemedText>
                      </View>
                    </ThemedView>
                  ))}
                </View>
              ))}
            </>
          )}

          {phase === 'results' && (
            <>
              <ThemedView type="backgroundElement" style={styles.resultCard}>
                <ThemedText type="small" themeColor="textSecondary">
                  {MODE_TITLES[mode]}
                  {mode === 'topic' ? ` — ${topic}` : ''}
                </ThemedText>
                <ThemedText type="title" style={{ color: passed ? theme.success : theme.danger }}>
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
                <Chip label="Try again" selected onPress={() => start(mode)} />
              </View>

              {wrongAnswers.length > 0 && (
                <>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
                    REVIEW — {wrongAnswers.length} TO WORK ON
                  </ThemedText>
                  {wrongAnswers.map(({ question: q, given, flagged }) => (
                    <ThemedView key={q.id} type="backgroundElement" style={styles.reviewCard}>
                      <ThemedText type="small" themeColor="textSecondary">
                        {q.category}
                        {flagged ? ' · 🚩 flagged during the test' : ''}
                      </ThemedText>
                      <ThemedText type="smallBold">{q.question}</ThemedText>
                      {given !== null && (
                        <ThemedText type="small" style={{ color: theme.danger }}>
                          ✗ You answered: {q.shuffledOptions[given]}
                        </ThemedText>
                      )}
                      {given === null && (
                        <ThemedText type="small" style={{ color: theme.danger }}>
                          ✗ Not answered (time ran out)
                        </ThemedText>
                      )}
                      <ThemedText type="small" style={{ color: theme.success }}>
                        ✓ {q.shuffledOptions[q.correctIndex]}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {q.explanation}
                      </ThemedText>
                    </ThemedView>
                  ))}
                </>
              )}
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
    paddingTop: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  sectionHeader: {
    paddingTop: Spacing.two,
  },
  modeCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  startRow: {
    flexDirection: 'row',
  },
  signButtonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  signGraphic: {
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  browseGroup: {
    gap: Spacing.two,
  },
  browseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
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
  progressRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
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
    borderRadius: 12,
    borderWidth: 1.5,
    padding: Spacing.three,
    elevation: 1,
    shadowColor: '#16181d',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
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
  reviewCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  reviewSummary: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
