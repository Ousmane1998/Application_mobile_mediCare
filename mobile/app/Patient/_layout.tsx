import React from 'react';
import NavPatient from '../../components/navPatient';

export default function PatientTabsLayout() {
<<<<<<< HEAD
  return <NavPatient />;
=======
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#2ccdd2' }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
>>>>>>> 5752405 (push header)
}
