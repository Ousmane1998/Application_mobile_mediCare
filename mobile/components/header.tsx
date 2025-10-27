import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getProfile } from '../utils/api';
import { useAppTheme } from '../theme/ThemeContext';
import Snackbar from './Snackbar';
import { type UserProfile } from '../utils/api';

export default function Header() {
  const router = useRouter();
  const { theme, toggle } = useAppTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        const u = data.user as UserProfile;
        setProfile(u);
        setSnack({ visible: true, message: 'Profil chargé avec succès', type: 'success' });
      } catch (e: any) {
        setSnack({ visible: true, message: e?.message || 'Erreur de chargement', type: 'error' });
      }
    })();
  }, []);

  return (
    <View style={[styles.topBar, { backgroundColor: theme.colors.card }]}>
      {/* Logo à gauche */}
      <Image
        source={require('../assets/images/logoMedicare.png')}
        style={{ width: 50, height: 50 }}
        resizeMode="contain"
      />

      {/* Icônes à droite */}
      <View style={styles.iconContainer}>

        {/* Dark/Light mode toggle */}
        <TouchableOpacity onPress={toggle}>
          <Ionicons name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'} size={22} color={theme.colors.text} style={styles.icon} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          const role = profile?.role;
          if (role === 'medecin') return router.push('/Doctor/notifications' as any);
          if (role === 'patient') return router.push('/Patient/notifications' as any);
          if (role === 'admin') return router.push('/Admin/notifications' as any);
        }}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text} style={styles.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const role = profile?.role;
            if (role === 'medecin') return router.push('/Doctor/profile' as any);
            if (role === 'patient') return router.push('/Patient/profile' as any);
            if (role === 'admin') return router.push('/Admin/profile' as any);
          }}
        >
          <Ionicons name="person-circle-outline" size={26} color={theme.colors.text} style={styles.icon} />
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
});