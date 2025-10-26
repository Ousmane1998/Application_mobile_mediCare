import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NavDoctor() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#10B981' }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Ionicons name="speedometer-outline" color={color} size={60} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles-outline" color={color} size={60} />,
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          title: 'Disponibilités',
          tabBarIcon: ({ color }) => <Ionicons name="time-outline" color={color} size={60} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <Ionicons name="notifications-outline" color={color} size={60} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" color={color} size={60} />,
        }}
      />
    </Tabs>
  );
}
