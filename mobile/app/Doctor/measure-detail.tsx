import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authFetch, getProfile } from '@/utils/api';

type Measure = {
  _id: string;
  patientId: string;
  type: string;
  value: string;
  date: string;
};

type Patient = {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  pathologie?: string;
};

const MeasureDetailScreen = () => {
  const router = useRouter();
  const { measureId, patientId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [measure, setMeasure] = useState<Measure | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medecinId, setMedecinId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Récupérer le profil du médecin
      const profile = await getProfile();
      setMedecinId(profile.user._id);

      // Récupérer la mesure
      if (measureId) {
        const measureData = await authFetch(`/measures/${measureId}`);
        console.log('📊 Mesure reçue :', measureData);
        setMeasure(measureData.measure || measureData);
      }

      // Récupérer les infos du patient
      if (patientId) {
        const patientData = await authFetch(`/users/${patientId}`);
        console.log('👤 Patient reçu :', patientData);
        setPatient(patientData.user || patientData);
      }
    } catch (err: any) {
      console.error('❌ Erreur :', err);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const getMeasureStatus = (type: string, value: string) => {
    const v = parseFloat(value);
    
    switch (type.toLowerCase()) {
      case 'glycemie':
        if (v > 126) return { status: 'Élevée', color: '#EF4444', icon: 'alert-circle' };
        if (v < 70) return { status: 'Basse', color: '#F59E0B', icon: 'warning' };
        return { status: 'Normale', color: '#10B981', icon: 'checkmark-circle' };
      
      case 'tension':
        const [sys, dia] = value.split('/').map(Number);
        if (sys >= 140 || dia >= 90) return { status: 'Élevée', color: '#EF4444', icon: 'alert-circle' };
        if (sys < 90 || dia < 60) return { status: 'Basse', color: '#F59E0B', icon: 'warning' };
        return { status: 'Normale', color: '#10B981', icon: 'checkmark-circle' };
      
      case 'pouls':
        if (v > 100) return { status: 'Élevé', color: '#EF4444', icon: 'alert-circle' };
        if (v < 50) return { status: 'Bas', color: '#F59E0B', icon: 'warning' };
        return { status: 'Normal', color: '#10B981', icon: 'checkmark-circle' };
      
      case 'temperature':
        if (v >= 39) return { status: 'Fièvre élevée', color: '#EF4444', icon: 'alert-circle' };
        if (v >= 38) return { status: 'Fièvre', color: '#F59E0B', icon: 'warning' };
        if (v < 36) return { status: 'Hypothermie', color: '#F59E0B', icon: 'warning' };
        return { status: 'Normale', color: '#10B981', icon: 'checkmark-circle' };
      
      default:
        return { status: 'Enregistrée', color: '#6B7280', icon: 'information-circle' };
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2ccdd2" />
      </View>
    );
  }

  if (!measure || !patient) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={50} color="#EF4444" />
        <Text style={{ marginTop: 12, color: '#111827', fontWeight: '600' }}>Données indisponibles</Text>
        <TouchableOpacity style={[styles.button, { marginTop: 20 }]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = getMeasureStatus(measure.type, measure.value);
  const unit = measure.type === 'tension' ? 'mmHg' : 
               measure.type === 'glycemie' ? 'mg/dL' : 
               measure.type === 'pouls' ? 'bpm' : '°C';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détail de la Mesure</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Patient Info */}
      <View style={styles.patientCard}>
        <View style={styles.patientAvatar}>
          <Text style={styles.patientInitials}>
            {patient.prenom?.[0]}{patient.nom?.[0]}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.patientName}>{patient.prenom} {patient.nom}</Text>
          <Text style={styles.patientEmail}>{patient.email}</Text>
          {patient.pathologie && (
            <Text style={styles.patientPathologie}>Pathologie: {patient.pathologie}</Text>
          )}
        </View>
      </View>

      {/* Measure Details */}
      <View style={styles.measureCard}>
        <View style={styles.measureHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.measureType}>{measure.type.charAt(0).toUpperCase() + measure.type.slice(1)}</Text>
            <Text style={styles.measureDate}>
              {new Date(measure.date).toLocaleDateString('fr-FR', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          <Ionicons name={status.icon as any} size={32} color={status.color} />
        </View>

        <View style={styles.measureValue}>
          <Text style={[styles.value, { color: status.color }]}>{measure.value}</Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: status.color + '20', borderColor: status.color }]}>
          <Ionicons name={status.icon as any} size={16} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.status}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.adviceButton]}
          onPress={() => router.push({
            pathname: '/Doctor/advice',
            params: { patientId: patient._id, measureType: measure.type }
          })}
        >
          <Ionicons name="bulb-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Donner un Conseil</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.ordonnanceButton]}
          onPress={() => router.push({
            pathname: '/Doctor/ordonnance-create',
            params: { patientId: patient._id, measureId: measure._id }
          })}
        >
          <Ionicons name="document-text-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Envoyer Ordonnance</Text>
        </TouchableOpacity>
      </View>

      {/* Recommendations */}
      <View style={styles.recommendationsCard}>
        <Text style={styles.recommendationsTitle}>Recommandations</Text>
        <View style={styles.recommendationsList}>
          {measure.type === 'glycemie' && (
            <>
              <Text style={styles.recommendationItem}>• Surveiller régulièrement la glycémie</Text>
              <Text style={styles.recommendationItem}>• Respecter le régime alimentaire prescrit</Text>
              <Text style={styles.recommendationItem}>• Pratiquer une activité physique régulière</Text>
            </>
          )}
          {measure.type === 'tension' && (
            <>
              <Text style={styles.recommendationItem}>• Réduire la consommation de sel</Text>
              <Text style={styles.recommendationItem}>• Pratiquer une activité physique régulière</Text>
              <Text style={styles.recommendationItem}>• Gérer le stress et l'anxiété</Text>
            </>
          )}
          {measure.type === 'pouls' && (
            <>
              <Text style={styles.recommendationItem}>• Surveiller la fréquence cardiaque</Text>
              <Text style={styles.recommendationItem}>• Consulter un cardiologue si persistant</Text>
              <Text style={styles.recommendationItem}>• Éviter les efforts excessifs</Text>
            </>
          )}
          {measure.type === 'temperature' && (
            <>
              <Text style={styles.recommendationItem}>• Repos et hydratation</Text>
              <Text style={styles.recommendationItem}>• Prendre des antipyrétiques si nécessaire</Text>
              <Text style={styles.recommendationItem}>• Consulter si la fièvre persiste</Text>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default MeasureDetailScreen;

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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2ccdd2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  patientEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  patientPathologie: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Measure Card
  measureCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  measureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  measureType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  measureDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  measureValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  value: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  adviceButton: {
    backgroundColor: '#14b8a6',
  },
  ordonnanceButton: {
    backgroundColor: '#2ccdd2',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  button: {
    backgroundColor: '#2ccdd2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Recommendations
  recommendationsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationItem: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
});
