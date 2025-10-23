import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NavPatient() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#10B981' }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="measures"
        options={{
          title: 'Mesures',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Rendez-vous',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarBadge: 1,
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbox-ellipses-outline" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: 'Médicaments',
          tabBarIcon: ({ color, size }) => <Ionicons name="medical-outline" color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
