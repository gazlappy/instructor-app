import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Schedule</TabButton>
          </TabTrigger>
          <TabTrigger name="students" href="/students" asChild>
            <TabButton>Students</TabButton>
          </TabTrigger>
          <TabTrigger name="theory" href="/theory" asChild>
            <TabButton>Theory</TabButton>
          </TabTrigger>
          <TabTrigger name="help" href="/help" asChild>
            <TabButton>Help</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton>Settings</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedText type="small" themeColor={isFocused ? 'tint' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    pointerEvents: 'box-none',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    elevation: 4,
    shadowColor: '#16181d',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
  },
});
