import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import Snackbar from '../../components/Snackbar';
import { addMeasure, getProfile, type UserProfile, type MeasureType } from '../../utils/api';

const types: MeasureType[] = ['tension','glycemie','poids','pouls','temperature'];

export default function PatientMeasureAddScreen() {
  const router = useRouter();
  const [type, setType] = useState<MeasureType>('tension');
  const [value, setValue] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'info' });
  const [me, setMe] = useState<UserProfile | null>(null);
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateObj, setDateObj] = useState<Date | null>(null);
  const [timeObj, setTimeObj] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        setMe(data.user);
      } catch (e: any) {
        setSnack({ visible: true, message: e?.message || 'Erreur de chargement', type: 'error' });
      }
    })();
  }, []);

  const onSave = async () => {
    if (!value) {
      setSnack({ visible: true, message: 'Saisir la valeur.', type: 'error' });
      return;
    }
    // Contrainte selon type
    const onlyNumber = /^\d+(?:[\.,]\d+)?$/;
    const bpRegex = /^\d{2,3}\/\d{2,3}$/; // ex: 120/80
    switch (type) {
      case 'tension':
        if (!bpRegex.test(value.trim())) {
          setSnack({ visible: true, message: "Format tension invalide. Utilisez '120/80'.", type: 'error' });
          return;
        }
        // Plages recommandées
        {
          const [sysStr, diaStr] = value.trim().split('/');
          const sys = parseInt(sysStr, 10);
          const dia = parseInt(diaStr, 10);
          if (sys < 80 || sys > 200 || dia < 50 || dia > 130) {
            setSnack({ visible: true, message: 'Plages tension recommandées: systolique 80–200, diastolique 50–130.', type: 'error' });
            return;
          }
        }
        break;
      case 'glycemie':
      case 'poids':
      case 'temperature':
        if (!onlyNumber.test(value.trim())) {
          setSnack({ visible: true, message: 'Valeur numérique attendue.', type: 'error' });
          return;
        }
        {
          const v = parseFloat(value.trim().replace(',', '.'));
          if (type === 'glycemie' && (v < 40 || v > 600)) {
            setSnack({ visible: true, message: 'Glycémie attendue entre 40 et 600 mg/dL.', type: 'error' });
            return;
          }
          if (type === 'poids' && (v < 1 || v > 500)) {
            setSnack({ visible: true, message: 'Poids attendu entre 1 et 500 kg.', type: 'error' });
            return;
          }
          if (type === 'temperature' && (v < 34 || v > 43)) {
            setSnack({ visible: true, message: 'Température attendue entre 34 et 43 °C.', type: 'error' });
            return;
          }
        }
        break;
      case 'pouls':
        if (!/^\d+$/.test(value.trim())) {
          setSnack({ visible: true, message: 'Pouls doit être un entier (bpm).', type: 'error' });
          return;
        }
        {
          const v = parseInt(value.trim(), 10);
          if (v < 30 || v > 220) {
            setSnack({ visible: true, message: 'Pouls attendu entre 30 et 220 bpm.', type: 'error' });
            return;
          }
        }
        break;
    }

    // Validation date DD-MM-YYYY et conversion vers YYYY-MM-DD
    let dateISO: string | undefined = undefined;
    if (date) {
      const d = date.trim();
      const ddmmyyyy = /^\d{2}-\d{2}-\d{4}$/;
      if (!ddmmyyyy.test(d)) {
        setSnack({ visible: true, message: 'Date invalide. Format attendu: DD-MM-YYYY.', type: 'error' });
        return;
      }
      const [dd, mm, yyyy] = d.split('-');
      // Si l'heure est fournie, construire un ISO complet
      if (time) {
        if (!/^\d{2}:\d{2}$/.test(time.trim())) {
          setSnack({ visible: true, message: 'Heure invalide. Format: HH:mm.', type: 'error' });
          return;
        }
        dateISO = `${yyyy}-${mm}-${dd}T${time.trim()}:00Z`;
      } else {
        dateISO = `${yyyy}-${mm}-${dd}`;
      }
    }

    if (!me?.id) {
      setSnack({ visible: true, message: 'Profil non chargé.', type: 'error' });
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await addMeasure({ patientId: me.id, type, value: value.trim().replace(',', '.'), heure: dateISO, notes: notes.trim() || undefined });
      setSnack({ visible: true, message: 'Mesure ajoutée.', type: 'success' });
      setTimeout(() => router.back(), 800);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de l\'ajout');
      setSnack({ visible: true, message: e?.message || 'Erreur lors de l\'ajout', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Quel type de mesure souhaitez-vous ajouter ?</Text>

      <View style={styles.group}><Text style={styles.label}>Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {types.map(t => (
            <TouchableOpacity key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}>
              <Text style={[styles.chipText, type === t && { color: '#fff' }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Date et Heure</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text>{(date && time) ? `${date}, ${time}` : (date ? `${date}` : 'Choisir…')}</Text>
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
                setShowTimePicker(true);
              }
            }}
          />
        )}
        
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
                setTime(`${hh}:${mm}`);
              }
            }}
          />
        )}
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Valeur</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]} value={value} onChangeText={setValue}
            placeholder={type === 'tension' ? 'mmHg' : type === 'glycemie' ? 'mg/dL' : type === 'poids' ? 'kg' : type === 'pouls' ? 'bpm' : '°C'}
          />
          <Text style={styles.unit}>
            {type === 'tension' ? 'mmHg' : type === 'glycemie' ? 'mg/dL' : type === 'poids' ? 'kg' : type === 'pouls' ? 'bpm' : '°C'}
          </Text>
        </View>
        <Text style={styles.help}>
          {type === 'tension' ? "Ex: 120/80 mmHg" : type === 'glycemie' ? "Ex: 90 mg/dL" : type === 'poids' ? "Ex: 75.5 kg" : type === 'pouls' ? "Ex: 72 bpm" : "Ex: 37.2 °C"}
        </Text>
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Notes (facultatif)</Text>
        <TextInput style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} multiline placeholder="Ajouter une note..." />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={onSave}>
        <Text style={styles.primaryBtnText}>{saving ? 'Enregistrement…' : 'Sauvegarder'}</Text>
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
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#D1D5DB' },
  chipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  chipText: { color: '#111827', fontSize: 13 },
  help: { color: '#6B7280', fontSize: 12, marginTop: 6 },
  unit: { color: '#111827', backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
});
