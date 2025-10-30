import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
 
import { Ionicons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';
import { adminListUsers, adminArchiveUser, adminDeleteUser, adminUpdateUserRole, adminSetUserActivation, type AppUser } from '../../utils/api';

const ROLE_CHIPS = ['Tous', 'patient', 'medecin', 'admin'] as const;

export default function AdminUsersScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<typeof ROLE_CHIPS[number]>('Tous');
  const [changing, setChanging] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const list = await adminListUsers();
      setUsers(Array.isArray(list) ? list : []);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(u => {
      if (roleFilter !== 'Tous' && String(u.role) !== roleFilter) return false;
      if (!q) return true;
      const hay = `${u.nom||''} ${u.prenom||''} ${u.email||''} ${u.telephone||''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, query, roleFilter]);

  const onToggleActivation = async (u: AppUser) => {
    try {
      setChanging(u._id);
      const activeNow = (u as any)?.active === true || String((u as any)?.status || '').toLowerCase() === 'active';
      if (activeNow) {
        await adminSetUserActivation(u._id, false, 'disabled');
      } else {
        await adminSetUserActivation(u._id, true, 'active');
      }
      await load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Mise à jour activation impossible');
    } finally {
      setChanging(null);
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Confirmation', 'Supprimer cet utilisateur ?', [
      { text: 'Annuler' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await adminDeleteUser(id); await load(); } catch (e: any) { Alert.alert('Erreur', e?.message || 'Suppression impossible'); }
      }}
    ]);
  };

  const onArchive = async (id: string) => {
    try { await adminArchiveUser(id); await load(); } catch (e: any) { Alert.alert('Erreur', e?.message || 'Archivage impossible'); }
  };

  const onChangeRole = async (id: string, role: 'patient'|'medecin'|'admin') => {
    try {
      setChanging(id);
      await adminUpdateUserRole(id, role);
      await load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Mise à jour du rôle impossible');
    } finally {
      setChanging(null);
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
      <Text style={styles.title}>Utilisateurs</Text>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔎</Text>
        <TextInput placeholder="Rechercher (nom, email, tel)" style={styles.search} value={query} onChangeText={setQuery} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        {ROLE_CHIPS.map(r => (
          <TouchableOpacity key={r} onPress={() => setRoleFilter(r)}>
            <View style={r === roleFilter ? styles.chipActive : styles.chip}>
              <Text style={r === roleFilter ? styles.chipTextActive : styles.chipText}>{r === 'Tous' ? 'Tous' : r.charAt(0).toUpperCase()+r.slice(1)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.map(u => (
        <View key={u._id} style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.badge}><Ionicons name="person-outline" size={16} color="#111827" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{u.prenom} {u.nom} {u.archived ? '(Archivé)' : ''}</Text>
              <Text style={styles.sub}>{u.email || ''} • {u.telephone || ''}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.role}>{String(u.role).toUpperCase()}</Text>
              {String(u.role) === 'medecin' && (
                <View style={[styles.statusChip, ((u as any)?.active || String((u as any)?.status||'').toLowerCase()==='active') ? styles.statusActive : (String((u as any)?.status||'').toLowerCase()==='disabled' ? styles.statusDisabled : styles.statusPending)]}>
                  <Text style={styles.statusText}>
                    {((u as any)?.active || String((u as any)?.status||'').toLowerCase()==='active') ? 'Actif' : (String((u as any)?.status||'').toLowerCase()==='disabled' ? 'Désactivé' : 'En attente')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.rowActions}>
            <View style={{ flex: 1 }}>
              <RNPickerSelect
                onValueChange={(v) => v && onChangeRole(u._id, v as any)}
                value={String(u.role)}
                items={[{ label: 'Patient', value: 'patient' }, { label: 'Médecin', value: 'medecin' }, { label: 'Admin', value: 'admin' }]}
                useNativeAndroidPickerStyle={false}
                disabled={changing === u._id}
                style={pickerSelectStyles}
              />
            </View>
            {String(u.role) === 'medecin' && (
              <TouchableOpacity disabled={changing===u._id} onPress={() => onToggleActivation(u)}>
                <Text style={[styles.action, { color: '#0ea5e9' }]}>{((u as any)?.active || String((u as any)?.status||'').toLowerCase()==='active') ? 'Désactiver' : 'Activer'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => onArchive(u._id)}>
              <Text style={[styles.action, { color: '#059669' }]}>Archiver</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(u._id)}>
              <Text style={[styles.action, { color: '#EF4444' }]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {error ? <Text style={{ color: '#DC2626', marginTop: 8 }}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 20, color: '#111827', marginBottom: 8 },
  searchWrap: { marginTop: 4, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  search: { flex: 1, paddingVertical: 10 },
  chip: { backgroundColor: '#E5E7EB', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8 },
  chipActive: { backgroundColor: '#10B981', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8 },
  chipText: { color: '#111827' },
  chipTextActive: { color: '#fff' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  badge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB' },
  name: { fontSize: 16, color: '#111827' },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  role: { color: '#111827' },
  statusChip: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, alignSelf: 'flex-end' },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusDisabled: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11, color: '#111827' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  action: { fontWeight: '600' },
});

const pickerSelectStyles = {
  inputIOS: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111827',
  },
  inputAndroid: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111827',
  },
  placeholder: { color: '#9CA3AF' },
} as const;
