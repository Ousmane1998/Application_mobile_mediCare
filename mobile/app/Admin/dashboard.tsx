import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/header';

export default function AdminDashboard() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Top bar */}
      <Header />

      {/* Aperçu du système */}
      <Text style={styles.sectionTitle}>Aperçu du Système</Text>

      <View style={styles.overviewCard}>
        <View style={styles.overviewIconWrap}>
          <Ionicons name="people-outline" size={18} color="#2ccdd2" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.overviewLabel}>Total Utilisateurs</Text>
          <Text style={styles.overviewValue}>1,234</Text>
        </View>
      </View>

      <View style={styles.overviewCard}>
        <View style={styles.overviewIconWrap}>
          <Ionicons name="medkit-outline" size={18} color="#2ccdd2" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.overviewLabel}>Médecins actifs</Text>
          <Text style={styles.overviewValue}>123</Text>
        </View>
      </View>

      <View style={styles.overviewCard}>
        <View style={styles.overviewIconWrap}>
          <Ionicons name="person-outline" size={18} color="#2ccdd2" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.overviewLabel}>Patients actifs</Text>
          <Text style={styles.overviewValue}>1,111</Text>
        </View>
      </View>

      {/* Gestion des utilisateurs */}
      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Gestion des Utilisateurs</Text>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color="#9CA3AF" />
        <TextInput
          placeholder="Rechercher un utilisateur..."
          placeholderTextColor="#9CA3AF"
          style={styles.search}
        />
      </View>

      <View style={styles.chipsRow}>
        <View style={styles.chipActive}><Text style={styles.chipTextActive}>Tous</Text></View>
        <View style={styles.chip}><Text style={styles.chipText}>Médecins</Text></View>
        <View style={styles.chip}><Text style={styles.chipText}>Patients</Text></View>
      </View>

      {/* Liste d’utilisateurs */}
      <UserItem name="Dr. Jean Dupont" role="Médecin" />
      <UserItem name="Marie Martin" role="Patient" />
      <UserItem name="Pierre Dubois" role="Patient" />
      <UserItem name="Dr. Sophie Leroy" role="Médecin" />

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

function UserItem({ name, role }: { name: string; role: string }) {
  return (
    <View style={styles.userItem}>
      <View style={styles.userAvatar}><Text style={{ color: '#065F46' }}>{name.split(' ')[0][0]}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.userName}>{name}</Text>
        <Text style={styles.userRole}>{role}</Text>
      </View>
      <TouchableOpacity style={styles.iconBtn}>
        <Ionicons name="create-outline" size={18} color="#6B7280" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn}>
        <Ionicons name="trash-outline" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  topBarTitle: { fontSize: 16, color: '#111827' },

  sectionTitle: { marginTop: 8, marginBottom: 8, fontSize: 16, color: '#111827' },

  overviewCard: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  overviewIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D1FAE5' },
  overviewLabel: { color: '#6B7280', fontSize: 12 },
  overviewValue: { color: '#111827', fontSize: 22 },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  search: { flex: 1, color: '#111827' },

  chipsRow: { flexDirection: 'row', gap: 8, marginVertical: 10 },
  chip: { backgroundColor: '#E5E7EB', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  chipActive: { backgroundColor: '#2ccdd2', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  chipText: { color: '#111827' },
  chipTextActive: { color: '#fff' },

  userItem: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 15, color: '#111827' },
  userRole: { fontSize: 13, color: '#6B7280' },
  iconBtn: { padding: 6 },

  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2ccdd2', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6 },
});
