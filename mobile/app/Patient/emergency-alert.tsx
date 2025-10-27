// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Snackbar from '../../components/Snackbar';
import { getProfile, getMedecinById, getMeasuresHistory, type UserProfile } from '../../utils/api';
import * as Location from 'expo-location';

export default function EmergencyAlertScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<UserProfile | null>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [lastMeasure, setLastMeasure] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info'
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getProfile();
        const patientId = (data.user as any)._id || (data.user as any).id;
        setMe(data.user);
        
        // Récupérer les infos du médecin assigné
        if (data.user?.medecinId) {
          try {
            const medData = await getMedecinById(String(data.user.medecinId));
            const medUser = (medData as any).user || medData;
            setDoctor({
              id: data.user.medecinId,
              nom: medUser.nom || 'Médecin',
              prenom: medUser.prenom || '',
              telephone: medUser.telephone || '',
              email: medUser.email || '',
              specialite: medUser.specialite || '',
              hopital: medUser.hopital || '',
              initials: `${medUser.prenom?.[0] || 'M'}${medUser.nom?.[0] || 'D'}`
            });
          } catch (e) {
            console.error('Erreur médecin:', e);
          }
        }

        // Récupérer la dernière mesure
        try {
          const history = await getMeasuresHistory(patientId);
          if (Array.isArray(history) && history.length > 0) {
            const sorted = [...history].sort((a, b) => 
              new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime()
            );
            setLastMeasure(sorted[0]);
          }
        } catch (e) {
          console.error('Erreur mesures:', e);
        }

        // Récupérer la localisation réelle
        try {
          console.log('📍 Demande de permission de localisation...');
          const { status } = await Location.requestForegroundPermissionsAsync();
          
          if (status !== 'granted') {
            console.warn('⚠️ Permission de localisation refusée');
            setLocation({
              lat: 14.6937,
              lng: -17.4441,
              address: 'Dakar, Sénégal (localisation par défaut)'
            });
          } else {
            console.log('✅ Permission de localisation accordée');
            const currentLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High
            });

            const { latitude, longitude } = currentLocation.coords;
            console.log(`📍 Position obtenue: ${latitude}, ${longitude}`);

            // Reverse geocoding pour obtenir l'adresse
            try {
              const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude,
                longitude
              });

              const address = reverseGeocode[0]
                ? `${reverseGeocode[0].city || ''}, ${reverseGeocode[0].region || ''}, ${reverseGeocode[0].country || ''}`
                : 'Adresse inconnue';

              console.log(`📍 Adresse: ${address}`);

              setLocation({
                lat: latitude,
                lng: longitude,
                address: address.trim()
              });
            } catch (e) {
              console.error('⚠️ Erreur reverse geocoding:', e);
              setLocation({
                lat: latitude,
                lng: longitude,
                address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              });
            }
          }
        } catch (e) {
          console.error('❌ Erreur localisation:', e);
          setLocation({
            lat: 14.6937,
            lng: -17.4441,
            address: 'Dakar, Sénégal (localisation par défaut)'
          });
        }
      } catch (e: any) {
        console.error('Erreur:', e);
        setSnack({ visible: true, message: 'Erreur de chargement', type: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSendAlert = async () => {
    Alert.alert(
      'Confirmer l\'alerte SOS',
      'Êtes-vous sûr de vouloir envoyer une alerte d\'urgence à votre médecin?',
      [
        { text: 'Annuler', onPress: () => {}, style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async () => {
            try {
              setSending(true);
              
              // Préparer les données de l'alerte
              const alertData = {
                patientId: (me as any)?._id || (me as any)?.id,
                medecinId: doctor?.id,
                location: location,
                lastMeasure: lastMeasure,
                patientInfo: {
                  nom: me?.nom,
                  prenom: me?.prenom,
                  email: me?.email,
                  telephone: me?.telephone,
                  pathologie: (me as any)?.pathologie
                },
                doctorInfo: doctor,
                timestamp: new Date().toISOString()
              };

              // Appeler l'API pour envoyer l'alerte
              const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'}/api/emergency/alert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alertData)
              });

              if (!response.ok) throw new Error('Erreur lors de l\'envoi');

              console.log('✅ Alerte SOS envoyée');
              setSnack({ visible: true, message: '✅ Alerte SOS envoyée avec succès!', type: 'success' });
              setTimeout(() => router.back(), 1500);
            } catch (e: any) {
              console.error('Erreur:', e);
              setSnack({ visible: true, message: 'Erreur lors de l\'envoi: ' + e.message, type: 'error' });
            } finally {
              setSending(false);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2ccdd2" />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Alerte SOS</Text>
          <TouchableOpacity onPress={() => router.push('/Patient/profile')}>
            <Ionicons name="person-circle" size={32} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Warning Box */}
        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={20} color="#DC2626" />
          <Text style={styles.warningText}>Cette fonctionnalité est réservée aux situations d'urgence uniquement.</Text>
        </View>

        {/* Emergency Icon */}
        <View style={styles.emergencyIconContainer}>
          <View style={styles.emergencyIcon}>
            <Ionicons name="call" size={48} color="#fff" />
          </View>
          <Text style={styles.emergencyTitle}>Alerte d'urgence</Text>
          <Text style={styles.emergencySubtitle}>Envoyer votre position et une alerte à votre médecin référent</Text>
        </View>

        {/* Doctor Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Médecin référent</Text>
          <View style={styles.doctorCard}>
            <View style={styles.doctorAvatar}>
              <Text style={styles.doctorAvatarText}>{doctor?.initials || 'MD'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.doctorName}>Dr {doctor?.prenom} {doctor?.nom}</Text>
              <Text style={styles.doctorPhone}>{doctor?.telephone}</Text>
            </View>
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Votre position actuelle</Text>
          <View style={styles.locationCard}>
            <Ionicons name="location" size={20} color="#2ccdd2" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.locationAddress}>{location?.address}</Text>
              <Text style={styles.locationCoords}>Lat: {location?.lat?.toFixed(4)}, Lng: {location?.lng?.toFixed(4)}</Text>
            </View>
          </View>
        </View>

        {/* What will be sent */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ce qui sera envoyé :</Text>
          <View style={styles.checklistBox}>
            <View style={styles.checklistItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.checklistText}>Votre position GPS actuelle</Text>
            </View>
            <View style={styles.checklistItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.checklistText}>Notification push urgente au médecin</Text>
            </View>
            <View style={styles.checklistItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.checklistText}>Vos dernières mesures de santé</Text>
            </View>
            <View style={styles.checklistItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.checklistText}>Vos informations médicales essentielles</Text>
            </View>
          </View>
        </View>

        {/* Last Measure */}
        {lastMeasure && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dernière mesure</Text>
            <View style={styles.measureCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name={lastMeasure.type === 'tension' ? 'trending-up' : 'pulse'} size={20} color="#2ccdd2" />
                <Text style={{ marginLeft: 8, fontSize: 14, color: '#111827', fontWeight: '600', textTransform: 'capitalize' }}>
                  {lastMeasure.type}
                </Text>
              </View>
              <Text style={{ fontSize: 18, color: '#111827', fontWeight: '600', marginBottom: 4 }}>
                {lastMeasure.value}
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                {new Date(lastMeasure.date || lastMeasure.createdAt).toLocaleString('fr-FR')}
              </Text>
            </View>
          </View>
        )}

        {/* Emergency Numbers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Numéros d'urgence</Text>
          <View style={styles.emergencyNumbersBox}>
            <View style={styles.emergencyNumberItem}>
              <Ionicons name="call" size={20} color="#2ccdd2" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.emergencyNumberLabel}>SAMU</Text>
                <Text style={styles.emergencyNumber}>15</Text>
              </View>
            </View>
            <View style={styles.emergencyNumberItem}>
              <Ionicons name="call" size={20} color="#2ccdd2" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.emergencyNumberLabel}>Pompiers</Text>
                <Text style={styles.emergencyNumber}>18</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Send Alert Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.sendBtn, sending && { opacity: 0.7 }]}
          disabled={sending}
          onPress={handleSendAlert}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.sendBtnText}>Envoyer l'alerte SOS</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>
      </View>

      {/* Snackbar */}
      <Snackbar
        visible={snack.visible}
        message={snack.message}
        type={snack.type}
        onHide={() => setSnack((s) => ({ ...s, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingTop: 16 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, color: '#111827', fontWeight: 'bold' },

  warningBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20
  },
  warningText: { color: '#DC2626', fontSize: 13, flex: 1, fontWeight: '500' },

  emergencyIconContainer: { alignItems: 'center', marginBottom: 24 },
  emergencyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F87171',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  emergencyTitle: { fontSize: 18, color: '#DC2626', fontWeight: '600', marginBottom: 4 },
  emergencySubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, color: '#374151', fontWeight: '600', marginBottom: 10 },

  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  doctorAvatarText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  doctorName: { fontSize: 14, color: '#111827', fontWeight: '600' },
  doctorPhone: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  locationAddress: { fontSize: 14, color: '#111827', fontWeight: '500' },
  locationCoords: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  checklistBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  checklistText: { fontSize: 13, color: '#111827', flex: 1 },

  measureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },

  emergencyNumbersBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  emergencyNumberItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  emergencyNumberLabel: { fontSize: 12, color: '#6B7280' },
  emergencyNumber: { fontSize: 16, color: '#111827', fontWeight: '600', marginTop: 2 },

  buttonContainer: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  sendBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  cancelBtnText: { color: '#111827', fontSize: 14, fontWeight: '500' }
});
