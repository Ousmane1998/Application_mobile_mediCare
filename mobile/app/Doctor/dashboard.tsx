import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/header';
import NavDoctor from '@/components/navDoctor';
import { router } from 'expo-router';

export default function DoctorDashboardScreen() {
  return (
    <View>
    <Header />
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>Tableau de bord</Text>

      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total Patients</Text>
          <Text style={styles.cardValue}>38</Text>
        </View>
        <View style={[styles.card, styles.cardAlert]}>
          <Text style={styles.cardLabel}>Patients avec alertes</Text>
          <Text style={[styles.cardValue, { color: '#EF4444' }]}>5</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔎</Text>
        <TextInput placeholder="Rechercher des patients" style={styles.search} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
        <View style={styles.chipActive}><Text style={styles.chipTextActive}>Tous</Text></View>
        <View style={styles.chip}><Text style={styles.chipText}>Diabète</Text></View>
        <View style={styles.chip}><Text style={styles.chipText}>Hypertension</Text></View>
        <View style={styles.chip}><Text style={styles.chipText}>Alertes</Text></View>
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Alertes Récentes</Text>
        <Text style={styles.link}>Voir tout</Text>
      </View>

      <View style={styles.alertItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>Marie Dupont</Text>
          <Text style={styles.itemSubRed}>Glycémie: 180 mg/dL</Text>
        </View>
        <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
      </View>

      <View style={styles.alertItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>Jean Martin</Text>
          <Text style={styles.itemSubRed}>Tension: 160/100 mmHg</Text>
        </View>
        <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mes Patients</Text>
        <TouchableOpacity onPress={() => router.push('/Doctor/my-patients' as any)}>
          <Text style={styles.link}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.patientItem}>
        <View>
          <Text style={styles.itemName}>Pierre Dubois</Text>
          <Text style={styles.itemSub}>Tension: 120/80 mmHg</Text>
        </View>
      </View>

      <View style={styles.patientItem}>
        <View>
          <Text style={styles.itemName}>Sophie Bernard</Text>
          <Text style={styles.itemSub}>Glycémie: 95 mg/dL</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/Doctor/add-patient')}>
        <Text style={styles.fabText}>Ajouter Patient</Text>
      </TouchableOpacity>
    </ScrollView>
    <NavDoctor />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  title: { marginTop: 12, fontSize: 22, color: '#111827' },
  cardsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  cardAlert: { },
  cardLabel: { color: '#6B7280', fontSize: 12 },
  cardValue: { marginTop: 4, fontSize: 22, color: '#111827' },
  searchWrap: { marginTop: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  search: { flex: 1, paddingVertical: 10 },
  chip: { backgroundColor: '#E5E7EB', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8 },
  chipActive: { backgroundColor: '#2ccdd2', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8 },
  chipText: { color: '#111827' },
  chipTextActive: { color: '#fff' },
  sectionHeader: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, color: '#111827' },
  link: { color: '#2ccdd2' },
  alertItem: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  patientItem: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  itemName: { fontSize: 15, color: '#111827' },
  itemSub: { fontSize: 13, color: '#6B7280' },
  itemSubRed: { fontSize: 13, color: '#EF4444' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2ccdd2', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  fabText: { color: '#fff', fontSize: 14 },
});
