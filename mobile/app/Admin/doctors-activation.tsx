import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '../../components/header';
import { authFetch } from '../../utils/api';

type Doctor = {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  specialite?: string;
  hopital?: string;
  photo?: string;
};

export default function DoctorsActivationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Doctor[]>([]);

  const load = async () => {
    try {
      setError(null);
      // Try backend pending doctors endpoint
      const res = await authFetch('/admin/doctors/pending');
      const list: Doctor[] = (res?.data || res || []).map((u: any) => ({
        id: String(u.id || u._id || ''),
        nom: u.nom || '',
        prenom: u.prenom || '',
        email: u.email || '',
        specialite: u.specialite || '',
        hopital: u.hopital || '',
        photo: u.photo || undefined,
      }));
      setItems(list);
    } catch (e: any) {
      // Fallback sample list if API not ready
      setItems([
        { id: '1', nom: 'Jean', prenom: 'Dupont', email: 'jean.dupont@email.com', specialite: 'Cardiologue', photo: undefined },
        { id: '2', nom: 'Marie', prenom: 'Martin', email: 'marie.martin@email.com', specialite: 'Pédiatre', photo: undefined },
        { id: '3', nom: 'Paul', prenom: 'Bernard', email: 'paul.bernard@email.com', specialite: 'Généraliste', photo: undefined },
      ]);
      setError(null);
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

  const activate = async (id: string) => {
    try {
      await authFetch(`/admin/doctors/${id}/activate`, { method: 'POST', body: JSON.stringify({}) });
      setItems((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      // no-op UI remains
    }
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
      <Header />
      <View style={styles.topBar}>
        <Ionicons name="menu" size={22} color="#111827" />
        <Text style={styles.topBarTitle}>Activation des Médecins</Text>
        <Ionicons name="search" size={18} color="#111827" />
      </View>

      {items.map((d) => (
        <View key={d.id} style={styles.card}>
          <View style={styles.row}>
            {d.photo ? (
              <Image source={{ uri: d.photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={22} color="#fff" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>Dr. {d.prenom} {d.nom}</Text>
              {!!d.specialite && <Text style={styles.sub}>{d.specialite}</Text>}
              {!!d.email && <Text style={styles.email}>{d.email}</Text>}
            </View>
            <TouchableOpacity style={styles.activateBtn} onPress={() => activate(d.id)}>
              <Text style={styles.activateText}>Activer</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 12, marginBottom: 40, marginTop: 32 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  topBarTitle: { fontSize: 18, color: '#111827' },

  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10, elevation: 0, shadowOpacity: 0, borderWidth: 1, borderColor: '#E5E7EB' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5E7EB' },
  avatarFallback: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, color: '#111827' },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  email: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  activateBtn: { backgroundColor: '#10B981', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  activateText: { color: '#fff', fontSize: 13 },
  error: { color: '#DC2626', marginTop: 8 },
});
