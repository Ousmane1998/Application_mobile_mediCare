import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Header from '../../components/header';
import { useRouter } from 'expo-router';

export default function PatientDashboardScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
     <Header />

      <Text style={styles.greeting}>Bonjour, Patient!</Text>
      <Text style={styles.sectionTitle}>Vos dernières mesures</Text>
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="trending-up-outline" size={24} color="green" />
          <Text style={styles.cardTitle}>Glycémie</Text>
        </View>
        <Text style={styles.bigValue}>120 mg/dL</Text>
        <Text style={styles.statusOk}>Stable</Text>
        <TouchableOpacity style={styles.smallBtn} onPress={() => router.push('/Patient/measure-add')}><Text style={styles.smallBtnText}>Ajouter</Text></TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="trending-up-outline" size={24} color="green" />
          <Text style={styles.cardTitle}>Pression Artérielle</Text>
        </View>
        <Text style={styles.bigValue}>130/85 mmHg</Text>
        <Text style={styles.statusWarn}>Légère hausse</Text>
        <TouchableOpacity style={styles.smallBtn} onPress={() => router.push('/Patient/measure-add')}><Text style={styles.smallBtnText}>Ajouter</Text></TouchableOpacity>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Vos prochains médicaments</Text>
        <Text style={styles.blockLine}>Insuline - 8h00</Text>
        <Text style={styles.blockLine}>Lisinopril - 9h00</Text>
        <TouchableOpacity style={styles.blockBtn}><Text style={styles.blockBtnText}>Voir tout</Text></TouchableOpacity>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Prochain rendez-vous</Text>
        <Text style={styles.blockLine}>Dr. Martin - 15/05/2024 à 10h30</Text>
        <Text style={styles.blockLine}>Hôpital Central, 123 Rue de la Santé</Text>
        <TouchableOpacity style={styles.blockBtn} onPress={() => router.push('/Patient/appointment-new')}><Text style={styles.blockBtnText}>Prendre rendez-vous</Text></TouchableOpacity>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Messages</Text>
        <Text style={styles.blockLine}>
          Nouveau message du Dr. Dubois
        </Text>
        <Text style={[styles.blockLine, { fontStyle: 'italic', color: '#6B7280' }]}>"Bonjour, n'oubliez pas de prendre votre tension demain matin."</Text>
        <TouchableOpacity style={styles.blockBtn} onPress={() => router.push('/Patient/chat')}><Text style={styles.blockBtnText}>Ouvrir le chat</Text></TouchableOpacity>
      </View>

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menu: { fontSize: 22, color: '#111827' },
  greeting: { marginTop: 16, fontSize: 24, color: '#111827' },
  sectionTitle: { marginTop: 16, marginBottom: 8, fontSize: 16, color: '#111827' },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIcon: { fontSize: 16 },
  cardTitle: { fontSize: 14, color: '#111827' },
  bigValue: { marginTop: 8, fontSize: 18, color: '#111827' },
  statusOk: { marginTop: 4, color: '#10B981' },
  statusWarn: { marginTop: 4, color: '#F59E0B' },
  smallBtn: { alignSelf: 'flex-end', backgroundColor: '#E5E7EB', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, marginTop: 8 },
  smallBtnText: { color: '#111827' },

  block: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 12 },
  blockTitle: { fontSize: 16, color: '#111827', marginBottom: 8 },
  blockLine: { color: '#111827', marginBottom: 4 },
  blockBtn: { marginTop: 8, backgroundColor: '#D1FAE5', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  blockBtnText: { color: '#065F46' },
});
