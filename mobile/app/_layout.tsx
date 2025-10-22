import React, { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem('hasSeenOnboarding');
        setInitialRoute(seen ? 'login' : 'welcome');
      } catch {
        setInitialRoute('welcome');
      }
    };
    checkOnboarding();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName={initialRoute}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="welcome2" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register-doctor" options={{ headerShown: false }} />
        <Stack.Screen name="register-patient" options={{ headerShown: false }} />
        <Stack.Screen name="doctor" options={{ headerShown: false }} />
        <Stack.Screen name="patient" options={{ headerShown: false }} />
      
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
