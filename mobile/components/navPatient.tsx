import React from 'react';
import { Tabs, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NavPatient() {
  const pathname = usePathname();
  const isChatPage = pathname.includes('/chat');

  return (
    <Tabs screenOptions={{ 
      headerShown: false, 
      tabBarActiveTintColor: '#2ccdd2',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: isChatPage ? { display: 'none' } : {
        backgroundColor: '#fff',
        borderTopColor: '#E5E7EB',
        borderTopWidth: 1,
      }
    }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="measures"
        options={{
          title: 'Mesures',
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart-outline" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Rendez-vous',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarBadge: 1,
          tabBarIcon: ({ color }) => <Ionicons name="chatbox-ellipses-outline" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="health-alerts"
        options={{
          title: 'Alertes',
          tabBarIcon: ({ color }) => <Ionicons name="alert-circle-outline" color={color} size={24} />,
        }}
      />
      {/* Pages cachées - accessibles par navigation mais pas dans la barre */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // Masquer de la barre de navigation
        }}
      />
      <Tabs.Screen
        name="ordonnances"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile-edit"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="advice"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="appointment-new"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="measure-add"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="measures-history"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="health-record"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="find-structure"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="emergency-alert"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="password-change"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
