import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileCard, { ProfileRow } from '../../components/ProfileCard';
import { getProfile, type UserProfile } from '../../utils/api';

export default function DoctorProfileScreen() {
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

      <ProfileCard title="Informations Professionnelles">
        <ProfileRow icon={<Ionicons name="briefcase-outline" size={18} />} label="Spécialité" value={profile?.specialite || '—'} />
        <ProfileRow icon={<Ionicons name="business-outline" size={18} />} label="Hôpital" value={profile?.hopital || '—'} />
      </ProfileCard>

      <View style={{ height: 12 }} />

      <ProfileCard title="Coordonnées">
        <ProfileRow icon={<Ionicons name="mail-outline" size={18} />} label="Email" value={profile?.email || '—'} />
        <ProfileRow icon={<Ionicons name="call-outline" size={18} />} label="Téléphone" value={profile?.telephone || '—'} />
        <ProfileRow icon={<Ionicons name="home-outline" size={18} />} label="Adresse" value={profile?.adresse || '—'} />
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
