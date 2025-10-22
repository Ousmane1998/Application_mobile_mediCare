import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileCard, { ProfileRow } from '../../components/ProfileCard';
import { getProfile, type UserProfile } from '../../utils/api';
import { useRouter, type Href } from 'expo-router';

export default function PatientProfileScreen() {
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

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Mon Profil</Text>

      <View style={styles.avatarWrap}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={64} color="#fff" />
        </View>
        <Text style={styles.name}>{profile?.nom} {profile?.prenom}</Text>
        {!!profile?.email && <Text style={styles.email}>{profile?.email}</Text>}
      </View>

      <ProfileCard title="Informations Personnelles" onEdit={() => router.push({ pathname: '/Patient/profile-edit' } as any)}>
        <ProfileRow icon={<Ionicons name="person-outline" size={18} />} label="Nom complet" value={`${profile?.nom || ''} ${profile?.prenom || ''}`} />
        <ProfileRow icon={<Ionicons name="call-outline" size={18} />} label="Téléphone" value={profile?.telephone || '—'} />
        <ProfileRow icon={<Ionicons name="home-outline" size={18} />} label="Adresse" value={profile?.adresse || '—'} />
      </ProfileCard>

      <View style={{ height: 12 }} />

      <ProfileCard title="Sécurité" onEdit={() => router.push({ pathname: '/Patient/password-change' } as any)}>
        <ProfileRow icon={<Ionicons name="lock-closed-outline" size={18} />} label="Mot de passe" value={'••••••••'} />
      </ProfileCard>

      <View style={{ height: 12 }} />

      <ProfileCard title="Informations Médicales">
        <ProfileRow icon={<Ionicons name="medkit-outline" size={18} />} label="Maladies chroniques" value={'—'} />
        <ProfileRow icon={<Ionicons name="bandage-outline" size={18} />} label="Allergies" value={'—'} />
        <ProfileRow icon={<Ionicons name="water-outline" size={18} />} label="Groupe sanguin" value={'—'} />
        <ProfileRow icon={<Ionicons name="people-outline" size={18} />} label="Contact d'urgence" value={'—'} />
      </ProfileCard>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', padding: 16 },
  title: { fontSize: 18, color: '#111827', marginBottom: 12 },
  avatarWrap: { alignItems: 'center', marginBottom: 16 },
  avatarCircle: { width: 96, height: 96, borderRadius: 999, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  name: { marginTop: 12, fontSize: 20, color: '#111827' },
  email: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  error: { color: '#DC2626', marginTop: 12 },
});
