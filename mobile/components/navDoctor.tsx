import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import { SOCKET_URL, getNotifications, getProfile } from '../utils/api';

export default function NavDoctor() {
  const [unread, setUnread] = useState(0);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const prof = await getProfile();
        const id = (prof.user as any)._id || (prof.user as any).id;
        const list = await getNotifications(id);
        if (mounted) setUnread((Array.isArray(list) ? list : []).filter((n: any) => !n.isRead).length);
        const s = io(SOCKET_URL, { transports: ['websocket'] });
        socketRef.current = s;
        s.emit('join', String(id));
        s.on('alert', () => setUnread((x) => x + 1));
      } catch {}
    })();
    return () => { mounted = false; try { socketRef.current?.disconnect(); } catch {} };
  }, []);

  const BadgeIcon = ({ name, color }: { name: any; color: string }) => (
    <View style={{ width: 28, height: 28 }}>
      <Ionicons name={name} color={color} size={24} />
      {unread > 0 && (
        <View style={{ position: 'absolute', top: -4, right: -6, backgroundColor: '#EF4444', minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
          <Text style={{ color: '#fff', fontSize: 10 }}>{unread > 99 ? '99+' : unread}</Text>
        </View>
      )}
    </View>
  );

  return (
    <Tabs screenOptions={{ 
      headerShown: false, 
      tabBarActiveTintColor: '#2ccdd2',
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
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" color={color} size={24} />,
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
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles-outline" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alertes',
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarIcon: ({ color }) => <BadgeIcon name="alert-circle-outline" color={color} />,
        }}
      />
      {/* Pages cachées - accessibles par navigation mais pas dans la barre */}
      <Tabs.Screen
        name="messages"
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
        name="my-patients"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="add-patient"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="appointment-confirm"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="measure-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="ordonnance-create"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="emergency-detail"
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
