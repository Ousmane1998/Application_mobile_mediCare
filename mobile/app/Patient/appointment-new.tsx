// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Snackbar from '../../components/Snackbar';
import { 
  createAppointment, 
  getProfile, 
  type UserProfile, 
  getAvailabilityByMedecin, 
  getMedecinById
} from '../../utils/api';

type AvailabilityType = {
  _id?: string;
  medecinId: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  disponible?: boolean;
};

export default function PatientAppointmentNewScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [medecin, setMedecin] = useState<any>(null);
  const [medecinId, setMedecinId] = useState('');
  const [doctor, setDoctor] = useState<any | null>(null);
  const [hasAttachedDoctor, setHasAttachedDoctor] = useState(false);
  const [availabilities, setAvailabilities] = useState<AvailabilityType[]>([]);
  const [datesDisponibles, setDatesDisponibles] = useState<string[]>([]);
  const [heuresDisponibles, setHeuresDisponibles] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityType | null>(null);
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [me, setMe] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info'
  });
  const [loadingAvail, setLoadingAvail] = useState(false);

  const typesConsultation = ['Suivi régulier', 'Consultation initiale', 'Urgence', 'Téléconsultation'];
  const [typeConsultation, setTypeConsultation] = useState('Suivi régulier');

  // Validation helpers
  const sanitize = (s: string) => String(s || '').replace(/[\t\n\r]+/g, ' ').trim();
  const hasDanger = (s: string) => /[<>]/.test(String(s || ''));
  const isValidType = (t: string) => typesConsultation.includes(t);

  // Calendar UX states and helpers
  const now = new Date();
  const [monthRef, setMonthRef] = useState<{ year: number; month: number }>({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const DAYS_FR = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

  function daysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }
  function startWeekday(year: number, month: number) {
    return new Date(year, month, 1).getDay(); // 0 Sun ... 6 Sat
  }
  const monthTitle = React.useMemo(() => {
    const d = new Date(monthRef.year, monthRef.month, 1);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }, [monthRef]);
  const grid = React.useMemo(() => {
    const start = startWeekday(monthRef.year, monthRef.month);
    const count = daysInMonth(monthRef.year, monthRef.month);
    const cells: (number | null)[] = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= count; d++) cells.push(d);
    return cells;
  }, [monthRef]);
  const isPastDay = (d: number | null) => {
    if (!d) return true;
    const ts = new Date(monthRef.year, monthRef.month, d).getTime();
    return ts < startOfToday;
  };
  const isTodaySelected = React.useMemo(() => {
    return selectedDay != null && monthRef.year === today.getFullYear() && monthRef.month === today.getMonth() && selectedDay === today.getDate();
  }, [selectedDay, monthRef, today]);
  const isSlotInPast = (slot: string) => {
    if (!isTodaySelected) return false;
    const [hh, mm] = slot.split(':').map(n => parseInt(n, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return true;
    const nowMins = today.getHours() * 60 + today.getMinutes();
    const slotMins = hh * 60 + mm;
    return slotMins <= nowMins;
  };
  const onPrevMonth = () => {
    setMonthRef(m => {
      const nm = m.month - 1;
      return nm < 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: nm };
    });
    setSelectedDay(null);
    setHeuresDisponibles([]);
    setSelectedSlot(null);
  };
  const onNextMonth = () => {
    setMonthRef(m => {
      const nm = m.month + 1;
      return nm > 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: nm };
    });
    setSelectedDay(null);
    setHeuresDisponibles([]);
    setSelectedSlot(null);
  };
  const isAvailableDate = (d: number | null) => {
    if (!d) return false;
    const weekday = new Date(monthRef.year, monthRef.month, d).getDay();
    const name = DAYS_FR[weekday];
    return availabilities.some(a => a.jour && a.jour.trim() === name);
  };
  const buildSlotsForDay = (d: number) => {
    const weekday = new Date(monthRef.year, monthRef.month, d).getDay();
    const name = DAYS_FR[weekday];
    const entries = availabilities.filter(a => a.jour && a.jour.trim() === name);
    const slots: string[] = [];
    const toMin = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map(n => parseInt(n, 10));
      return (h || 0) * 60 + (m || 0);
    };
    const toHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`;
    entries.forEach(e => {
      const start = toMin(e.heureDebut);
      const end = toMin(e.heureFin);
      for (let t = start; t < end; t += 30) {
        slots.push(toHHMM(t));
      }
    });
    const uniq = Array.from(new Set(slots)).sort();
    return uniq;
  };

  // Charger profil patient
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getProfile();
        console.log('📋 Profil patient reçu :', data);
        setMe(data.user);
        const docId = (data.user as any)?.medecinId;
        if (docId) {
          setHasAttachedDoctor(true);
          try {
            const med = await getMedecinById(String(docId));
            const medUser = (med as any).user || med;
            setDoctor(medUser);
            setMedecinId(String(docId));
          } catch (e) {
            // en cas d'échec on laisse la sélection manuelle
          }
        } else {
          setHasAttachedDoctor(false);
        }
      } catch (e: any) {
        console.error('❌ Erreur profil :', e);
        setSnack({ visible: true, message: e?.message || 'Erreur de chargement du profil', type: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Charger disponibilités quand médecin sélectionné
  useEffect(() => {
    if (!medecinId) return;

    (async () => {
      try {
        setLoadingAvail(true);
        const data: AvailabilityType[] = await getAvailabilityByMedecin(medecinId);
        setAvailabilities(data);
        const jours: string[] = [...new Set(data.map((a) => a.jour))];
        setDatesDisponibles(jours);
        setHeuresDisponibles([]);
        setDate('');
        setHeure('');
        setSelectedAvailability(null);
        setSelectedDay(null);
        setSelectedSlot(null);
      } catch (e) {
        setSnack({ visible: true, message: 'Impossible de charger les disponibilités', type: 'error' });
      } finally {
        setLoadingAvail(false);
      }
    })();
  }, [medecinId]);

  // Helper: construire date ISO depuis sélection
  const selectedDateIso = React.useMemo(() => {
    if (!selectedDay) return '';
    const dd = String(selectedDay).padStart(2, '0');
    const mon = String(monthRef.month + 1).padStart(2, '0');
    const yyyy = String(monthRef.year);
    return `${yyyy}-${mon}-${dd}`;
  }, [selectedDay, monthRef]);

  const onSave = async () => {
    const validate = (): string | null => {
      if (!me?._id) return 'Profil non chargé.';
      if (!medecinId) return 'Aucun médecin sélectionné.';
      if (!selectedDay) return 'Veuillez sélectionner une date.';
      if (!selectedSlot) return 'Veuillez sélectionner un créneau horaire.';
      if (isSlotInPast(selectedSlot)) return 'Le créneau choisi est déjà passé.';
      if (!selectedDateIso) return 'Date invalide.';
      if (!isValidType(typeConsultation)) return 'Type de consultation invalide.';
      if (hasDanger(typeConsultation)) return 'Caractères interdits détectés.';
      return null;
    };

    const v = validate();
    if (v) { setSnack({ visible: true, message: v, type: 'error' }); return; }
    const isoDate = selectedDateIso;

    try {
      setSaving(true);
      setError(null);
      await createAppointment({
        patientId: me._id,
        medecinId,
        date: isoDate,
        heure: selectedSlot,
        typeConsultation: sanitize(typeConsultation),
        statut: 'en_attente'
      });
      setSnack({ visible: true, message: 'Rendez-vous confirmé.', type: 'success' });
      setTimeout(() => router.back(), 800);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la création');
      setSnack({ visible: true, message: e?.message || 'Erreur lors de la création', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2ccdd2" />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>Chargement...</Text>
      </View>
    );
  }

  if (!doctor && hasAttachedDoctor) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={50} color="#EF4444" />
        <Text style={{ marginTop: 12, fontSize: 16, color: '#111827', fontWeight: '600' }}>Erreur de chargement</Text>
        <Text style={{ marginTop: 8, color: '#6B7280', textAlign: 'center' }}>Impossible de charger les informations du médecin</Text>
        <TouchableOpacity style={[styles.primaryBtn, { marginTop: 20 }]} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hasAttachedDoctor) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={50} color="#EF4444" />
        <Text style={{ marginTop: 12, fontSize: 16, color: '#111827', fontWeight: '600' }}>Aucun médecin assigné</Text>
        <Text style={{ marginTop: 8, color: '#6B7280', textAlign: 'center' }}>Veuillez contacter l'administration pour être assigné à un médecin</Text>
        <TouchableOpacity style={[styles.primaryBtn, { marginTop: 20 }]} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Prendre rendez-vous</Text>
      {doctor && (
        <Text style={{ color: theme.colors.muted, marginBottom: 8 }}>Avec Dr {doctor?.nom} {doctor?.prenom}</Text>
      )}
      {!hasAttachedDoctor && (
        <Text style={{ color: '#DC2626', marginBottom: 8 }}>Aucun médecin n'est rattaché à votre profil. Veuillez en sélectionner un.</Text>
      )}

      {/* Calendrier */}
      <View style={[styles.group, loadingAvail && { opacity: 0.6 }]} pointerEvents={loadingAvail ? 'none' : 'auto'}>
        {loadingAvail && (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={{ color: theme.colors.muted, marginTop: 6 }}>Chargement des disponibilités...</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={onPrevMonth}><Text style={{ color: theme.colors.text }}>{'<'}</Text></TouchableOpacity>
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1)}</Text>
          <TouchableOpacity onPress={onNextMonth}><Text style={{ color: theme.colors.text }}>{'>'}</Text></TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          {['D','L','M','M','J','V','S'].map(k => (
            <Text key={k} style={{ width: 40, textAlign: 'center', color: theme.colors.muted }}>{k}</Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {grid.map((d, idx) => {
            const disabled = !d || isPastDay(d) || !isAvailableDate(d);
            const selected = !!d && d === selectedDay && !disabled;
            return (
              <TouchableOpacity
                key={idx}
                disabled={disabled}
                onPress={() => {
                  if (!d) return;
                  setSelectedDay(d);
                  const slots = buildSlotsForDay(d);
                  setHeuresDisponibles(slots);
                  setSelectedSlot(null);
                }}
                style={[
                  styles.dayCell,
                  !d && styles.dayEmpty,
                  disabled && styles.dayDisabled,
                  selected && styles.daySelected,
                  selected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
              >
                <Text style={[{ color: theme.colors.text }, selected && { color: '#fff' }, disabled && { color: theme.colors.muted }]}>{d ?? ''}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Créneaux disponibles */}
      <View style={[styles.group, loadingAvail && { opacity: 0.6 }]} pointerEvents={loadingAvail ? 'none' : 'auto'}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Créneaux disponibles</Text>
        <View style={styles.cardContainer}>
          {heuresDisponibles.length === 0 && (
            <Text style={{ color: theme.colors.muted }}>Sélectionnez un jour disponible</Text>
          )}
          {heuresDisponibles.map((h) => {
            const disabled = isSlotInPast(h);
            const selected = selectedSlot === h && !disabled;
            return (
              <TouchableOpacity
                key={h}
                disabled={disabled}
                onPress={() => { if (!disabled) { setSelectedSlot(h); setHeure(h); } }}
                style={[
                  styles.slotChip,
                  selected && styles.slotActive,
                  disabled && styles.slotDisabled,
                  selected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
              >
                <Text style={[{ color: theme.colors.text }, selected && { color: theme.colors.primaryText }, disabled && { color: theme.colors.muted }]}>{h}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {!!selectedDay && heuresDisponibles.length === 0 && !loadingAvail && (
          <Text style={{ color: '#DC2626', marginTop: 6 }}>Aucun créneau disponible pour ce jour.</Text>
        )}
      </View>

      {/* Type de consultation */}
      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Type de consultation</Text>
        <View style={styles.cardContainer}>
          {typesConsultation.map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.card,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                typeConsultation === t && [styles.cardSelected, { borderColor: theme.colors.primary }],
              ]}
              onPress={() => setTypeConsultation(t)}
            >
              <Text style={[styles.cardText, { color: theme.colors.text }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }, (saving || !selectedDay || !selectedSlot || loadingAvail) && { opacity: 0.7 }]}
        disabled={saving || !selectedDay || !selectedSlot || loadingAvail}
        onPress={onSave}
      >
        {saving ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={[styles.primaryBtnText, { color: theme.colors.primaryText }]}>Enregistrement…</Text>
          </View>
        ) : (
          <Text style={[styles.primaryBtnText, { color: theme.colors.primaryText }]}>Confirmer le rendez-vous</Text>
        )}
      </TouchableOpacity>

      <Snackbar
        visible={snack.visible}
        message={snack.message}
        type={snack.type}
        onHide={() => setSnack((s) => ({ ...s, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 32 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, paddingTop: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, color: '#000', fontWeight: 'bold',marginTop:60 },
  group: { marginBottom: 16 },
  label: { fontSize: 13, color: '#374151', marginBottom: 8, fontWeight: '600' },
  
  // Médecin Card
  medecinCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 14, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12
  },
  medecinAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2ccdd2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  medecinInitials: { fontSize: 16, fontWeight: '600', color: '#fff' },
  medecinName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  medecinSpecialite: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  medecinHopital: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  medecinContact: { fontSize: 12, color: '#2ccdd2', marginTop: 4, fontWeight: '500' },
  
  // Time Slot
  timeSlotCard: {
    backgroundColor: '#E0F7F6',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2ccdd2'
  },
  timeSlotText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  timeSlotSubtext: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  
  // Cards
  cardContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 12, 
    paddingVertical: 10, 
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardSelected: { borderColor: '#2ccdd2', backgroundColor: '#E0F7F6' },
  cardText: { color: '#111827', fontSize: 13 },
  // Calendar styles
  dayCell: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', margin: 2, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  dayEmpty: { backgroundColor: 'transparent', borderWidth: 0 },
  dayDisabled: { backgroundColor: '#F3F4F6' },
  daySelected: { backgroundColor: '#10B981', borderColor: '#10B981' },
  dayText: { color: '#111827' },
  // Slot chip styles
  slotChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  slotActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  slotDisabled: { backgroundColor: '#E5E7EB', borderColor: '#E5E7EB' },
  slotText: { color: '#111827' },
  slotTextDisabled: { color: '#9CA3AF' },
  // Buttons
  primaryBtn: { backgroundColor: '#2ccdd2', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#DC2626', marginTop: 8 },
});
