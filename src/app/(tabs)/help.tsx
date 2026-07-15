import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GuideDiagram } from '@/components/guide-diagrams';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { DRIVING_GUIDES, GUIDE_GROUPS } from '@/data/driving-guides';
import { useTabReset } from '@/hooks/tab-reset';
import { useTheme } from '@/hooks/use-theme';

export default function HelpScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [guideId, setGuideId] = useState<string | null>(null);
  const guide = DRIVING_GUIDES.find((g) => g.id === guideId) ?? null;

  // Fill the diagram card on phones, without ballooning on desktop.
  const contentWidth = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const diagramSize = Math.min(520, contentWidth - Spacing.three * 2);

  // Re-tapping the Help tab returns to the guide list.
  useTabReset('/help', () => setGuideId(null));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {!guide && (
            <>
              <ThemedText type="subtitle" style={styles.title}>
                Help & guides
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Lesson-ready explanations with diagrams — hand the phone over or talk them through
                it kerbside.
              </ThemedText>

              {GUIDE_GROUPS.map((group) => (
                <View key={group} style={styles.group}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.groupHeader}>
                    {group.toUpperCase()}
                  </ThemedText>
                  {DRIVING_GUIDES.filter((g) => g.group === group).map((g) => (
                    <Pressable
                      key={g.id}
                      onPress={() => setGuideId(g.id)}
                      style={({ pressed }) => pressed && styles.pressed}>
                      <ThemedView type="backgroundElement" style={styles.guideRow}>
                        <ThemedText style={styles.guideEmoji}>{g.emoji}</ThemedText>
                        <View style={styles.flex}>
                          <ThemedText type="smallBold">{g.title}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {g.summary}
                          </ThemedText>
                        </View>
                        <ThemedText type="small" themeColor="textSecondary">
                          ›
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  ))}
                </View>
              ))}
            </>
          )}

          {guide && (
            <>
              <View style={styles.backRow}>
                <Chip label="‹ All guides" onPress={() => setGuideId(null)} />
              </View>
              <ThemedText type="subtitle">
                {guide.emoji} {guide.title}
              </ThemedText>
              {guide.diagram && (
                <ThemedView type="backgroundElement" style={styles.diagramCard}>
                  <GuideDiagram kind={guide.diagram} size={diagramSize} />
                </ThemedView>
              )}
              <ThemedText type="small" themeColor="textSecondary">
                {guide.intro}
              </ThemedText>
              {guide.sections.map((section) => (
                <ThemedView key={section.heading} type="backgroundElement" style={styles.guideCard}>
                  <View style={styles.headingRow}>
                    <ThemedText style={[styles.chevrons, { color: theme.tint }]}>››</ThemedText>
                    <ThemedText type="smallBold" style={styles.flex}>
                      {section.heading}
                    </ThemedText>
                  </View>
                  {section.points.map((point) => (
                    <View key={point} style={styles.pointRow}>
                      <View style={[styles.bullet, { backgroundColor: theme.tint }]} />
                      <ThemedText type="small" style={styles.flex}>
                        {point}
                      </ThemedText>
                    </View>
                  ))}
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
  group: {
    gap: Spacing.two,
  },
  groupHeader: {
    paddingTop: Spacing.two,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 12,
    padding: Spacing.three,
  },
  guideEmoji: {
    fontSize: 22,
  },
  backRow: {
    flexDirection: 'row',
    paddingTop: Spacing.three,
  },
  diagramCard: {
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  guideCard: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chevrons: {
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: -1,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  pressed: {
    opacity: 0.7,
  },
});
