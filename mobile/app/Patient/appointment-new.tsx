// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Snackbar from '../../components/Snackbar';
import { 
  createAppointment, 
  getProfile, 
  type UserProfile, 
  getAvailabilityByMedecin, 
  getMedecins 
} from '../../utils/api';

type AvailabilityType = {
  medecinId: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  disponible?: boolean;
};

export default function PatientAppointmentNewScreen() {
  const router = useRouter();

  const [medecins, setMedecins] = useState<any[]>([]);
  const [medecinId, setMedecinId] = useState('');
  const [availabilities, setAvailabilities] = useState<AvailabilityType[]>([]);
  const [datesDisponibles, setDatesDisponibles] = useState<string[]>([]);
  const [heuresDisponibles, setHeuresDisponibles] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityType | null>(null);
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [me, setMe] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info'
  });

  const typesConsultation = ['Suivi régulier', 'Consultation initiale', 'Urgence', 'Téléconsultation'];
  const [typeConsultation, setTypeConsultation] = useState('Suivi régulier');

  // Charger profil patient
  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        setMe(data.user);
      } catch (e: any) {
        setSnack({ visible: true, message: e?.message || 'Erreur de chargement du profil', type: 'error' });
      }
    })();
  }, []);

  // Charger disponibilités quand médecin sélectionné
  useEffect(() => {
    if (!medecinId) return;

    (async () => {
      try {
        const data: AvailabilityType[] = await getAvailabilityByMedecin(medecinId);
        setAvailabilities(data);

        const jours: string[] = [...new Set(data.map((a) => a.jour))];
        setDatesDisponibles(jours);

        setHeuresDisponibles([]);
        setDate('');
        setHeure('');
        setSelectedAvailability(null);
      } catch (e) {
        setSnack({ visible: true, message: 'Impossible de charger les disponibilités', type: 'error' });
      }
    })();
  }, [medecinId]);

  // Convertir nom du jour en date ISO
  const getNextDateFromDay = (dayName: string) => {
    const days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    const today = new Date();
    const dayIndex = days.indexOf(dayName.trim());
    const diff = (dayIndex + 7 - today.getDay()) % 7 || 7;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + diff);
    return nextDate.toISOString().split('T')[0]; // yyyy-mm-dd
  };

  const onSave = async () => {
    if (!me?._id) {
      setSnack({ visible: true, message: 'Profil non chargé.', type: 'error' });
      return;
    }
    if (!medecinId || !selectedAvailability || !heure) {
      setSnack({ visible: true, message: 'Tous les champs sont requis.', type: 'error' });
      return;
    }

    const isoDate = getNextDateFromDay(selectedAvailability.jour);

    try {
      setSaving(true);
      setError(null);
      await createAppointment({
        patientId: me._id,
        medecinId,
        date: isoDate,
        heure,
        typeConsultation,
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Prendre rendez-vous</Text>

      {/* Médecins */}
      <View style={styles.group}>
        <Text style={styles.label}>Choisir un médecin</Text>
        <View style={styles.cardContainer}>
          {medecins.map((medecin) => (
            <TouchableOpacity
              key={medecin._id}
              style={[styles.card, medecinId === medecin._id && styles.cardSelected]}
              onPress={() => setMedecinId(medecin._id)}
            >
              <Text style={styles.cardText}>Dr {medecin.nom} {medecin.prenom}</Text>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>{medecin.specialite}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Dates disponibles */}
      {datesDisponibles.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.label}>Date disponible</Text>
          <View style={styles.cardContainer}>
            {datesDisponibles.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.card, date === d && styles.cardSelected]}
                onPress={() => {
                  setDate(d);
                  const availability = availabilities.find((a) => a.jour === d);
                  if (availability) {
                    setSelectedAvailability(availability);
                    setHeuresDisponibles([`${availability.heureDebut} - ${availability.heureFin}`]);
                    setHeure('');
                  }
                }}
              >
                <Text style={styles.cardText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Heures disponibles */}
      {heuresDisponibles.length > 0 && (
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
      )}

      {/* Type de consultation */}
      <View style={styles.group}>
        <Text style={styles.label}>Type de consultation</Text>
        <View style={styles.cardContainer}>
          {typesConsultation.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.card, typeConsultation === t && styles.cardSelected]}
              onPress={() => setTypeConsultation(t)}
            >
              <Text style={styles.cardText}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

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
  container: { flex: 1, padding: 16, backgroundColor: '#F8FAFC' },
  title: { fontSize: 18, color: '#000', marginBottom: 12, fontWeight: 'bold' },
  group: { marginBottom: 12 },
  label: { fontSize: 13, color: '#374151', marginBottom: 6 },
  cardContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  cardSelected: { borderColor: '#2ccdd2', backgroundColor: '#E0F7F6' },
  cardText: { color: '#111827' },
  primaryBtn: { backgroundColor: '#2ccdd2', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  error: { color: '#DC2626', marginTop: 8 },
});
