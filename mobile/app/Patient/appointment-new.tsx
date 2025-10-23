import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Snackbar from '../../components/Snackbar';
import { createAppointment, getProfile, type UserProfile } from '../../utils/api';
import { Picker } from '@react-native-picker/picker';


export default function PatientAppointmentNewScreen() {
  const router = useRouter();
  const [medecinId, setMedecinId] = useState('');
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [typeConsultation, setTypeConsultation] = useState('Suivi régulier');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'info' });
  const [me, setMe] = useState<UserProfile | null>(null);

  const datesDisponibles = ['05-06-2024', '06-06-2024', '07-06-2024'];
  const heuresDisponibles = ['09:00', '09:30', '10:00', '11:00'];
  const typesConsultation = ['Suivi régulier', 'Consultation initiale', 'Urgence', 'Téléconsultation'];

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
    if (!me?.id) {
      setSnack({ visible: true, message: 'Profil non chargé.', type: 'error' });
      return;
    }
    if (!medecinId || !date || !heure) {
      setSnack({ visible: true, message: 'Tous les champs sont requis.', type: 'error' });
      return;
    }
    const [dd, mm, yyyy] = date.trim().split('-');
    const iso = `${yyyy}-${mm}-${dd}`;
    try {
      setSaving(true);
      setError(null);
      await createAppointment({
        patientId: me.id,
        medecinId,
        date: iso,
        heure,
        typeConsultation: 'Suivi régulier',
        statut: 'en_attente',
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Prendre rendez-vous</Text>

      <View style={styles.group}>
        <Text style={styles.label}>ID Médecin</Text>
        <TextInput
          style={styles.input}
          value={medecinId}
          onChangeText={setMedecinId}
          placeholder="6528b5e8b21f4c001f7a12a4"
        />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Date disponible</Text>
        <View style={styles.cardContainer}>
          {datesDisponibles.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.card, date === d && styles.cardSelected]}
              onPress={() => setDate(d)}
            >
              <Text style={styles.cardText}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Heure disponible</Text>
        <View style={styles.cardContainer}>
          {heuresDisponibles.map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.card, heure === h && styles.cardSelected]}
              onPress={() => setHeure(h)}
            >
              <Text style={styles.cardText}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Type de consultation</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={typeConsultation}
            onValueChange={(itemValue) => setTypeConsultation(itemValue)}
          >
            {typesConsultation.map((type) => (
              <Picker.Item key={type} label={type} value={type} />
            ))}
          </Picker>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
        disabled={saving}
        onPress={onSave}
      >
        <Text style={styles.primaryBtnText}>
          {saving ? 'Enregistrement…' : 'Confirmer le rendez-vous'}
        </Text>
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
  container: { padding: 16 },
  title: { fontSize: 18, color: '#111827', marginBottom: 12 },
  group: { marginBottom: 12 },
  label: { fontSize: 13, color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cardSelected: {
    borderColor: '#2ccdd2',
    backgroundColor: '#E0F7F6',
  },
  cardText: {
    color: '#111827',
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryBtn: {
    backgroundColor: '#2ccdd2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  error: {
    color: '#DC2626',
    marginTop: 8,
  },
});
