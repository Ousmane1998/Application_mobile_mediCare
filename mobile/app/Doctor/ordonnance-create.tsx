import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authFetch, getProfile } from '@/utils/api';

type Medication = {
  id: string;
  nom: string;
  dosage: string;
  frequence: string;
  duree: string;
};

const OrdonnanceCreateScreen = () => {
  const router = useRouter();
  const { patientId, measureId } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [medecinId, setMedecinId] = useState<string | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const profile = await getProfile();
      setMedecinId(profile.user._id);

      if (patientId) {
        const patientData = await authFetch(`/users/${patientId}`);
        setPatient(patientData.user || patientData);
      }
    } catch (err: any) {
      console.error('❌ Erreur :', err);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        id: Date.now().toString(),
        nom: '',
        dosage: '',
        frequence: '',
        duree: '',
      },
    ]);
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter((m) => m.id !== id));
  };

  const updateMedication = (id: string, field: string, value: string) => {
    setMedications(
      medications.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      )
    );
  };

  const handleSubmit = async () => {
    if (!patientId || !medecinId) {
      Alert.alert('Erreur', 'Données manquantes');
      return;
    }

    if (medications.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un médicament');
      return;
    }

    // Vérifier que tous les médicaments sont complets
    const incomplete = medications.some(
      (m) => !m.nom.trim() || !m.dosage.trim() || !m.frequence.trim() || !m.duree.trim()
    );

    if (incomplete) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs des médicaments');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        patientId,
        medecinId,
        medicaments: medications.map((m) => ({
          nom: m.nom.trim(),
          dosage: m.dosage.trim(),
          frequence: m.frequence.trim(),
          duree: m.duree.trim(),
        })),
        notes: notes.trim(),
        measureId: measureId || undefined,
      };

      console.log('📤 Envoi ordonnance :', payload);
      const response = await authFetch('/ordonnances', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('✅ Ordonnance créée :', response);
      Alert.alert('Succès', 'Ordonnance envoyée au patient');
      router.back();
    } catch (err: any) {
      console.error('❌ Erreur :', err);
      Alert.alert('Erreur', err?.message || 'Impossible de créer l\'ordonnance');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2ccdd2" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Créer une Ordonnance</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Patient Info */}
        {patient && (
          <View style={styles.patientCard}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientInitials}>
                {patient.prenom?.[0]}{patient.nom?.[0]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName}>{patient.prenom} {patient.nom}</Text>
              <Text style={styles.patientEmail}>{patient.email}</Text>
            </View>
          </View>
        )}

        {/* Medications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Médicaments</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={addMedication}
            >
              <Ionicons name="add-circle" size={24} color="#2ccdd2" />
            </TouchableOpacity>
          </View>

          {medications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="medical-outline" size={40} color="#d1d5db" />
              <Text style={styles.emptyStateText}>Aucun médicament ajouté</Text>
              <Text style={styles.emptyStateSubtext}>Cliquez sur + pour ajouter un médicament</Text>
            </View>
          ) : (
            medications.map((med, index) => (
              <View key={med.id} style={styles.medicationCard}>
                <View style={styles.medicationHeader}>
                  <Text style={styles.medicationIndex}>Médicament {index + 1}</Text>
                  <TouchableOpacity
                    onPress={() => removeMedication(med.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Nom du médicament"
                  placeholderTextColor="#9CA3AF"
                  value={med.nom}
                  onChangeText={(text) => updateMedication(med.id, 'nom', text)}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Dosage (ex: 500mg)"
                  placeholderTextColor="#9CA3AF"
                  value={med.dosage}
                  onChangeText={(text) => updateMedication(med.id, 'dosage', text)}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Fréquence (ex: 2x par jour)"
                  placeholderTextColor="#9CA3AF"
                  value={med.frequence}
                  onChangeText={(text) => updateMedication(med.id, 'frequence', text)}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Durée (ex: 7 jours)"
                  placeholderTextColor="#9CA3AF"
                  value={med.duree}
                  onChangeText={(text) => updateMedication(med.id, 'duree', text)}
                />
              </View>
            ))
          )}
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes et Recommandations</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ajoutez des notes ou des recommandations..."
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{notes.length}/500</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (submitting || medications.length === 0) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || medications.length === 0}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitButtonText}>Envoyer l'Ordonnance</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OrdonnanceCreateScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },

  // Patient Card
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2ccdd2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInitials: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  patientName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  patientEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Section
  section: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    padding: 4,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },

  // Medication Card
  medicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationIndex: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  removeButton: {
    padding: 4,
  },

  // Input
  input: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    marginBottom: 10,
  },
  textArea: {
    paddingVertical: 12,
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginBottom: 12,
  },

  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2ccdd2',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
