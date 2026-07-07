import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DATABASE_NAME, migrateDb } from '@/db/schema';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDb}>
        <AnimatedSplashOverlay />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="student/new" options={{ title: 'New student', presentation: 'modal' }} />
          <Stack.Screen name="student/[id]/index" options={{ title: 'Student' }} />
          <Stack.Screen name="student/[id]/edit" options={{ title: 'Edit student', presentation: 'modal' }} />
          <Stack.Screen name="lesson/new" options={{ title: 'New lesson', presentation: 'modal' }} />
          <Stack.Screen name="lesson/[id]" options={{ title: 'Lesson', presentation: 'modal' }} />
        </Stack>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
