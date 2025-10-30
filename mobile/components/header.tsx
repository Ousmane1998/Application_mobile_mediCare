// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Modal, Text } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { getProfile } from '../utils/api';
import { useAppTheme } from '../theme/ThemeContext';
import Snackbar from './Snackbar';
import { type UserProfile } from '../utils/api';

export default function Header() {
  const router = useRouter();
  const { theme, toggle, setMode } = useAppTheme();
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  });
  const [themePickerOpen, setThemePickerOpen] = useState(false);

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

  const canGoBack = typeof (navigation as any)?.canGoBack === 'function' ? (navigation as any).canGoBack() : false;

  return (
    <View style={[styles.topBar, { backgroundColor: theme.colors.card }]}>
      {/* Gauche: bouton retour si possible, sinon logo - largeur fixe pour éviter le débordement */}
      <View style={{ width: 40, height: 40, justifyContent: 'center' }}>
        {canGoBack ? (
          <TouchableOpacity onPress={() => (navigation as any).goBack?.()} accessibilityLabel="Retour">
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        ) : (
          <Image
            source={require('../assets/images/logoMedicare.png')}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
        )}
      </View>

      {/* Icônes à droite */}
      <View style={styles.iconContainer}>

        {/* Dark/Light mode toggle */}
        <TouchableOpacity onPress={toggle} onPress={() => setThemePickerOpen(true)}>
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

      <Modal visible={themePickerOpen} transparent animationType="fade" onRequestClose={() => setThemePickerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: '80%', backgroundColor: theme.colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.colors.border }}>
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 12 }}>Mode d'affichage</Text>
            {([
              { key: 'system', label: 'Système' },
              { key: 'light', label: 'Clair' },
              { key: 'dark', label: 'Sombre' },
            ] as const).map(opt => (
              <TouchableOpacity key={opt.key} onPress={() => { setMode(opt.key); setThemePickerOpen(false); }} style={{ paddingVertical: 10 }}>
                <Text style={{ color: theme.colors.text }}>
                  {opt.label} {theme.mode === opt.key ? '✓' : ''}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setThemePickerOpen(false)} style={{ marginTop: 8, alignSelf: 'flex-end' }}>
              <Text style={{ color: theme.colors.primary }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 40,
    minHeight: 56,
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
  centerLogoWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
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