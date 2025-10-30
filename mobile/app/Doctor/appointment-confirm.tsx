import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authFetch } from '@/utils/api';

type Appointment = {
  _id: string;
  patientId: any;
  medecinId: any;
  date: string;
  heure: string;
  typeConsultation: string;
  statut: string;
};

const AppointmentConfirmScreen = () => {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchAppointment();
  }, []);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      if (appointmentId) {
        const data = await authFetch(`/appointments/${appointmentId}`);
        console.log('📅 Rendez-vous reçu :', data);
        setAppointment(data.appointment || data);
      }
    } catch (err: any) {
      console.error('❌ Erreur :', err);
      Alert.alert('Erreur', 'Impossible de charger le rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!appointmentId) return;

    try {
      setSubmitting(true);
      const response = await authFetch(`/appointments/${appointmentId}`, {
        method: 'PUT',
        body: JSON.stringify({ statut: 'confirme' }),
      });

      console.log('✅ Rendez-vous confirmé :', response);
      Alert.alert('Succès', 'Rendez-vous confirmé');
      router.back();
    } catch (err: any) {
      console.error('❌ Erreur :', err);
      Alert.alert('Erreur', err?.message || 'Impossible de confirmer le rendez-vous');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!appointmentId) return;

    Alert.alert(
      'Rejeter le rendez-vous',
      'Êtes-vous sûr de vouloir rejeter ce rendez-vous?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              const response = await authFetch(`/appointments/${appointmentId}`, {
                method: 'PUT',
                body: JSON.stringify({ statut: 'annule' }),
              });

              console.log('✅ Rendez-vous rejeté :', response);
              Alert.alert('Succès', 'Rendez-vous rejeté');
              router.back();
            } catch (err: any) {
              console.error('❌ Erreur :', err);
              Alert.alert('Erreur', err?.message || 'Impossible de rejeter le rendez-vous');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2ccdd2" />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={50} color="#EF4444" />
        <Text style={{ marginTop: 12, color: '#111827' }}>
          Rendez-vous non trouvé
        </Text>
        <TouchableOpacity
          style={[styles.button, { marginTop: 20 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const patient = appointment.patientId;
  const appointmentDate = new Date(`${appointment.date} ${appointment.heure || '00:00'}`);
  const isUpcoming = appointmentDate > new Date();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Demande de Rendez-vous</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Status Badge */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                appointment.statut === 'en_attente'
                  ? '#FEF3C7'
                  : appointment.statut === 'confirme'
                  ? '#D1FAE5'
                  : '#FEE2E2',
            },
          ]}
        >
          <Ionicons
            name={
              appointment.statut === 'en_attente'
                ? 'time-outline'
                : appointment.statut === 'confirme'
                ? 'checkmark-circle'
                : 'close-circle'
            }
            size={20}
            color={
              appointment.statut === 'en_attente'
                ? '#D97706'
                : appointment.statut === 'confirme'
                ? '#059669'
                : '#DC2626'
            }
          />
          <Text
            style={[
              styles.statusText,
              {
                color:
                  appointment.statut === 'en_attente'
                    ? '#92400E'
                    : appointment.statut === 'confirme'
                    ? '#065F46'
                    : '#7F1D1D',
              },
            ]}
          >
            {appointment.statut === 'en_attente'
              ? 'En attente de confirmation'
              : appointment.statut === 'confirme'
              ? 'Confirmé'
              : 'Annulé'}
          </Text>
        </View>
      </View>

      {/* Patient Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient</Text>
        <View style={styles.patientCard}>
          <View style={styles.patientAvatar}>
            <Text style={styles.patientInitials}>
              {patient?.prenom?.[0]}{patient?.nom?.[0]}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.patientName}>
              {patient?.prenom} {patient?.nom}
            </Text>
            <Text style={styles.patientEmail}>{patient?.email}</Text>
            {patient?.telephone && (
              <Text style={styles.patientPhone}>📞 {patient.telephone}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Appointment Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détails du Rendez-vous</Text>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#2ccdd2" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {appointmentDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color="#2ccdd2" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.detailLabel}>Heure</Text>
              <Text style={styles.detailValue}>{appointment.heure || 'Non spécifiée'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Ionicons name="medical-outline" size={20} color="#2ccdd2" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.detailLabel}>Type de Consultation</Text>
              <Text style={styles.detailValue}>{appointment.typeConsultation}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Info Message */}
      {isUpcoming && appointment.statut === 'en_attente' && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2ccdd2" />
          <Text style={styles.infoText}>
            Confirmez ou rejetez cette demande de rendez-vous. Le patient sera notifié de votre décision.
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      {appointment.statut === 'en_attente' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={handleReject}
            disabled={submitting}
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={styles.buttonText}>Rejeter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, submitting && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>Confirmer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

export default AppointmentConfirmScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
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
    color: '#111827',
    marginTop:40
  },

  // Status
  statusContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  statusText: {
    fontSize: 14,
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  },

  // Patient Card
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2ccdd2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInitials: {
    fontSize: 16,
    color: '#fff',
  },
  patientName: {
    fontSize: 14,
    color: '#111827',
  },
  patientEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  patientPhone: {
    fontSize: 12,
    color: '#2ccdd2',
    marginTop: 2,
  },

  // Detail Card
  detailCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    marginTop: 4,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F7F6',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2ccdd2',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0f766e',
    lineHeight: 18,
  },

  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 20,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    gap: 8,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  button: {
    backgroundColor: '#2ccdd2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
});
