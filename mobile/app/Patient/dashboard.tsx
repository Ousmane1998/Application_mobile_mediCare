// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
 
import Header from '../../components/header';
import { useRouter } from 'expo-router';
import NavPatient from '../../components/navPatient';
import { getProfile, getMeasuresHistory, getAppointments, getMessages, getNotifications, getMedecinById, getOfflineMeasures, syncOfflineMeasures, type AppointmentItem } from '../../utils/api';
import { useAppTheme } from '../../theme/ThemeContext';

export default function PatientDashboardScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meId, setMeId] = useState<string | null>(null);
  const [meName, setMeName] = useState<string>('');
  const [latest, setLatest] = useState<Record<string, any>>({});
  const [nextAppt, setNextAppt] = useState<AppointmentItem | null>(null);
  const [recentMsg, setRecentMsg] = useState<any | null>(null);
  const [unread, setUnread] = useState<number>(0);
  const [offlineMeasuresCount, setOfflineMeasuresCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    try {
      const prof = await getProfile();
      const id = (prof.user as any)._id || (prof.user as any).id;
      setMeId(id);
      const fullName = `${prof.user?.prenom || ''} ${prof.user?.nom || ''}`.trim();
      setMeName(fullName);
      const history = await getMeasuresHistory(id);
      
      // Trier toutes les mesures par date décroissante
      const sortedMeasures = (Array.isArray(history) ? history : [])
        .map((m: any) => ({ ...m, _ts: new Date(m.date || m.createdAt || Date.now()).getTime() }))
        .sort((a: any, b: any) => b._ts - a._ts);
      
      // Garder les 2 derniers TYPES (dernières mesures de types différents)
      const latest: Record<string, any> = {};
      const seenTypes = new Set<string>();
      
      for (const measure of sortedMeasures) {
        const type = String(measure.type || '').toLowerCase();
        if (!seenTypes.has(type) && seenTypes.size < 2) {
          latest[type] = measure;
          seenTypes.add(type);
        }
      }
      
      setLatest(latest);
      
      // Rendez-vous: afficher le dernier rendez-vous confirmé ou en attente
      const appts = await getAppointments();
      const myAppts = (Array.isArray(appts) ? appts : []).filter(a => String((a.patientId as any)?._id || a.patientId) === String(id));
      // Filtrer les rendez-vous confirmés ou en attente (pas annulés)
      const validAppts = myAppts.filter(a => a.statut !== 'annule');
      validAppts.sort((a,b)=> new Date(`${b.date} ${b.heure||'00:00'}`).getTime() - new Date(`${a.date} ${a.heure||'00:00'}`).getTime());
      setNextAppt(validAppts[0] || null);
      
      // Messages: récupérer les messages avec le médecin assigné
      if (prof.user?.medecinId) {
        const medecinId = (prof.user.medecinId as any)?._id || prof.user.medecinId;
        const msgs = await getMessages(id, medecinId);
        const listMsgs = Array.isArray(msgs) ? msgs : [];
        // Filtrer les messages non lus
        const unreadMsgs = listMsgs.filter((m: any) => !m.isRead && String(m.receiverId) === String(id));
        unreadMsgs.sort((a: any,b: any)=> new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        
        // Enrichir le message avec le nom du médecin
        if (unreadMsgs[0]) {
          const medecin = await getMedecinById(medecinId);
          const medecinData = medecin?.user || medecin;
          unreadMsgs[0].senderName = `${medecinData?.prenom || ''} ${medecinData?.nom || 'Médecin'}`.trim();
        }
        setRecentMsg(unreadMsgs[0] || null);
      }
      
      // Notifications non lues
      const notifs = await getNotifications(id);
      const unreadCount = (Array.isArray(notifs) ? notifs : []).filter(n => !n.isRead).length;
      setUnread(unreadCount);

      // Mesures hors ligne
      const offlineMeasures = await getOfflineMeasures();
      setOfflineMeasuresCount(offlineMeasures.length);
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

  // Fonction pour calculer l'heure relative
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}m`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 8, color: theme.colors.muted }}>Chargement...</Text>
      </View>
    );
  }

  const handleEmergency = () => {
    router.push('/Patient/emergency-alert');
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncOfflineMeasures();
      alert(result.message);
      await load(); // Recharger les données
    } catch (e: any) {
      alert('Erreur lors de la synchronisation: ' + e.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={[styles.greeting, { color: theme.colors.text }]}>Bonjour, {meName || 'Patient'}!</Text>
          {offlineMeasuresCount > 0 && (
            <TouchableOpacity 
              style={[styles.syncBtn, { backgroundColor: '#3B82F6', opacity: syncing ? 0.6 : 1 }]} 
              onPress={handleSync}
              disabled={syncing}
            >
              <Ionicons name="sync" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Sync ({offlineMeasuresCount})</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Vos dernières mesures</Text>

        {gly && (
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="trending-up-outline" size={24} color="green" />
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Glycémie</Text>
            </View>
            <Text style={[styles.bigValue, { color: theme.colors.text }]}>{gly?.value ? `${gly.value}` : '—'}</Text>
            <Text style={styles.statusOk}>{gly?._ts ? getRelativeTime(gly.date || gly.createdAt) : 'Aucune donnée'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <TouchableOpacity style={styles.smallBtn} onPress={() => router.push('/Patient/measure-add')}>
                <Text style={styles.smallBtnText}>Ajouter</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/Patient/measures-history')}>
                <Text style={{ color: theme.colors.primary }}>Voir l'historique</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {tens && (
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="trending-up-outline" size={24} color="green" />
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Pression Artérielle</Text>
            </View>
            <Text style={[styles.bigValue, { color: theme.colors.text }]}>{tens?.value ? `${tens.value}` : '—'}</Text>
            <Text style={styles.statusWarn}>{tens?._ts ? getRelativeTime(tens.date || tens.createdAt) : 'Aucune donnée'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <TouchableOpacity style={styles.smallBtn} onPress={() => router.push('/Patient/measure-add')}>
                <Text style={styles.smallBtnText}>Ajouter</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/Patient/measures-history')}>
                <Text style={{ color: theme.colors.primary }}>Voir l'historique</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity style={[styles.findStructureBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={() => router.push('/Patient/find-structure')}>
          <Ionicons name="location-outline" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.findStructureText, { color: theme.colors.text }]}>Trouver une structure sanitaire</Text>
        </TouchableOpacity>

        <View style={[styles.block, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.blockTitle, { color: theme.colors.text }]}>Prochain rendez-vous</Text>
          <Text style={[styles.blockLine, { color: theme.colors.text }]}>{nextAppt ? `${(nextAppt as any).medecinId?.nom || 'Médecin'} - ${nextAppt.date} à ${nextAppt.heure || ''}` : 'Aucun prochain rendez-vous'}</Text>
          <TouchableOpacity style={[styles.blockBtn, { backgroundColor: theme.colors.primary }]} onPress={() => router.push('/Patient/appointment-new')}><Text style={[styles.blockBtnText, { color: theme.colors.primaryText }]}>Prendre rendez-vous</Text></TouchableOpacity>
        </View>

        <View style={[styles.block, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.blockTitle, { color: theme.colors.text }]}>Messages</Text>
          <Text style={[styles.blockLine, { color: theme.colors.text }]}>{recentMsg ? (recentMsg.text || recentMsg.message || 'Nouveau message') : 'Aucun message'}</Text>
          <TouchableOpacity style={[styles.blockBtn, { backgroundColor: theme.colors.primary }]} onPress={() => router.push('/Patient/chat')}><Text style={[styles.blockBtnText, { color: theme.colors.primaryText }]}>Ouvrir le chat</Text></TouchableOpacity>
        </View>

        <View style={[styles.block, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.blockTitle, { color: theme.colors.text }]}>Notifications non lues</Text>
          <Text style={[styles.blockLine, { color: theme.colors.text }]}>{unread}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <TouchableOpacity style={[styles.blockBtn, { flex: 1, backgroundColor: theme.colors.primary }]} onPress={() => router.push('/Patient/measures-history')}>
            <Text style={[styles.blockBtnText, { color: theme.colors.primaryText }]}>Historique mesures</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.blockBtn, { flex: 1, backgroundColor: theme.colors.primary }]} onPress={() => router.push('/Patient/appointments')}>
            <Text style={[styles.blockBtnText, { color: theme.colors.primaryText }]}>Mes rendez-vous</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.blockBtn, { marginTop: 12, flexDirection: 'row', justifyContent: 'center' }]} onPress={() => router.push('/Patient/advice')}>
          <Ionicons name="bulb-outline" size={18} color="#000" style={{ marginRight: 8 }} />
          <Text style={styles.blockBtnText}>Mes conseils santé</Text>
        </TouchableOpacity>

        <View style={{ height: 16 }} />
      </ScrollView>
      
      {/* Bouton Alerte SOS flottant */}
      <TouchableOpacity 
        style={[styles.floatingEmergencyBtn, { backgroundColor: '#EF4444' }]} 
        onPress={() => router.push('/Patient/emergency-alert')}
      >
        <Ionicons name="call-outline" size={32} color="#fff" />
      </TouchableOpacity>
      
      {/* <NavPatient /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 32 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menu: { fontSize: 22, color: '#111827' },
  greeting: { marginTop: 16, fontSize: 24, color: '#111827', flex: 1 },
  syncBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#3B82F6', marginTop: 16 },
  floatingEmergencyBtn: { position: 'absolute', bottom: 90, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 12, elevation: 10, zIndex: 100 },
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
  blockSender: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
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
