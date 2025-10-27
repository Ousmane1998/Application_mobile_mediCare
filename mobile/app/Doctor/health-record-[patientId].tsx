import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { listHealthRecords, type HealthRecord } from '../../utils/api';

export default function DoctorPatientHealthRecordScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rec, setRec] = useState<HealthRecord | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const list = await listHealthRecords();
        const r = (Array.isArray(list) ? list : []).find((f: any) => String((f.patient?._id)||f.patient) === String(patientId));
        setRec(r || null);
      } catch (e: any) {
        setError(e?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId]);

  if (loading) return (<View style={styles.center}><ActivityIndicator /></View>);
  if (error || !rec) return (<View style={styles.center}><Text style={{ color: '#DC2626' }}>{error || 'Fiche introuvable'}</Text></View>);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>Fiche de santé du patient</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Groupe sanguin</Text>
        <Text style={styles.value}>{rec.groupeSanguin || '—'}</Text>

        <Text style={[styles.label, { marginTop: 8 }]}>Dernière mise à jour</Text>
        <Text style={styles.value}>{rec.derniereMiseAJour ? new Date(rec.derniereMiseAJour).toLocaleString() : '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Allergies</Text>
        {(rec.allergies && rec.allergies.length > 0) ? rec.allergies.map((a, i) => (
          <Text key={`${a}_${i}`} style={styles.item}>• {a}</Text>
        )) : <Text style={styles.itemMuted}>Aucune</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Maladies</Text>
        {(rec.maladies && rec.maladies.length > 0) ? rec.maladies.map((m, i) => (
          <Text key={`${m}_${i}`} style={styles.item}>• {m}</Text>
        )) : <Text style={styles.itemMuted}>Aucune</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Traitements</Text>
        {(rec.traitements && rec.traitements.length > 0) ? rec.traitements.map((t, i) => (
          <Text key={`${t}_${i}`} style={styles.item}>• {t}</Text>
        )) : <Text style={styles.itemMuted}>Aucun</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Antécédents</Text>
        {(rec.antecedents && rec.antecedents.length > 0) ? rec.antecedents.map((t, i) => (
          <Text key={`${t}_${i}`} style={styles.item}>• {t}</Text>
        )) : <Text style={styles.itemMuted}>Aucun</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16, marginBottom: 40, marginTop: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, color: '#111827', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  label: { color: '#6B7280' },
  value: { color: '#111827', fontSize: 16 },
  section: { color: '#111827', fontWeight: '600', marginBottom: 6 },
  item: { color: '#374151', marginTop: 4 },
  itemMuted: { color: '#6B7280' },
});
