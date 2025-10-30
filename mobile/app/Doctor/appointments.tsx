// @ts-nocheck
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAppointments, updateAppointment, type AppointmentItem, getProfile } from '../../utils/api';

export default function DoctorAppointmentsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [filter, setFilter] = useState<'en_attente'|'confirme'|'annule'|'all'>('en_attente');
  const [me, setMe] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const prof = await getProfile();
      setMe(prof.user);
      const data = await getAppointments();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Chargement impossible');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const base = Array.isArray(items) ? items : [];
    const mine = base.filter(a => String((a.medecinId?._id)||a.medecinId) === String((me?._id)||me?.id));
    if (filter === 'all') return mine;
    return mine.filter(a => a.statut === filter);
  }, [items, filter, me]);

  const onAction = async (id: string, statut: 'confirme'|'annule') => {
    try {
      const idx = items.findIndex(a => a._id === id);
      const prev = items[idx];
      const optimistic = [...items];
      if (idx >= 0) optimistic[idx] = { ...prev, statut } as any;
      setItems(optimistic);
      await updateAppointment(id, { statut });
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Action impossible');
      load();
    }
  };

  const renderItem = ({ item }: { item: AppointmentItem }) => {
    const date = new Date(item.date);
    const d = date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
    const patientName = `${item.patientId?.prenom || ''} ${item.patientId?.nom || ''}`.trim() || (item.patientId?._id || '');
    const awaiting = item.statut === 'en_attente';
    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.rowCenter}>
            <View style={[styles.badgeDate, item.statut==='confirme' && { backgroundColor: '#ECFDF5' }, item.statut==='annule' && { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.badgeText, item.statut==='confirme' && { color: '#059669' }, item.statut==='annule' && { color: '#DC2626' }]}>{d}</Text>
            </View>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarInitialsSmall}>
                {`${(item.patientId?.prenom||'').charAt(0)}${(item.patientId?.nom||'').charAt(0)}`.toUpperCase() || '??'}
              </Text>
            </View>
            <View>
              <Text style={styles.title}>{patientName}</Text>
              <Text style={styles.sub}>{item.heure ? `${item.heure} • ` : ''}{item.typeConsultation || 'Consultation'}</Text>
            </View>
          </View>
          <View style={[styles.statut, item.statut==='confirme' && styles.statutOk, item.statut==='annule' && styles.statutKo]}>
            <Text style={[styles.statutText, item.statut==='confirme' && { color: '#059669' }, item.statut==='annule' && { color: '#DC2626' }]}>{item.statut}</Text>
          </View>
        </View>
        {awaiting && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={() => onAction(item._id, 'annule')}>
              <Ionicons name="close" size={16} color="#fff" />
              <Text style={styles.btnText}>Rejeter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={() => onAction(item._id, 'confirme')}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.btnText}>Accepter</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {['en_attente','confirme','annule','all'].map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f as any)} style={[styles.filterChip, filter===f && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter===f && styles.filterTextActive]}>{f === 'all' ? 'Tous' : f.replace('_',' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(it) => String(it._id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={() => (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: '#6B7280' }}>Aucun rendez-vous</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filters: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 },
  filterChip: { backgroundColor: '#E5E7EB', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  filterChipActive: { backgroundColor: '#111827' },
  filterText: { color: '#111827' },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badgeDate: { minWidth: 70, backgroundColor: '#FEF3C7', borderRadius: 10, paddingVertical: 6, alignItems: 'center', marginRight: 8 },
  badgeText: { color: '#B45309', fontSize: 12 },
  avatarSmall: { width: 28, height: 28, borderRadius: 999, backgroundColor: '#2ccdd2', alignItems: 'center', justifyContent: 'center' },
  avatarInitialsSmall: { color: '#fff', fontSize: 12, fontWeight: '700' },
  title: { color: '#111827' },
  sub: { color: '#6B7280', marginTop: 2 },
  statut: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#E5E7EB' },
  statutOk: { backgroundColor: '#D1FAE5' },
  statutKo: { backgroundColor: '#FEE2E2' },
  statutText: { color: '#111827', textTransform: 'capitalize' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'flex-end' },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  btnAccept: { backgroundColor: '#059669' },
  btnReject: { backgroundColor: '#DC2626' },
  btnText: { color: '#fff' },
});
