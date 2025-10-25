import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { getProfile, getAppointments, updateAppointment, type AppointmentItem } from '../../utils/api';

export default function PatientAppointmentsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meId, setMeId] = useState<string | null>(null);
  const [items, setItems] = useState<AppointmentItem[]>([]);

  const badge = (s?: string) => {
    const k = String(s||'').toLowerCase();
    const map: any = { en_attente: '#F59E0B', confirme: '#10B981', annule: '#EF4444' };
    const col = map[k] || '#6B7280';
    return <Text style={[styles.badge, { backgroundColor: col }]}>{String(s||'').toUpperCase()}</Text>;
  };

  const cancel = async (id: string) => {
    try { await updateAppointment(id, { statut: 'annule' }); await load(); }
    catch (e: any) { Alert.alert('Erreur', e?.message || "Impossible d'annuler"); }
  };

  const reschedule = async (a: AppointmentItem) => {
    Alert.alert('Reprogrammer', "Cette action nécessite une UI dédiée (date/heure). Dites-moi si je l'ajoute.");
  };

  const load = async () => {
    try {
      const prof = await getProfile();
      const id = (prof.user as any)._id || (prof.user as any).id;
      setMeId(id);
      const all = await getAppointments();
      const mine = (Array.isArray(all) ? all : []).filter(a => String((a.patientId as any)?._id || a.patientId) === String(id));
      mine.sort((a,b)=> new Date(`${a.date} ${a.heure||'00:00'}`).getTime() - new Date(`${b.date} ${b.heure||'00:00'}`).getTime());
      setItems(mine);
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

  const now = Date.now();
  const upcoming = items.filter(a => new Date(`${a.date} ${a.heure||'00:00'}`).getTime() >= now);
  const past = items.filter(a => new Date(`${a.date} ${a.heure||'00:00'}`).getTime() < now).reverse();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Rendez-vous</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>À venir</Text>
        {upcoming.length === 0 && <Text style={styles.textMuted}>Aucun rendez-vous à venir</Text>}
        {upcoming.map((a,i) => (
          <View key={(a._id||i).toString()} style={styles.rowBetween}>
            <Text style={styles.text}>{a.date} • {a.heure || ''} • {(a.medecinId as any)?.nom || 'Médecin'}</Text>
            {badge(a.statut)}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => cancel(a._id)}><Text style={[styles.action, { color: '#EF4444' }]}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => reschedule(a)}><Text style={[styles.action, { color: '#2563EB' }]}>Reprogrammer</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Passés</Text>
        {past.length === 0 && <Text style={styles.textMuted}>Aucun rendez-vous passé</Text>}
        {past.map((a,i) => (
          <View key={(a._id||i).toString()} style={styles.rowBetween}>
            <Text style={styles.text}>{a.date} • {a.heure || ''} • {(a.medecinId as any)?.nom || 'Médecin'}</Text>
            {badge(a.statut)}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, color: '#111827', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, color: '#111827', marginBottom: 6 },
  text: { color: '#374151', marginBottom: 4 },
  textMuted: { color: '#6B7280', marginBottom: 4, fontStyle: 'italic' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 },
  badge: { color: '#fff', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, overflow: 'hidden' },
  action: { fontWeight: '600' },
  btn: { marginTop: 8, backgroundColor: '#2ccdd2', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff' },
});
