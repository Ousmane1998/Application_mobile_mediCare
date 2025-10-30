import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProfile } from '../../utils/api';

export default function AdminTabsLayout() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const prof = await getProfile();
        const role = (prof?.user?.role || '').toLowerCase();
        if (role !== 'admin') {
          // Redirige non-admins
          if (role === 'medecin') router.replace('/Doctor/dashboard');
          else router.replace('/Patient/dashboard');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  }

  return (
    <Tabs screenOptions={{ 
      headerShown: false, 
      tabBarActiveTintColor: '#10B981',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopColor: '#E5E7EB',
        borderTopWidth: 1,
      }
    }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Utilisateurs',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
      {/* Pages cachées - accessibles par navigation mais pas dans la barre */}
      <Tabs.Screen
        name="profile-edit"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="user-edit"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="doctors-activation"
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
