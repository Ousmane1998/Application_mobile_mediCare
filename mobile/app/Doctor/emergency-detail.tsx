// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DoctorEmergencyDetailScreen() {
  const router = useRouter();
  const { emergencyId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [emergency, setEmergency] = useState<any>(null);

  useEffect(() => {
    // TODO: Récupérer les détails de l'alerte via API
    // Pour maintenant, on simule les données
    setTimeout(() => {
      setEmergency({
        patientInfo: {
          nom: 'Diallo',
          prenom: 'Aminata',
          email: 'aminata@example.com',
          telephone: '77123456',
          pathologie: 'Diabète'
        },
        location: {
          lat: 14.6937,
          lng: -17.4441,
          address: 'Dakar, Sénégal'
        },
        lastMeasure: {
          type: 'glycemie',
          value: '250 mg/dL',
          date: new Date().toISOString()
        },
        doctorInfo: {
          nom: 'Sall',
          prenom: 'Mamadou',
          telephone: '+221770002233',
          specialite: 'Cardiologie'
        },
        timestamp: new Date().toISOString()
      });
      setLoading(false);
    }, 500);
  }, [emergencyId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>Chargement...</Text>
      </View>
    );
  }

  if (!emergency) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={50} color="#DC2626" />
        <Text style={{ marginTop: 12, fontSize: 16, color: '#111827', fontWeight: '600' }}>Alerte non trouvée</Text>
        <TouchableOpacity style={[styles.btn, { marginTop: 20 }]} onPress={() => router.back()}>
          <Text style={styles.btnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111827" marginTop={40}/>
          </TouchableOpacity>
          <Text style={styles.title}>Détail Alerte SOS</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Emergency Alert Badge */}
        <View style={styles.emergencyBadge}>
          <Ionicons name="call" size={24} color="#fff" />
          <Text style={styles.emergencyBadgeText}>🚨 ALERTE D'URGENCE</Text>
        </View>

        {/* Patient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du Patient</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#2ccdd2" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.label}>Nom</Text>
                <Text style={styles.value}>{emergency.patientInfo?.prenom} {emergency.patientInfo?.nom}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { marginTop: 12 }]}>
              <Ionicons name="mail-outline" size={20} color="#2ccdd2" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{emergency.patientInfo?.email}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { marginTop: 12 }]}>
              <Ionicons name="call-outline" size={20} color="#2ccdd2" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.label}>Téléphone</Text>
                <Text style={styles.value}>{emergency.patientInfo?.telephone}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { marginTop: 12 }]}>
              <Ionicons name="medical-outline" size={20} color="#2ccdd2" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.label}>Pathologie</Text>
                <Text style={styles.value}>{emergency.patientInfo?.pathologie}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Position du Patient</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#2ccdd2" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.label}>Adresse</Text>
                <Text style={styles.value}>{emergency.location?.address}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { marginTop: 12 }]}>
              <Ionicons name="map-outline" size={20} color="#2ccdd2" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.label}>Coordonnées GPS</Text>
                <Text style={styles.value}>Lat: {emergency.location?.lat?.toFixed(4)}</Text>
                <Text style={styles.value}>Lng: {emergency.location?.lng?.toFixed(4)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Last Measure */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dernière Mesure</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="pulse-outline" size={20} color="#2ccdd2" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.label}>{emergency.lastMeasure?.type}</Text>
                <Text style={styles.value}>{emergency.lastMeasure?.value}</Text>
                <Text style={styles.timestamp}>{new Date(emergency.lastMeasure?.date).toLocaleString('fr-FR')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Doctor Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Médecin Référent</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.doctorAvatar}>
                <Text style={styles.doctorAvatarText}>
                  {emergency.doctorInfo?.prenom?.[0]}{emergency.doctorInfo?.nom?.[0]}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.value}>Dr {emergency.doctorInfo?.prenom} {emergency.doctorInfo?.nom}</Text>
                <Text style={styles.label}>{emergency.doctorInfo?.specialite}</Text>
                <Text style={styles.label}>{emergency.doctorInfo?.telephone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Timestamp */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heure de l'Alerte</Text>
          <View style={styles.card}>
            <Text style={styles.value}>{new Date(emergency.timestamp).toLocaleString('fr-FR')}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.callBtn} onPress={() => {
            // TODO: Implémenter l'appel
            alert('Appel au patient: ' + emergency.patientInfo?.telephone);
          }}>
            <Ionicons name="call" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.callBtnText}>Appeler le Patient</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.locationBtn} onPress={() => {
            // TODO: Ouvrir la carte
            alert('Ouvrir la carte: ' + emergency.location?.address);
          }}>
            <Ionicons name="map" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.locationBtnText}>Voir sur la Carte</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.messageBtn} onPress={() => {
            router.push({
              pathname: '/Doctor/chat',
              params: { patientId: emergency.patientInfo?.id }
            });
          }}>
            <Ionicons name="chatbubbles" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.messageBtnText}>Envoyer un Message</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingTop: 16 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, color: '#111827', fontWeight: 'bold',marginTop:40 },

  emergencyBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  emergencyBadgeText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, color: '#374151', fontWeight: '600', marginBottom: 10 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  label: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  value: { fontSize: 14, color: '#111827', fontWeight: '500' },
  timestamp: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  doctorAvatarText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  btn: {
    backgroundColor: '#2ccdd2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  callBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  callBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  locationBtn: {
    backgroundColor: '#2ccdd2',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  locationBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  messageBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  messageBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
