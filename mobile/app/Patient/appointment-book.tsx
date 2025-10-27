// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Snackbar from '../../components/Snackbar';
import { createAppointment, getProfile, type UserProfile } from '../../utils/api';
import { useRouter } from 'expo-router';

const SLOT_SETS: Record<string, string[]> = {
  morning: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30'],
};

const TYPES = ['Suivi régulier', 'Première consultation', 'Contrôle'] as const;

type MonthRef = { year: number; month: number }; // month 0-11

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startWeekday(year: number, month: number) {
  // 0=Sun ... 6=Sat. We will display D L M M J V S French headings
  return new Date(year, month, 1).getDay();
}

export default function PatientAppointmentBookScreen() {
  const router = useRouter();
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'info' });
  const [me, setMe] = useState<UserProfile | null>(null);

  const now = new Date();
  const [monthRef, setMonthRef] = useState<MonthRef>({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [selectedSlot, setSelectedSlot] = useState<string | null>('09:30');
  const [type, setType] = useState<typeof TYPES[number]>('Suivi régulier');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try { const data = await getProfile(); setMe(data.user); } catch (e: any) { setSnack({ visible: true, message: e?.message || 'Erreur de chargement', type: 'error' }); }
    })();
  }, []);

  const monthTitle = useMemo(() => {
    const d = new Date(monthRef.year, monthRef.month, 1);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }, [monthRef]);

  const grid = useMemo(() => {
    const start = startWeekday(monthRef.year, monthRef.month);
    const count = daysInMonth(monthRef.year, monthRef.month);
    const cells: (number | null)[] = [];
    // Normalize Sunday-first to Monday-first layout: headings D L M M J V S given in mock
    // We'll still place blanks before the 1st depending on start (0=Sun)
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= count; d++) cells.push(d);
    return cells;
  }, [monthRef]);

  const onPrevMonth = () => {
    setMonthRef(m => {
      const nm = m.month - 1;
      return nm < 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: nm };
    });
    setSelectedDay(null);
  };
  const onNextMonth = () => {
    setMonthRef(m => {
      const nm = m.month + 1;
      return nm > 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: nm };
    });
    setSelectedDay(null);
  };

  const confirm = async () => {
    if (!me?.id) { setSnack({ visible: true, message: 'Profil non chargé.', type: 'error' }); return; }
    if (!selectedDay || !selectedSlot) { setSnack({ visible: true, message: 'Sélectionner une date et une heure.', type: 'error' }); return; }
    const [hh, mm] = selectedSlot.split(':');
    const dd = String(selectedDay).padStart(2, '0');
    const mon = String(monthRef.month + 1).padStart(2, '0');
    const yyyy = String(monthRef.year);
    const dateIso = `${yyyy}-${mon}-${dd}`;
    try {
      setSaving(true);
      await createAppointment({ patientId: me.id, medecinId: 'TODO_DOCTOR_ID', date: dateIso, heure: `${hh}:${mm}`, statut: 'en_attente' });
      setSnack({ visible: true, message: 'Rendez-vous créé.', type: 'success' });
      setTimeout(() => router.back(), 800);
    } catch (e: any) {
      setSnack({ visible: true, message: e?.message || 'Erreur lors de la création', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.title}>Prendre un rendez-vous</Text>
          <Text style={styles.subtitle}>Avec Dr. Dupont</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.monthRow}>
        <TouchableOpacity onPress={onPrevMonth}><Ionicons name="chevron-back" size={20} color="#111827" /></TouchableOpacity>
        <Text style={styles.monthTitle}>{monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1)}</Text>
        <TouchableOpacity onPress={onNextMonth}><Ionicons name="chevron-forward" size={20} color="#111827" /></TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {['D','L','M','M','J','V','S'].map(k => (
          <Text key={k} style={styles.weekHead}>{k}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {grid.map((d, idx) => (
          <TouchableOpacity key={idx} disabled={!d} onPress={() => setSelectedDay(d!)} style={[styles.dayCell, !d && styles.dayEmpty, d === selectedDay && styles.daySelected]}>
            <Text style={[styles.dayText, d === selectedDay && { color: '#fff' }]}>{d ?? ''}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Choisissez une heure</Text>
      <View style={styles.slotsRow}>
        {SLOT_SETS.morning.map((s, i) => (
          <TouchableOpacity key={s} onPress={() => setSelectedSlot(s)} disabled={i === 3}
            style={[styles.slotChip, selectedSlot === s && styles.slotActive, i === 3 && styles.slotDisabled]}>
            <Text style={[styles.slotText, selectedSlot === s && { color: '#fff' }, i === 3 && styles.slotTextDisabled]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Type de consultation</Text>
      <View style={styles.selectBox}>
        <Text style={styles.selectValue}>{type}</Text>
        <Ionicons name="chevron-down" size={16} color="#111827" />
      </View>
      <View style={styles.typeRow}>
        {TYPES.map(t => (
          <TouchableOpacity key={t} onPress={() => setType(t)} style={[styles.typeChip, type === t && styles.typeActive]}>
            <Text style={[styles.typeText, type === t && { color: '#fff' }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={confirm}>
        <Text style={styles.primaryBtnText}>Confirmer le rendez-vous</Text>
      </TouchableOpacity>

      <Snackbar visible={snack.visible} message={snack.message} type={snack.type} onHide={() => setSnack(s => ({ ...s, visible: false }))} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 18, color: '#111827', fontWeight: '600' },
  subtitle: { color: '#6B7280', marginTop: 2 },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  monthTitle: { color: '#111827', fontSize: 16 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  weekHead: { width: 40, textAlign: 'center', color: '#6B7280' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  dayCell: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', margin: 2, backgroundColor: '#fff' },
  dayEmpty: { backgroundColor: 'transparent' },
  daySelected: { backgroundColor: '#10B981' },
  dayText: { color: '#111827' },
  section: { marginTop: 16, marginBottom: 8, fontSize: 16, color: '#111827' },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff' },
  slotActive: { backgroundColor: '#10B981' },
  slotDisabled: { backgroundColor: '#E5E7EB' },
  slotText: { color: '#111827' },
  slotTextDisabled: { color: '#9CA3AF' },
  selectBox: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#E5E7EB' },
  typeActive: { backgroundColor: '#10B981' },
  typeText: { color: '#111827' },
  primaryBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
});
