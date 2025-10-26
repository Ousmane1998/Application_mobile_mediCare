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
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#10B981' }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Ionicons name="speedometer-outline" color={color} size={60} />,
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
          tabBarIcon: ({ color }) => <BadgeIcon name="notifications-outline" color={color} />,
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
