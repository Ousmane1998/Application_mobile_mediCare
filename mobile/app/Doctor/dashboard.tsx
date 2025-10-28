import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import PageContainer from '../../components/PageContainer';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/header';
import NavDoctor from '@/components/navDoctor';
import { router } from 'expo-router';
import { getProfile, authFetch, getNotifications, getAppointments, listMyPatients, type NotificationItem, type AppointmentItem, type Patient } from '../../utils/api';
import { useAppTheme } from '../../theme/ThemeContext';

export default function DoctorDashboardScreen() {
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string>('');
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [messages, setMessages] = useState<NotificationItem[]>([]);
  const [appointments, setAppointments] = useState<NotificationItem[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<number>(0);
  const [pathologies, setPathologies] = useState<Array<{ name: string; count: number }>>([]);
  const [alertsFilter, setAlertsFilter] = useState<'Toutes' | '24h' | '7j'>('Toutes');
  const [alertsType, setAlertsType] = useState<'Tous' | 'Messages' | 'Rendez-vous' | 'Alertes'>('Tous');
  
  const filteredPatients = useMemo(() => {
    // Utiliser alertsType pour filtrer les patients (au lieu de patientFilter)
    if (alertsType === 'Tous') return patients;
    
    const patientIds = new Set<string>();
    
    if (alertsType === 'Messages') {
      messages.forEach(m => patientIds.add(m.userId));
    } else if (alertsType === 'Rendez-vous') {
      appointments.forEach(a => patientIds.add(a.userId));
    } else if (alertsType === 'Alertes') {
      alerts.forEach(a => patientIds.add(a.userId));
    }
    
    return patients.filter(p => patientIds.has(p._id));
  }, [patients, messages, appointments, alerts, alertsType]);
  
  const filteredAlerts = useMemo(() => {
    if (!alerts?.length) return [] as NotificationItem[];
    const now = Date.now();
    let base = alerts;
    // type filter
    if (alertsType !== 'Tous') {
      const typeMap: Record<string,string[]> = {
        Messages: ['message'],
        'Rendez-vous': ['rdv','appointment'],
        Alertes: ['alerte','alert'],
      };
      const allowed = typeMap[alertsType];
      base = base.filter(a => allowed.includes(String(a.type||'').toLowerCase()));
    }
    // timeframe filter
    if (alertsFilter === '24h') {
      const t = now - 24 * 60 * 60 * 1000;
      base = base.filter(a => a.createdAt && new Date(a.createdAt).getTime() >= t);
    } else if (alertsFilter === '7j') {
      const t = now - 7 * 24 * 60 * 60 * 1000;
      base = base.filter(a => a.createdAt && new Date(a.createdAt).getTime() >= t);
    }
    return base;
  }, [alerts, alertsFilter, alertsType]);

  const load = async () => {
    try {
      setError(null);
      const prof = await getProfile();
      const meId = (prof.user as any)._id || (prof.user as any).id;
      const name = `Dr ${prof?.user?.nom || ''}`.trim();
      setDoctorName(name);
      
      // Charger les patients
      const patientsData = await listMyPatients();
      const arr = Array.isArray(patientsData) ? patientsData : [];
      const total = arr.length || 0;
      setTotalPatients(total);
      setPatients(arr);
      
      // Pathologies breakdown (top 3)
      const counts: Record<string, number> = {};
      arr.forEach((u: any) => { const p = (u.pathologie || '').trim(); if (p) counts[p] = (counts[p]||0)+1; });
      const top = Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b)=>b.count-a.count).slice(0,3);
      setPathologies(top);
      
      const notifs: NotificationItem[] = await getNotifications(meId);
      const allNotifs = Array.isArray(notifs) ? notifs : [];
      
      // Récupérer les IDs des patients du médecin
      const patientIds = arr.map((p: any) => p._id);
      
      // Filtrer les notifications par type et par patients du médecin
      const recentAlerts = allNotifs
        .filter(n => ['alerte','alert','measure'].includes(String(n.type||'').toLowerCase()) && patientIds.includes(n.userId))
        .slice(0, 5);
      setAlerts(recentAlerts);
      
      const messageNotifs = allNotifs
        .filter(n => ['message'].includes(String(n.type||'').toLowerCase()) && patientIds.includes(n.userId))
        .slice(0, 5);
      setMessages(messageNotifs);
      
      const appointmentNotifs = allNotifs
        .filter(n => ['rdv','appointment'].includes(String(n.type||'').toLowerCase()) && patientIds.includes(n.userId))
        .slice(0, 5);
      setAppointments(appointmentNotifs);
      
      // Pending appointments for this doctor
      const appts: AppointmentItem[] = await getAppointments();
      const pending = (Array.isArray(appts) ? appts : []).filter(a => String((a.medecinId as any)?._id || a.medecinId) === String(meId) && String(a.statut).toLowerCase() === 'en_attente').length;
      setPendingAppointments(pending);
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

  return (
    <View>
      <Header />
      <PageContainer scroll style={styles.container} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={[styles.greeting, { color: theme.colors.text }]}>Bonjour, {doctorName || 'Docteur'}!</Text>

        {loading ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.cardsRow}>
              <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.cardLabel, { color: theme.colors.muted }]}>Total Patients</Text>
                <Text style={[styles.cardValue, { color: theme.colors.text }]}>{totalPatients}</Text>
              </View>
              <View style={[styles.card, styles.cardAlert, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.cardLabel, { color: theme.colors.muted }]}>Patients avec alertes</Text>
                <Text style={[styles.cardValue, { color: '#EF4444' }]}>{alerts.length}</Text>
              </View>
              <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.cardLabel, { color: theme.colors.muted }]}>RDV en attente</Text>
                <Text style={[styles.cardValue, { color: theme.colors.text }]}>{pendingAppointments}</Text>
              </View>
            </View>

            <View style={[styles.searchWrap, { backgroundColor: theme.colors.card }]}>
              <Ionicons name="search-outline" size={24} color={theme.colors.text} />
              <TextInput
                placeholder="Rechercher des patients"
                style={[styles.search, { color: theme.colors.text }]}
                placeholderTextColor={theme.colors.muted}
                selectionColor={theme.colors.primary}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
              <View style={styles.chipActive}><Text style={styles.chipTextActive}>Tous</Text></View>
              <View style={styles.chip}><Text style={styles.chipText}>Diabète</Text></View>
              <View style={styles.chip}><Text style={styles.chipText}>Hypertension</Text></View>
              <View style={styles.chip}><Text style={styles.chipText}>Alertes</Text></View>
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Alertes Récentes</Text>
              <TouchableOpacity onPress={() => router.push('/Doctor/notifications' as any)}>
                <Text style={[styles.link, { color: theme.colors.primary }]}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {(['Toutes','24h','7j'] as const).map(f => (
                <TouchableOpacity key={f} onPress={() => setAlertsFilter(f)}>
                  <View style={f === alertsFilter ? styles.chipActive : styles.chip}>
                    <Text style={f === alertsFilter ? styles.chipTextActive : styles.chipText}>{f}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {(['Tous','Messages','Rendez-vous','Alertes'] as const).map(f => (
                <TouchableOpacity key={f} onPress={() => setAlertsType(f)}>
                  <View style={f === alertsType ? styles.chipActive : styles.chip}>
                    <Text style={f === alertsType ? styles.chipTextActive : styles.chipText}>{f}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredAlerts.map((n, i) => (
              <View key={(n._id || i).toString()} style={[styles.alertItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }] }>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: theme.colors.text }]}>{n.type || 'Alerte'}</Text>
                  {!!n.message && <Text style={styles.itemSubRed}>{n.message}</Text>}
                </View>
                <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
              </View>
            ))}

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mes Patients</Text>
              <TouchableOpacity onPress={() => router.push('/Doctor/my-patients' as any)}>
                <Text style={[styles.link, { color: theme.colors.primary }]}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            {filteredPatients.slice(0, 5).map((p) => (
              <View key={p._id} style={[styles.patientItem, { backgroundColor: theme.colors.card }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: theme.colors.text }]}>{p.prenom} {p.nom}</Text>
                  {p.pathologie && <Text style={[styles.itemSub, { color: theme.colors.muted }]}>{p.pathologie}</Text>}
                  {p.email && <Text style={[styles.itemSub, { color: theme.colors.muted }]}>{p.email}</Text>}
                </View>
                <TouchableOpacity 
                  style={[styles.smsButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => router.push(`/Doctor/chat?patientId=${p._id}&patientName=${p.prenom}%20${p.nom}`)}
                >
                  <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={() => router.push('/Doctor/add-patient')}>
              <Text style={styles.fabText}>Ajouter Patient</Text>
            </TouchableOpacity>

            {error ? <Text style={{ color: '#DC2626', marginTop: 8 }}>{error}</Text> : null}
          </>
        )}
      </PageContainer>
      {/* <NavDoctor /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { marginTop: 12, fontSize: 22, color: '#111827' },
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
  smsButton: { backgroundColor: '#2ccdd2', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2ccdd2', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  fabText: { color: '#fff', fontSize: 14 },
});
