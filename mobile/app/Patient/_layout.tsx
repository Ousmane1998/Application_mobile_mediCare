import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PatientTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#10B981' }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" color={'black'} size={40} />,
        }}
      />
      <Tabs.Screen
        name="measures"
        options={{
          title: 'Mesures',
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart-outline" color={'black'} size={40} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Rendez-vous',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" color={'black'} size={40} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarBadge: 1,
          tabBarIcon: ({ color }) => <Ionicons name="chatbox-ellipses-outline" color={'black'} size={40} />,
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: 'Médicaments',
          tabBarIcon: ({ color }) => <Ionicons name="medical-outline" color={'black'} size={40} />,
        }}
      />
    </Tabs>
  );
}
