import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import Snackbar from '../../components/Snackbar';
import { createAppointment, getProfile, type UserProfile } from '../../utils/api';

export default function PatientAppointmentNewScreen() {
  const router = useRouter();
  const [medecinId, setMedecinId] = useState('');
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'info' });
  const [me, setMe] = useState<UserProfile | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateObj, setDateObj] = useState<Date | null>(null);
  const [timeObj, setTimeObj] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      try { const data = await getProfile(); setMe(data.user); } catch (e: any) { setSnack({ visible: true, message: e?.message || 'Erreur de chargement', type: 'error' }); }
    })();
  }, []);

  const onSave = async () => {
    if (!me?.id) { setSnack({ visible: true, message: 'Profil non chargé.', type: 'error' }); return; }
    if (!medecinId || !date) { setSnack({ visible: true, message: 'Médecin et date requis.', type: 'error' }); return; }
    const ddmmyyyy = /^\d{2}-\d{2}-\d{4}$/;
    if (!ddmmyyyy.test(date.trim())) { setSnack({ visible: true, message: 'Date invalide. Format: DD-MM-YYYY.', type: 'error' }); return; }
    if (heure && !/^\d{2}:\d{2}$/.test(heure.trim())) { setSnack({ visible: true, message: 'Heure invalide. Format: HH:mm.', type: 'error' }); return; }
    const [dd, mm, yyyy] = date.trim().split('-');
    const iso = `${yyyy}-${mm}-${dd}`;
    try {
      setSaving(true);
      setError(null);
      await createAppointment({ patientId: me.id, medecinId, date: iso, heure: heure || undefined, statut: 'en_attente' });
      setSnack({ visible: true, message: 'Rendez-vous créé.', type: 'success' });
      setTimeout(() => router.back(), 800);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la création');
      setSnack({ visible: true, message: e?.message || 'Erreur lors de la création', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nouveau rendez-vous</Text>
      <View style={styles.group}><Text style={styles.label}>ID Médecin</Text><TextInput style={styles.input} value={medecinId} onChangeText={setMedecinId} placeholder="6528b5e8b21f4c001f7a12a4" /></View>
      <View style={styles.group}>
        <Text style={styles.label}>Date (DD-MM-YYYY)</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text>{date || 'DD-MM-YYYY'}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dateObj || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(e, selected) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selected) {
                setDateObj(selected);
                const dd = String(selected.getDate()).padStart(2, '0');
                const mm = String(selected.getMonth() + 1).padStart(2, '0');
                const yyyy = String(selected.getFullYear());
                setDate(`${dd}-${mm}-${yyyy}`);
              }
            }}
          />
        )}
      </View>
      <View style={styles.group}>
        <Text style={styles.label}>Heure (HH:mm)</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
          <Text>{heure || 'HH:mm'}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={timeObj || new Date()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, selected) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (selected) {
                setTimeObj(selected);
                const hh = String(selected.getHours()).padStart(2, '0');
                const mm = String(selected.getMinutes()).padStart(2, '0');
                setHeure(`${hh}:${mm}`);
              }
            }}
          />
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={onSave}>
        <Text style={styles.primaryBtnText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
      </TouchableOpacity>
      <Snackbar visible={snack.visible} message={snack.message} type={snack.type} onHide={() => setSnack((s) => ({ ...s, visible: false }))} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, color: '#111827', marginBottom: 12 },
  group: { marginBottom: 12 },
  label: { fontSize: 13, color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  primaryBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  error: { color: '#DC2626', marginTop: 8 },
});
