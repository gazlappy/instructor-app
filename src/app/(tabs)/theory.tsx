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
import { SAFETY_QUESTIONS } from '@/data/safety-questions';
import { THEORY_QUESTIONS, type TheoryQuestion } from '@/data/theory-questions';
import { createTheoryAttempt, listStudents, listTheoryAttempts } from '@/db/queries';
import { type TheoryAttempt, type TheoryMode, type TheoryReviewItem } from '@/db/types';
import { useQuery } from '@/db/use-query';
import { useTabReset } from '@/hooks/tab-reset';
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

/** The real test is 50 questions in 57 minutes. */
const MOCK_LENGTH = Math.min(50, THEORY_QUESTIONS.length);
const MOCK_SECONDS = Math.round(MOCK_LENGTH * SECONDS_PER_QUESTION);

const MODE_TITLES: Record<TheoryMode, string> = {
  practice: 'Practice',
  topic: 'Topic practice',
  mock: 'Mock test',
  signs: 'Sign quiz',
  safety: 'Safety questions',
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

/** Snapshot of every wrongly-answered question, for storing on the attempt. */
function buildReview(quiz: QuizQuestion[], given: (number | null)[]): TheoryReviewItem[] {
  return quiz
    .map((q, i) => ({ q, answer: given[i] ?? null }))
    .filter(({ q, answer }) => answer !== q.correctIndex)
    .map(({ q, answer }) => ({
      category: q.category,
      question: q.question,
      options: q.shuffledOptions,
      given: answer,
      correct: q.correctIndex,
      explanation: q.explanation,
      ...(q.signId ? { signId: q.signId } : {}),
    }));
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** A Help-style tappable row: emoji, title, summary, chevron. */
function ModeRow({
  emoji,
  title,
  summary,
  onPress,
}: {
  emoji: string;
  title: string;
  summary: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.modeRow}>
        <ThemedText style={styles.modeEmoji}>{emoji}</ThemedText>
        <View style={styles.flex}>
          <ThemedText type="smallBold">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {summary}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          ›
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export default function TheoryScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();

  const [phase, setPhase] = useState<
    'start' | 'topics' | 'quiz' | 'review' | 'results' | 'browse' | 'attemptReview'
  >('start');
  // A past attempt reopened from Recent Attempts, to review its wrong answers.
  const [reviewAttempt, setReviewAttempt] = useState<TheoryAttempt | null>(null);
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
  const [saveFailed, setSaveFailed] = useState(false);
  const finishedRef = useRef(false);

  const { data: students } = useQuery((db) => listStudents(db, { includePassed: false }));
  const { data: attempts, refresh: refreshAttempts } = useQuery((db) => listTheoryAttempts(db));

  const start = (startMode: TheoryMode, opts: { length?: number; topic?: string } = {}) => {
    const chosenTopic = opts.topic ?? topic;
    if (opts.topic) setTopic(opts.topic);
    if (opts.length) setLength(opts.length);
    const pool =
      startMode === 'topic'
        ? THEORY_QUESTIONS.filter((q) => q.category === chosenTopic)
        : startMode === 'safety'
          ? SAFETY_QUESTIONS
          : THEORY_QUESTIONS;
    const quizLength =
      startMode === 'practice'
        ? (opts.length ?? length)
        : startMode === 'mock'
          ? MOCK_LENGTH
          : pool.length;
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
    const finishedQuiz = quizOverride ?? quiz;
    // Always show the result, even if saving fails — the results screen is
    // built from live state, so the pupil never loses their test to a
    // database hiccup. Only the persisted history entry is at risk.
    setSaveFailed(false);
    setPhase('results');
    try {
      await createTheoryAttempt(db, {
        studentId: studentId || null,
        score: finalScore,
        total: finishedQuiz.length,
        mode,
        topic: mode === 'topic' ? topic : null,
        // The mock records every answer, so its wrong ones can be reviewed later.
        wrong: mode === 'mock' ? buildReview(finishedQuiz, answersRef.current) : [],
      });
      refreshAttempts();
    } catch {
      setSaveFailed(true);
    }
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
    if (mode === 'mock' && (phase === 'quiz' || phase === 'review')) {
      confirmDestructive('Quit the mock test?', 'This attempt will not be saved.', 'Quit', leave);
    } else {
      leave();
    }
  };

  // Re-tapping the Theory tab returns to the start screen. A mock in
  // progress still gets its confirmation before being abandoned.
  useTabReset('/theory', () => {
    if (phase === 'start') return;
    quit();
  });

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
                PRACTISE
              </ThemedText>
              <ModeRow
                emoji="⚡"
                title="Quick practice"
                summary="10 random questions with instant feedback and explanations."
                onPress={() => start('practice', { length: 10 })}
              />
              <ModeRow
                emoji="📚"
                title="Long practice"
                summary="25 random questions — a proper session with instant feedback."
                onPress={() => start('practice', { length: 25 })}
              />
              <ModeRow
                emoji="📖"
                title="Pick a topic"
                summary="Drill one category at a time — every question in the topic."
                onPress={() => setPhase('topics')}
              />

              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
                ROAD SIGNS
              </ThemedText>
              <ModeRow
                emoji="🚦"
                title="Sign quiz"
                summary={`All ${ROAD_SIGNS.length} signs — what does each one mean?`}
                onPress={() => start('signs')}
              />
              <ModeRow
                emoji="🔍"
                title="Browse all signs"
                summary="The full reference, grouped by shape and meaning."
                onPress={() => setPhase('browse')}
              />

              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
                VEHICLE SAFETY
              </ThemedText>
              <ModeRow
                emoji="🔧"
                title="Show me, tell me quiz"
                summary={`The ${SAFETY_QUESTIONS.length} vehicle-safety checks from the start of the practical test.`}
                onPress={() => start('safety')}
              />

              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
                MOCK TEST
              </ThemedText>
              <ModeRow
                emoji="⏱"
                title="Mock test"
                summary={`Test conditions: ${MOCK_LENGTH} questions, ${formatClock(MOCK_SECONDS)} on the clock, review at the end. 86% to pass.`}
                onPress={() => start('mock')}
              />

              {(attempts ?? []).length > 0 && (
                <>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
                    RECENT ATTEMPTS
                  </ThemedText>
                  {(attempts ?? []).map((attempt) => {
                    const pct = Math.round((attempt.score / attempt.total) * 100);
                    const ok = attempt.score / attempt.total >= PASS_MARK;
                    const label = attempt.mode === 'topic' ? (attempt.topic ?? 'Topic') : MODE_TITLES[attempt.mode];
                    const reviewable = attempt.wrong.length > 0;
                    const openReview = () => {
                      setReviewAttempt(attempt);
                      setPhase('attemptReview');
                    };
                    const row = (
                      <ThemedView type="backgroundElement" style={styles.attemptRow}>
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
                            {reviewable
                              ? ` · review ${attempt.wrong.length} missed ›`
                              : ''}
                          </ThemedText>
                        </View>
                        <ThemedText type="smallBold" style={{ color: ok ? theme.success : theme.danger }}>
                          {attempt.score}/{attempt.total} · {pct}%
                        </ThemedText>
                      </ThemedView>
                    );
                    return reviewable ? (
                      <Pressable
                        key={attempt.id}
                        onPress={openReview}
                        style={({ pressed }) => pressed && styles.pressed}>
                        {row}
                      </Pressable>
                    ) : (
                      <View key={attempt.id}>{row}</View>
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

          {phase === 'topics' && (
            <>
              <View style={styles.startRow}>
                <Chip label="‹ Back" onPress={() => setPhase('start')} />
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                Every question in the chosen category, with instant feedback.
              </ThemedText>
              {TOPICS.map((t) => (
                <ModeRow
                  key={t.value}
                  emoji="📖"
                  title={t.value}
                  summary={`${THEORY_QUESTIONS.filter((q) => q.category === t.value).length} questions`}
                  onPress={() => start('topic', { topic: t.value })}
                />
              ))}
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
              {saveFailed && (
                <ThemedText type="small" style={{ color: theme.danger }}>
                  ⚠︎ Couldn’t save this to your history, but your result and review are shown below.
                </ThemedText>
              )}
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

          {phase === 'attemptReview' && reviewAttempt && (
            <>
              <View style={styles.startRow}>
                <Chip label="‹ Back" onPress={() => setPhase('start')} />
              </View>
              <ThemedView type="backgroundElement" style={styles.resultCard}>
                <ThemedText type="small" themeColor="textSecondary">
                  {MODE_TITLES[reviewAttempt.mode]}
                  {reviewAttempt.studentFirstName
                    ? ` — ${reviewAttempt.studentFirstName} ${reviewAttempt.studentLastName ?? ''}`.trim()
                    : ''}
                  {' · '}
                  {formatDateUK(reviewAttempt.takenAt.slice(0, 10))}
                </ThemedText>
                <ThemedText
                  type="title"
                  style={{
                    color:
                      reviewAttempt.score / reviewAttempt.total >= PASS_MARK
                        ? theme.success
                        : theme.danger,
                  }}>
                  {reviewAttempt.score}/{reviewAttempt.total}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {reviewAttempt.wrong.length} to work on
                </ThemedText>
              </ThemedView>

              {reviewAttempt.wrong.map((item, i) => (
                <ThemedView key={i} type="backgroundElement" style={styles.reviewCard}>
                  {item.signId && (
                    <View style={styles.reviewSign}>
                      <RoadSign id={item.signId} size={56} />
                    </View>
                  )}
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.category}
                  </ThemedText>
                  <ThemedText type="smallBold">{item.question}</ThemedText>
                  <ThemedText type="small" style={{ color: theme.danger }}>
                    {item.given !== null
                      ? `✗ You answered: ${item.options[item.given]}`
                      : '✗ Not answered (time ran out)'}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.success }}>
                    ✓ {item.options[item.correct]}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.explanation}
                  </ThemedText>
                </ThemedView>
              ))}
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
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 12,
    padding: Spacing.three,
  },
  modeEmoji: {
    fontSize: 22,
  },
  startRow: {
    flexDirection: 'row',
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
  reviewSign: {
    alignItems: 'center',
    paddingBottom: Spacing.one,
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
