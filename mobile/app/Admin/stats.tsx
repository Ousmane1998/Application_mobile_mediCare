import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { adminGetStats, type AdminStats } from '../../utils/api';

export default function AdminStatsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const load = async () => {
    try {
      setError(null);
      const s = await adminGetStats();
      setStats(s);
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
      <Text style={styles.title}>Statistiques</Text>

      <View style={styles.cardsRow}>
        <View style={styles.card}><Text style={styles.label}>Total</Text><Text style={styles.value}>{stats?.total ?? 0}</Text></View>
        <View style={styles.card}><Text style={styles.label}>Patients</Text><Text style={styles.value}>{stats?.patients ?? 0}</Text></View>
      </View>
      <View style={styles.cardsRow}>
        <View style={styles.card}><Text style={styles.label}>Médecins</Text><Text style={styles.value}>{stats?.medecins ?? 0}</Text></View>
        <View style={styles.card}><Text style={styles.label}>Admins</Text><Text style={styles.value}>{stats?.admins ?? 0}</Text></View>
      </View>

      {error ? <Text style={{ color: '#DC2626', marginTop: 8 }}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 20, color: '#111827', marginBottom: 12 },
  cardsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  label: { color: '#6B7280', fontSize: 12 },
  value: { marginTop: 6, fontSize: 22, color: '#111827' },
});
