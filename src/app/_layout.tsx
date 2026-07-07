import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DATABASE_NAME, migrateDb } from '@/db/schema';
import { AppSettingsProvider, useAppColorScheme } from '@/hooks/app-settings';

SplashScreen.preventAutoHideAsync();

function ThemedNavigator() {
  const colorScheme = useAppColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="student/new" options={{ title: 'New student', presentation: 'modal' }} />
        <Stack.Screen name="student/[id]/index" options={{ title: 'Student' }} />
        <Stack.Screen name="student/[id]/edit" options={{ title: 'Edit student', presentation: 'modal' }} />
        <Stack.Screen name="lesson/new" options={{ title: 'New lesson', presentation: 'modal' }} />
        <Stack.Screen name="lesson/[id]" options={{ title: 'Lesson', presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDb}>
      <AppSettingsProvider>
        <ThemedNavigator />
      </AppSettingsProvider>
    </SQLiteProvider>
  );
}
