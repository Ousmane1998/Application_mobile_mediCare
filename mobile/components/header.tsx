import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getProfile, getNotifications } from '../utils/api';
import Snackbar from './Snackbar';
import { type UserProfile } from '../utils/api';

export default function Header() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const loadNotifications = async (userId: string) => {
    try {
      const notifs = await getNotifications(userId);
      const unread = (Array.isArray(notifs) ? notifs : []).filter(n => !n.isRead).length;
      setUnreadCount(unread);
      console.log('🔔 Notifications non lues:', unread);
    } catch (e: any) {
      console.error('❌ Erreur chargement notifications:', e);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        const u = data.user as UserProfile;
        setProfile(u);
        
        // Charger les notifications
        const userId = (u as any)._id || (u as any).id;
        await loadNotifications(userId);
        
        setSnack({ visible: true, message: 'Profil chargé avec succès', type: 'success' });
      } catch (e: any) {
        setSnack({ visible: true, message: e?.message || 'Erreur de chargement', type: 'error' });
      }
    })();
  }, []);

  return (
    <View style={styles.topBar}>
      {/* Logo à gauche */}
      <Image
        source={require('../assets/images/logoMedicare.png')}
        style={{ width: 50, height: 50 }}
        resizeMode="contain"
      />

      {/* Icônes à droite */}
      <View style={styles.iconContainer}>
        <TouchableOpacity onPress={() => {
          const role = profile?.role;
          if (role === 'medecin') return router.push('/Doctor/notifications' as any);
          if (role === 'patient') return router.push('/Patient/notifications' as any);
          if (role === 'admin') return router.push('/Admin/notifications' as any);
        }}>
          <View style={styles.notificationContainer}>
            <Ionicons name="notifications-outline" size={24} color="black" style={styles.icon} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const role = profile?.role;
            if (role === 'medecin') return router.push('/Doctor/profile' as any);
            if (role === 'patient') return router.push('/Patient/profile' as any);
            if (role === 'admin') return router.push('/Admin/profile' as any);
          }}
        >
          <Ionicons name="person-circle-outline" size={26} color="black" style={styles.icon} />
        </TouchableOpacity>
      </View>

      <Snackbar
        visible={snack.visible}
        message={snack.message}
        type={snack.type}
        onHide={() => setSnack((s) => ({ ...s, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginLeft: 12,
  },
  notificationContainer: {
    position: 'relative',
    marginLeft: 12,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});