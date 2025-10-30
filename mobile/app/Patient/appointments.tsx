import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { getProfile, getAppointments, updateAppointment, type AppointmentItem } from '../../utils/api';
import { useAppTheme } from '../../theme/ThemeContext';

export default function PatientAppointmentsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meId, setMeId] = useState<string | null>(null);
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [resModal, setResModal] = useState<{ open: boolean; appt: AppointmentItem | null }>({ open: false, appt: null });
  const [selDate, setSelDate] = useState<string | null>(null);
  const [selTime, setSelTime] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
    setResModal({ open: true, appt: a });
    setSelDate(a.date || null);
    setSelTime(a.heure || null);
  };

  const load = async () => {
    try {
      const prof = await getProfile();
      const id = (prof.user as any)._id || (prof.user as any).id;
      console.log('📋 Patient ID:', id);
      setMeId(id);
      
      const all = await getAppointments();
      console.log('📋 Tous les rendez-vous reçus:', all);
      
      const mine = (Array.isArray(all) ? all : []).filter(a => {
        const appointmentPatientId = String((a.patientId as any)?._id || a.patientId);
        const currentUserId = String(id);
        console.log(`🔍 Comparaison: ${appointmentPatientId} === ${currentUserId} ? ${appointmentPatientId === currentUserId}`);
        return appointmentPatientId === currentUserId;
      });
      
      console.log('✅ Rendez-vous du patient:', mine);
      
      mine.sort((a,b)=> new Date(`${a.date} ${a.heure||'00:00'}`).getTime() - new Date(`${b.date} ${b.heure||'00:00'}`).getTime());
      setItems(mine);
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des rendez-vous:', err);
      Alert.alert('Erreur', 'Impossible de charger les rendez-vous');
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

  // Fonction pour formater la date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 8, color: theme.colors.muted }}>Chargement des rendez-vous...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}> 
      <Text style={[styles.title, { color: theme.colors.text }]}>Rendez-vous</Text>

      {(items.length === 0) && (
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }]}> 
          <Text style={[styles.textMuted, { color: theme.colors.muted }]}>Aucun rendez-vous pour le moment. Tirez pour rafraîchir ou prenez un nouveau rendez-vous.</Text>
          <TouchableOpacity style={[styles.btn, { marginTop: 12, backgroundColor: theme.colors.primary }]} onPress={() => router.push('/Patient/appointment-new')}>
            <Text style={[styles.btnText, { color: theme.colors.primaryText }]}>Prendre rendez-vous</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>À venir</Text>
        {upcoming.length === 0 && <Text style={[styles.textMuted, { color: theme.colors.muted }]}>Aucun rendez-vous à venir</Text>}
        {upcoming.map((a,i) => (
          <View key={(a._id||i).toString()} style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarInitialsSmall}>
                  {`${(((a.medecinId as any)?.prenom)||'').charAt(0)}${(((a.medecinId as any)?.nom)||'').charAt(0)}`.toUpperCase() || '??'}
                </Text>
              </View>
              <Text style={[styles.text, { color: theme.colors.text }]} numberOfLines={1}>{a.date} • {a.heure || ''} • {((a.medecinId as any)?.prenom||'') + ' ' + (((a.medecinId as any)?.nom)||'Médecin')}</Text>
            </View>
            {badge(a.statut)}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => cancel(a._id)}><Text style={[styles.action, { color: '#EF4444' }]}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => reschedule(a)}><Text style={[styles.action, { color: '#2563EB' }]}>Reprogrammer</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Passés</Text>
        {past.length === 0 && <Text style={[styles.textMuted, { color: theme.colors.muted }]}>Aucun rendez-vous passé</Text>}
        {past.map((a,i) => (
          <View key={(a._id||i).toString()} style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarInitialsSmall}>
                  {`${(((a.medecinId as any)?.prenom)||'').charAt(0)}${(((a.medecinId as any)?.nom)||'').charAt(0)}`.toUpperCase() || '??'}
                </Text>
              </View>
              <Text style={[styles.text, { color: theme.colors.text }]}>{a.date} • {a.heure || ''} • {((a.medecinId as any)?.prenom||'') + ' ' + (((a.medecinId as any)?.nom)||'Médecin')}</Text>
            </View>
            {badge(a.statut)}
          </View>
        ))}
      </View>
    </ScrollView>
    <Modal visible={resModal.open} transparent animationType="fade" onRequestClose={() => setResModal({ open: false, appt: null })}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Reprogrammer le rendez-vous</Text>
          <Text style={styles.modalLabel}>Date</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.optionText}>{selDate ? new Date(selDate).toLocaleDateString() : 'Choisir une date'}</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}><Text style={[styles.action, { color: '#2563EB' }]}>Choisir</Text></TouchableOpacity>
          </View>
          <Text style={[styles.modalLabel, { marginTop: 8 }]}>Heure</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.optionText}>{selTime || 'Choisir une heure'}</Text>
            <TouchableOpacity onPress={() => setShowTimePicker(true)}><Text style={[styles.action, { color: '#2563EB' }]}>Choisir</Text></TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <TouchableOpacity onPress={() => setResModal({ open: false, appt: null })}><Text style={styles.action}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                if (!resModal.appt || !selDate || !selTime) return;
                // Validation: interdit une date/heure passée
                const candidate = new Date(`${selDate}T${selTime}:00`);
                if (isNaN(candidate.getTime()) || candidate.getTime() < Date.now()) {
                  Alert.alert('Date invalide', 'La date/heure choisie est passée. Veuillez choisir un créneau futur.');
                  return;
                }
                try { await updateAppointment(resModal.appt._id, { date: selDate, heure: selTime }); setResModal({ open: false, appt: null }); await load(); }
                catch (e: any) { Alert.alert('Erreur', e?.message || 'Impossible de reprogrammer'); }
              }}
            >
              <Text style={[styles.action, { color: '#2563EB' }]}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    <DateTimePickerModal
      isVisible={showDatePicker}
      mode="date"
      minimumDate={new Date()}
      onConfirm={(date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        setSelDate(`${yyyy}-${mm}-${dd}`);
        setShowDatePicker(false);
      }}
      onCancel={() => setShowDatePicker(false)}
    />
    <DateTimePickerModal
      isVisible={showTimePicker}
      mode="time"
      onConfirm={(date) => {
        const hh = String(date.getHours()).padStart(2, '0');
        const mi = String(date.getMinutes()).padStart(2, '0');
        setSelTime(`${hh}:${mi}`);
        setShowTimePicker(false);
      }}
      onCancel={() => setShowTimePicker(false)}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, color: '#111827', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, color: '#111827', marginBottom: 12 },
  text: { color: '#374151', marginBottom: 4 },
  textMuted: { color: '#6B7280', marginBottom: 4, fontStyle: 'italic' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 },
  badge: { color: '#fff', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, overflow: 'hidden', fontSize: 12, fontWeight: '600' },
  action: { fontWeight: '600' },
  btn: { marginTop: 8, backgroundColor: '#2ccdd2', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff' },
  appointmentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#2ccdd2', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  appointmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  appointmentDate: { fontSize: 14, fontWeight: '600', color: '#111827' },
  appointmentTime: { fontSize: 13, color: '#6B7280' },
  appointmentDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },
  appointmentDoctor: { fontSize: 14, fontWeight: '500', color: '#111827' },
  appointmentType: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, color: '#111827', marginBottom: 8 },
  modalLabel: { color: '#6B7280', marginTop: 4 },
  optionRow: { paddingVertical: 8, borderRadius: 8, paddingHorizontal: 8 },
  optionRowActive: { backgroundColor: '#E5E7EB' },
  optionText: { color: '#111827' },
  optionTextActive: { color: '#111827', fontWeight: '600' },
  chip: { backgroundColor: '#E5E7EB', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8 },
  chipActive: { backgroundColor: '#2ccdd2', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8 },
  chipText: { color: '#111827' },
  chipTextActive: { color: '#fff' },
});

function next30Days() {
  const out: Array<{ label: string; value: string }> = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const value = `${yyyy}-${mm}-${dd}`;
    out.push({ label: d.toLocaleDateString(), value });
  }
  return out;
}

const timeOptions = Array.from({ length: ((20 - 8) * 60) / 30 + 1 }, (_, i) => {
  const minutes = 8 * 60 + i * 30;
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  const label = `${h}:${m}`;
  return { label, value: label } as const;
});
