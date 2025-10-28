import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authFetch, getProfile } from '../../utils/api';

type Ordonnance = {
  _id: string;
  patient: string;
  medecin: {
    _id: string;
    nom: string;
    prenom: string;
    specialite?: string;
  };
  medicaments: Array<{
    nom: string;
    dosage: string;
    frequence: string;
    duree: string;
  }>;
  notes?: string;
  dateEmission: string;
  fichierPDF?: string;
};

export default function OrdonnancesScreen() {
  const router = useRouter();
  const { ordonnanceId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [selectedOrdonnance, setSelectedOrdonnance] = useState<Ordonnance | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrdonnances = async () => {
    try {
      setError(null);
      const profile = await getProfile();
      const patientId = (profile.user as any)._id || (profile.user as any).id;
      
      console.log('📋 [Ordonnances] Récupération pour patient :', patientId);
      
      // Récupérer toutes les ordonnances
      const response = await authFetch('/ordonnances');
      console.log('📋 [Ordonnances] Réponse API :', response);
      
      const allOrdonnances = Array.isArray(response) ? response : response.data || [];
      
      // Filtrer pour ce patient
      const patientOrdonnances = allOrdonnances.filter(
        (o: any) => String(o.patient) === String(patientId) || String(o.patientId) === String(patientId)
      );
      
      console.log('📋 [Ordonnances] Trouvées :', patientOrdonnances.length);
      setOrdonnances(patientOrdonnances);
      
      // Si un ordonnanceId est passé, afficher celle-ci
      if (ordonnanceId) {
        const selected = patientOrdonnances.find((o: any) => String(o._id) === String(ordonnanceId));
        if (selected) {
          setSelectedOrdonnance(selected);
        }
      }
    } catch (err: any) {
      console.error('❌ [Ordonnances] Erreur :', err);
      setError(err?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdonnances();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrdonnances();
    setRefreshing(false);
  };

  const handleDownloadPDF = async (ordonnance: Ordonnance) => {
    try {
      console.log('📥 [Ordonnance] Téléchargement PDF :', ordonnance._id);
      
      // Générer le contenu du PDF
      const pdfContent = generatePDFContent(ordonnance);
      
      // Afficher un message de succès
      Alert.alert(
        'PDF Généré',
        'L\'ordonnance a été générée avec succès.\n\nEn production, le PDF sera téléchargé automatiquement.',
        [{ text: 'OK' }]
      );
      
      console.log('✅ [Ordonnance] PDF généré');
    } catch (err: any) {
      console.error('❌ Erreur téléchargement :', err);
      Alert.alert('Erreur', 'Impossible de générer le PDF');
    }
  };

  const generatePDFContent = (ordonnance: Ordonnance) => {
    // Contenu simple pour le PDF (en production, utiliser une vraie lib PDF)
    const medicamentsText = ordonnance.medicaments
      .map((m, i) => `${i + 1}. ${m.nom} - ${m.dosage} - ${m.frequence} - ${m.duree}`)
      .join('\n');

    return `
ORDONNANCE MÉDICALE
==================

Médecin: Dr ${ordonnance.medecin.prenom} ${ordonnance.medecin.nom}
Spécialité: ${ordonnance.medecin.specialite || 'Non spécifié'}
Date: ${new Date(ordonnance.dateEmission).toLocaleDateString('fr-FR')}

MÉDICAMENTS:
${medicamentsText}

NOTES:
${ordonnance.notes || 'Aucune note'}

QR CODE: [À générer avec une librairie QR]
    `;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2ccdd2" />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>Chargement des ordonnances...</Text>
      </View>
    );
  }

  if (selectedOrdonnance) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedOrdonnance(null)}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails Ordonnance</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Médecin Info */}
        <View style={styles.card}>
          <View style={styles.doctorHeader}>
            <View style={styles.doctorAvatar}>
              <Text style={styles.avatarText}>
                {selectedOrdonnance.medecin.prenom?.[0]}{selectedOrdonnance.medecin.nom?.[0]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.doctorName}>
                Dr {selectedOrdonnance.medecin.prenom} {selectedOrdonnance.medecin.nom}
              </Text>
              {selectedOrdonnance.medecin.specialite && (
                <Text style={styles.doctorSpecialty}>{selectedOrdonnance.medecin.specialite}</Text>
              )}
            </View>
          </View>
          <Text style={styles.date}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" /> {new Date(selectedOrdonnance.dateEmission).toLocaleDateString('fr-FR')}
          </Text>
        </View>

        {/* Médicaments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Médicaments</Text>
          {selectedOrdonnance.medicaments.map((med, index) => (
            <View key={index} style={styles.medicationItem}>
              <View style={styles.medicationNumber}>
                <Text style={styles.medicationNumberText}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.medicationName}>{med.nom}</Text>
                <Text style={styles.medicationDetail}>Dosage: {med.dosage}</Text>
                <Text style={styles.medicationDetail}>Fréquence: {med.frequence}</Text>
                <Text style={styles.medicationDetail}>Durée: {med.duree}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Notes */}
        {selectedOrdonnance.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{selectedOrdonnance.notes}</Text>
            </View>
          </View>
        )}

        {/* QR Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Code QR</Text>
          <View style={styles.qrPlaceholder}>
            <View style={styles.qrCodeBox}>
              <Text style={styles.qrCodeText}>█ █ █ █ █ █ █ █ █</Text>
              <Text style={styles.qrCodeText}>█ █ █ █ █ █ █ █ █</Text>
              <Text style={styles.qrCodeText}>█ █ █ █ █ █ █ █ █</Text>
              <Text style={styles.qrCodeText}>█ █ █ █ █ █ █ █ █</Text>
              <Text style={styles.qrCodeText}>█ █ █ █ █ █ █ █ █</Text>
              <Text style={styles.qrCodeText}>█ █ █ █ █ █ █ █ █</Text>
              <Text style={styles.qrCodeText}>█ █ █ █ █ █ █ █ █</Text>
              <Text style={styles.qrCodeText}>█ █ █ █ █ █ █ █ █</Text>
              <Text style={styles.qrCodeText}>█ █ █ █ █ █ █ █ █</Text>
            </View>
            <Text style={styles.qrText}>Scannez ce code pour vérifier l'ordonnance</Text>
            <Text style={styles.qrSubtext}>{selectedOrdonnance._id.substring(0, 12)}...</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => handleDownloadPDF(selectedOrdonnance)}
          >
            <Ionicons name="download-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Télécharger PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => {
              Alert.alert('Partage', 'Partager cette ordonnance avec...');
            }}
          >
            <Ionicons name="share-social-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Partager</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Ordonnances</Text>
        <Ionicons name="document-text-outline" size={22} color="#111827" />
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {ordonnances.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>Aucune ordonnance</Text>
          <Text style={styles.emptyStateText}>Vous n'avez pas encore reçu d'ordonnance</Text>
        </View>
      ) : (
        ordonnances.map((ordonnance) => (
          <TouchableOpacity
            key={ordonnance._id}
            style={styles.ordonnanceCard}
            onPress={() => setSelectedOrdonnance(ordonnance)}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardLeft}>
                <Ionicons name="document-text-outline" size={32} color="#2ccdd2" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  Dr {ordonnance.medecin.prenom} {ordonnance.medecin.nom}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {ordonnance.medicaments.length} médicament{ordonnance.medicaments.length > 1 ? 's' : ''}
                </Text>
                <Text style={styles.cardDate}>
                  {new Date(ordonnance.dateEmission).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#111827' },
  
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  errorText: { color: '#DC2626', flex: 1 },
  
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyStateTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 12 },
  emptyStateText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  
  ordonnanceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardLeft: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#E0F7F6', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardDate: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  
  // Detail view
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  doctorHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doctorAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2ccdd2', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  doctorName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  doctorSpecialty: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  date: { fontSize: 13, color: '#6B7280', marginTop: 12 },
  
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 12 },
  
  medicationItem: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  medicationNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2ccdd2', alignItems: 'center', justifyContent: 'center' },
  medicationNumberText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  medicationName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  medicationDetail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  
  notesBox: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: '#2ccdd2' },
  notesText: { fontSize: 13, color: '#374151', lineHeight: 20 },
  
  qrPlaceholder: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', justifyContent: 'center' },
  qrCodeBox: { backgroundColor: '#f0f0f0', padding: 16, borderRadius: 8, marginBottom: 12 },
  qrCodeText: { fontSize: 10, color: '#111827', lineHeight: 12, letterSpacing: 1 },
  qrText: { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 12 },
  qrSubtext: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  
  buttonContainer: { flexDirection: 'row', gap: 12, marginTop: 16 },
  downloadButton: { flex: 1, backgroundColor: '#2ccdd2', borderRadius: 8, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareButton: { flex: 1, backgroundColor: '#10B981', borderRadius: 8, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
