// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import PageContainer from '../../components/PageContainer';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/header';
import { useRouter } from 'expo-router';
import { adminGetStats, adminListUsers, adminSetUserActivation, type AdminStats, type AppUser } from '../../utils/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [changing, setChanging] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await adminGetStats();
        setStats(s);
      } catch (e) {
        // silent fail; keep placeholders
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const list = await adminListUsers();
        setUsers(Array.isArray(list) ? list : []);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const pendingDoctors = users.filter(u => String(u.role) === 'medecin' && !((u as any)?.active === true || String((u as any)?.status || '').toLowerCase() === 'active'));
  const onQuickActivate = async (u: AppUser) => {
    try {
      setChanging(u._id);
      await adminSetUserActivation(u._id, true, 'active');
      // refresh lists and stats
      const [s, list] = await Promise.all([adminGetStats(), adminListUsers()]);
      setStats(s);
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      // ignore for now
    } finally {
      setChanging(null);
    }
  };
  return (
    <PageContainer scroll style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
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
          <Text style={styles.overviewValue}>{typeof stats?.total === 'number' ? stats.total : '-'}</Text>
        </View>
      </View>

      <View style={styles.overviewCard}>
        <View style={styles.overviewIconWrap}>
          <Ionicons name="medkit-outline" size={18} color="#2ccdd2" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.overviewLabel}>Médecins actifs</Text>
          <Text style={styles.overviewValue}>{typeof stats?.medecins === 'number' ? stats.medecins : '-'}</Text>
        </View>
      </View>

      <View style={styles.overviewCard}>
        <View style={styles.overviewIconWrap}>
          <Ionicons name="person-outline" size={18} color="#2ccdd2" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.overviewLabel}>Patients actifs</Text>
          <Text style={styles.overviewValue}>{typeof stats?.patients === 'number' ? stats.patients : '-'}</Text>
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

      {/* Lien vers l'écran d'activation des médecins */}
      <TouchableOpacity style={styles.activationCard} onPress={() => router.push('/Admin/doctors-activation' as any)}>
        <View style={styles.overviewIconWrap}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#2ccdd2" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.overviewLabel}>Validation</Text>
          <Text style={styles.overviewValue}>Activation des Médecins</Text>
        </View>
        {typeof stats?.pendingMedecins === 'number' && stats.pendingMedecins > 0 ? (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{stats.pendingMedecins > 99 ? '99+' : stats.pendingMedecins}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      </TouchableOpacity>

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

      {/* Section médecins en attente d'activation */}
      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>En attente d'activation</Text>
      {pendingDoctors.length === 0 ? (
        <View style={styles.emptyBox}><Text style={styles.emptyText}>Aucun médecin en attente</Text></View>
      ) : (
        <View style={{ gap: 8 }}>
          {pendingDoctors.slice(0, 5).map(u => (
            <View key={u._id} style={styles.pendingRow}>
              <View style={styles.pendingAvatar}><Text style={styles.pendingAvatarText}>{`${(u.prenom||'').charAt(0)}${(u.nom||'').charAt(0)}`.toUpperCase() || '??'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingName}>{u.prenom} {u.nom}</Text>
                <Text style={styles.pendingSub}>{u.email || ''}</Text>
              </View>
              <TouchableOpacity style={styles.quickBtn} disabled={changing===u._id} onPress={() => onQuickActivate(u)}>
                <Ionicons name="checkmark" size={14} color="#fff" />
                <Text style={styles.quickBtnText}>{changing===u._id ? '...' : 'Activer'}</Text>
              </TouchableOpacity>
            </View>
          ))}
          {pendingDoctors.length > 5 && (
            <TouchableOpacity onPress={() => router.push('/Admin/doctors-activation' as any)}>
              <Text style={styles.linkMore}>Voir tout ({pendingDoctors.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </PageContainer>
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
  container: { paddingHorizontal: 16, paddingTop: 12 },
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
  activationCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F3F4F6', marginTop: 10 },
  pendingBadge: { backgroundColor: '#FEE2E2', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 },
  pendingBadgeText: { color: '#DC2626', fontSize: 12, fontWeight: '600' },

  // Pending doctors preview
  emptyBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  emptyText: { color: '#6B7280' },
  pendingRow: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  pendingAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2ccdd2', alignItems: 'center', justifyContent: 'center' },
  pendingAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  pendingName: { color: '#111827' },
  pendingSub: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  quickBtn: { backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  quickBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  linkMore: { color: '#2563EB', marginTop: 6 },

  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2ccdd2', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6 },
});
