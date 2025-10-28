// app/_layout.tsx
import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { ThemeProviderApp, useAppTheme } from '../theme/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProviderApp>
      <RootLayoutInner />
    </ThemeProviderApp>
  );
}

function RootLayoutInner() {
  const { theme } = useAppTheme();
  const navTheme = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={navTheme}>
      <Stack>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="welcome2" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register-doctor" options={{ headerShown: false }} />
        <Stack.Screen name="Doctor" options={{ headerShown: false }} />
        <Stack.Screen name="Patient" options={{ headerShown: false }} />
        <Stack.Screen name="Admin" options={{ headerShown: false }} />
        </Stack>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
