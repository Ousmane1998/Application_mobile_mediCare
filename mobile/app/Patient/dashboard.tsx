// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import Header from '../../components/header';
import { useRouter } from 'expo-router';
import NavPatient from '../../components/navPatient';
import { getProfile, getMeasuresHistory, getAppointments, getMessages, getNotifications, type AppointmentItem } from '../../utils/api';

export default function PatientDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meId, setMeId] = useState<string | null>(null);
  const [meName, setMeName] = useState<string>('');
  const [latest, setLatest] = useState<Record<string, any>>({});
  const [nextAppt, setNextAppt] = useState<AppointmentItem | null>(null);
  const [recentMsg, setRecentMsg] = useState<any | null>(null);
  const [unread, setUnread] = useState<number>(0);

  const load = async () => {
    try {
      const prof = await getProfile();
      const id = (prof.user as any)._id || (prof.user as any).id;
      setMeId(id);
      const fullName = `${prof.user?.prenom || ''} ${prof.user?.nom || ''}`.trim();
      setMeName(fullName);
      const history = await getMeasuresHistory(id);
      const byType: Record<string, any> = {};
      (Array.isArray(history) ? history : []).forEach((m: any) => {
        const t = String(m.type || '').toLowerCase();
        const cur = byType[t];
        const time = new Date(m.date || m.createdAt || Date.now()).getTime();
        if (!cur || time > cur._ts) byType[t] = { ...m, _ts: time };
      });
      setLatest(byType);
      const appts = await getAppointments();
      const myAppts = (Array.isArray(appts) ? appts : []).filter(a => String((a.patientId as any)?._id || a.patientId) === String(id));
      const future = myAppts.filter(a => new Date(`${a.date} ${a.heure || '00:00'}`).getTime() >= Date.now());
      future.sort((a,b)=> new Date(`${a.date} ${a.heure||'00:00'}`).getTime() - new Date(`${b.date} ${b.heure||'00:00'}`).getTime());
      setNextAppt(future[0] || null);
      const msgs = await getMessages();
      const listMsgs = Array.isArray(msgs) ? msgs : [];
      const myMsgs = listMsgs.filter((m: any) => [String(m.senderId), String(m.receiverId)].includes(String(id)));
      myMsgs.sort((a: any,b: any)=> new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setRecentMsg(myMsgs[0] || null);
      const notifs = await getNotifications(id);
      const unreadCount = (Array.isArray(notifs) ? notifs : []).filter(n => !n.isRead).length;
      setUnread(unreadCount);
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

  const gly = latest['glycemie'];
  const tens = latest['tension'];

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2ccdd2" />
        <Text style={{ marginTop: 8, color: '#6B7280' }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View>
      <Header />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={styles.greeting}>Bonjour, {meName || 'Patient'}!</Text>
        <Text style={styles.sectionTitle}>Vos dernières mesures</Text>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="trending-up-outline" size={24} color="green" />
            <Text style={styles.cardTitle}>Glycémie</Text>
          </View>
          <Text style={styles.bigValue}>{gly?.value ? `${gly.value}` : '—'}</Text>
          <Text style={styles.statusOk}>{gly?._ts ? new Date(gly._ts).toLocaleString() : 'Aucune donnée'}</Text>
          <TouchableOpacity style={styles.smallBtn} onPress={() => router.push('/Patient/measure-add')}>
            <Text style={styles.smallBtnText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="trending-up-outline" size={24} color="green" />
            <Text style={styles.cardTitle}>Pression Artérielle</Text>
          </View>
          <Text style={styles.bigValue}>{tens?.value ? `${tens.value}` : '—'}</Text>
          <Text style={styles.statusWarn}>{tens?._ts ? new Date(tens._ts).toLocaleString() : 'Aucune donnée'}</Text>
          <TouchableOpacity style={styles.smallBtn} onPress={() => router.push('/Patient/measure-add')}><Text style={styles.smallBtnText}>Ajouter</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.findStructureBtn} onPress={() => router.push('/Patient/find-structure')}>
          <Ionicons name="location-outline" size={20} color="#2ccdd2" style={{ marginRight: 8 }} />
          <Text style={styles.findStructureText}>Trouver une structure sanitaire</Text>
        </TouchableOpacity>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Prochain rendez-vous</Text>
          <Text style={styles.blockLine}>{nextAppt ? `${(nextAppt as any).medecinId?.nom || 'Médecin'} - ${nextAppt.date} à ${nextAppt.heure || ''}` : 'Aucun prochain rendez-vous'}</Text>
          <TouchableOpacity style={styles.blockBtn} onPress={() => router.push('/Patient/appointment-new')}><Text style={styles.blockBtnText}>Prendre rendez-vous</Text></TouchableOpacity>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Messages</Text>
          <Text style={styles.blockLine}>{recentMsg ? (recentMsg.text || recentMsg.message || 'Nouveau message') : 'Aucun message'}</Text>
          <TouchableOpacity style={styles.blockBtn} onPress={() => router.push('/Patient/chat')}><Text style={styles.blockBtnText}>Ouvrir le chat</Text></TouchableOpacity>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Notifications non lues</Text>
          <Text style={styles.blockLine}>{unread}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <TouchableOpacity style={[styles.blockBtn, { flex: 1 }]} onPress={() => router.push('/Patient/measures-history')}>
            <Text style={styles.blockBtnText}>Historique mesures</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.blockBtn, { flex: 1 }]} onPress={() => router.push('/Patient/appointments')}>
            <Text style={styles.blockBtnText}>Mes rendez-vous</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.blockBtn, { marginTop: 12, flexDirection: 'row', justifyContent: 'center' }]} onPress={() => router.push('/Patient/advice')}>
          <Ionicons name="bulb-outline" size={18} color="#000" style={{ marginRight: 8 }} />
          <Text style={styles.blockBtnText}>Mes conseils santé</Text>
        </TouchableOpacity>

        <View style={{ height: 16 }} />
      </ScrollView>
      <NavPatient />
    </View>
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
  blockBtn: { marginTop: 8, backgroundColor: '#2ccdd2', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  blockBtnText: { color: '#000' },
  findStructureBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fff',
  borderColor: '#D1D5DB',
  borderWidth: 1,
  borderRadius: 12,
  paddingVertical: 12,
  marginTop: 12,
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
},
findStructureText: {
  color: '#111827',
  fontSize: 15,
},

});
