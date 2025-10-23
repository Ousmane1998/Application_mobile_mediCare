// app/index.tsx
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [route, setRoute] = useState<"/login" | "/welcome" | null>(null); // ← typage strict

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem('hasSeenOnboarding');
        setRoute(seen ? "/welcome" : "/login");
      } catch {
        setRoute("/welcome");
      }
    };
    checkOnboarding();
  }, []);

  if (!route) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={route} />;
}
