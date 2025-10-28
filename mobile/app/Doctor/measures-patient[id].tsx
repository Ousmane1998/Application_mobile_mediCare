import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert, TouchableOpacity } from 'react-native';
import PageContainer from '../../components/PageContainer';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getMeasureById } from '../../utils/api';

export default function DoctorMeasureDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [measure, setMeasure] = useState<any | null>(null);

  const load = async () => {
    try {
      setError(null);
      if (!id) throw new Error('Identifiant manquant');
      const res = await getMeasureById(String(id));
      setMeasure(res?.measure || null);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !measure) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text style={{ color: '#DC2626', marginBottom: 8 }}>{error || 'Mesure introuvable'}</Text>
        <Text onPress={() => router.back()} style={{ color: '#2563EB' }}>Retour</Text>
      </View>
    );
  }

  const when = measure.date || measure.createdAt;
  return (
    <PageContainer scroll style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Détail de la mesure</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Type</Text>
        <Text style={styles.value}>{String(measure.type || '').toUpperCase()}</Text>

        <Text style={[styles.label, { marginTop: 8 }]}>Valeur</Text>
        <Text style={styles.value}>{String(measure.value)}</Text>

        <Text style={[styles.label, { marginTop: 8 }]}>Date</Text>
        <Text style={styles.value}>{when ? new Date(when).toLocaleString() : '—'}</Text>
      </View>

      {measure.patientId ? (
        <View style={styles.card}>
          <Text style={styles.label}>Patient</Text>
          <Text style={styles.value}>{(measure.patientId?.prenom || '') + ' ' + (measure.patientId?.nom || '')}</Text>
          <Text style={styles.sub}>{String(measure.patientId?._id || measure.patientId)}</Text>
        </View>
      ) : null}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 20, color: '#111827', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  label: { color: '#6B7280' },
  value: { color: '#111827', fontSize: 16 },
  sub: { color: '#6B7280', marginTop: 4 },
});
