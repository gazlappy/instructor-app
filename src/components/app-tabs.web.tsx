import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View } from 'react-native';

import { navBarStyles } from './nav-bar';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

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
    <Pressable {...props} style={({ pressed }) => pressed && navBarStyles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={navBarStyles.button}>
        <ThemedText type="small" themeColor={isFocused ? 'tint' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={navBarStyles.container}>
      <ThemedView type="backgroundElement" style={navBarStyles.pill}>
        {props.children}
      </ThemedView>
    </View>
  );
}
