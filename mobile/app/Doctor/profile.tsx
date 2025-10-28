import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Image, TouchableOpacity, Alert } from 'react-native';
import PageContainer from '../../components/PageContainer';
import { Ionicons } from '@expo/vector-icons';
import ProfileCard, { ProfileRow } from '../../components/ProfileCard';
import { getProfile, logout, type UserProfile } from '../../utils/api';
import { useRouter, type Href } from 'expo-router';

export default function DoctorProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setError(null);
      const data = await getProfile();
      setProfile(data.user);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter?',
      [
        { text: 'Annuler', onPress: () => {}, style: 'cancel' },
        {
          text: 'Déconnecter',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login' as Href);
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Erreur lors de la déconnexion');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <PageContainer scroll style={styles.container} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Mon Profil</Text>

      <View style={styles.avatarWrap}>
        {profile?.photo ? (
          <Image source={{ uri: profile.photo }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={64} color="#fff" />
          </View>
        )}
        <Text style={styles.name}>{profile?.nom} {profile?.prenom}</Text>
        {!!profile?.email && <Text style={styles.email}>{profile?.email}</Text>}
      </View>

      <ProfileCard title="Informations Professionnelles" onEdit={() => router.push({ pathname: '/Doctor/profile-edit' } as any)}>
        <ProfileRow icon={<Ionicons name="briefcase-outline" size={18} />} label="Spécialité" value={profile?.specialite || '—'} />
        <ProfileRow icon={<Ionicons name="business-outline" size={18} />} label="Hôpital" value={profile?.hopital || '—'} />
      </ProfileCard>

      <View style={{ height: 12 }} />

      <ProfileCard title="Coordonnées" onEdit={() => router.push({ pathname: '/Doctor/profile-edit' } as any)}>
        <ProfileRow icon={<Ionicons name="mail-outline" size={18} />} label="Email" value={profile?.email || '—'} />
        <ProfileRow icon={<Ionicons name="call-outline" size={18} />} label="Téléphone" value={profile?.telephone || '—'} />
        <ProfileRow icon={<Ionicons name="home-outline" size={18} />} label="Adresse" value={profile?.adresse || '—'} />
      </ProfileCard>

      <View style={{ height: 12 }} />

      <ProfileCard title="Sécurité" onEdit={() => router.push({ pathname: '/Doctor/password-change' } as any)}>
        <ProfileRow icon={<Ionicons name="lock-closed-outline" size={18} />} label="Mot de passe" value={'••••••••'} />
      </ProfileCard>

      <View style={{ height: 12 }} />

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, color: '#111827', marginBottom: 12 },
  avatarWrap: { alignItems: 'center', marginBottom: 16 },
  avatarCircle: { width: 96, height: 96, borderRadius: 999, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 96, height: 96, borderRadius: 999, backgroundColor: '#E5E7EB' },
  name: { marginTop: 12, fontSize: 20, color: '#111827' },
  email: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  error: { color: '#DC2626', marginTop: 12 },
  logoutButton: { backgroundColor: '#EF4444', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
