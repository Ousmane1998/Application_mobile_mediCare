import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PatientMeasuresScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>Mesures</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="bar-chart-outline" size={22} color="#111827" />
          <Text style={styles.cardTitle}>Ajouter une mesure</Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/Patient/measure-add')}>
          <Text style={styles.primaryBtnText}>Nouvelle mesure</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Historique</Text>
        <Text style={styles.text}>Bientôt: liste des mesures enregistrées…</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, color: '#111827', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, color: '#111827' },
  text: { color: '#374151', marginTop: 6 },
  primaryBtn: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
});
