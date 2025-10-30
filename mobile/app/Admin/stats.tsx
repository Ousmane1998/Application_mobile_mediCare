// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import PageContainer from '../../components/PageContainer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { adminGetStats, type AdminStats } from '../../utils/api';

const { width } = Dimensions.get('window');

// Composant Graphique en Colonnes (Column Chart)
function ColumnChart({ data }: { data: Array<{ label: string; value: number; color: string }> }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const baseHeight = 150;

  return (
    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
      {/* Graphique */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', width: '100%', height: baseHeight + 40, marginBottom: 20, paddingHorizontal: 16 }}>
        {data.map((item, index) => {
          const ratio = item.value / maxValue;
          const columnHeight = ratio * baseHeight;

          return (
            <View key={index} style={{ alignItems: 'center', gap: 8 }}>
              {/* Valeur au-dessus */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', minHeight: 20 }}>{item.value}</Text>
              
              {/* Colonne */}
              <View
                style={{
                  width: 45,
                  height: Math.max(columnHeight, 10),
                  backgroundColor: item.color,
                  borderRadius: 6,
                  opacity: 0.85,
                }}
              />
              
              {/* Label */}
              <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>{item.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Légende */}
      <View style={{ gap: 10, width: '100%', paddingHorizontal: 16 }}>
        {data.map((item, index) => (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: item.color }} />
            <Text style={{ fontSize: 13, color: '#111827', fontWeight: '500', flex: 1 }}>
              {item.label}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: item.color }}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AdminStatsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const load = async () => {
    try {
      console.log('📊 Chargement des stats...');
      setError(null);
      const s = await adminGetStats();
      console.log('✅ Stats reçues (type):', typeof s);
      console.log('✅ Stats reçues (valeur):', s);
      console.log('📊 Valeurs:', { total: s?.total, patients: s?.patients, medecins: s?.medecins, admins: s?.admins });
      
      // Vérifier si c'est un objet avec une propriété 'stats'
      let statsData = s;
      if (s && s.stats && typeof s.stats === 'object') {
        console.log('✅ Stats trouvées dans .stats');
        statsData = s.stats;
      }
      
      if (!statsData || (statsData.total === 0 && statsData.patients === 0 && statsData.medecins === 0)) {
        console.warn('⚠️ Attention: Les stats sont vides ou nulles!');
      }
      setStats(statsData);
    } catch (e: any) {
      console.error('❌ Erreur stats:', e);
      console.error('❌ Message:', e?.message);
      console.error('❌ Status:', e?.status);
      console.error('❌ Stack:', e?.stack);
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2ccdd2" />
      </View>
    );
  }

  const total = stats?.total || 0;
  const patients = stats?.patients || 0;
  const medecins = stats?.medecins || 0;
  const admins = stats?.admins || 0;
  const pending = stats?.pendingMedecins || 0;

  // Calcul des pourcentages pour les graphiques
  const patientPercent = total > 0 ? (patients / total) * 100 : 0;
  const medecinPercent = total > 0 ? (medecins / total) * 100 : 0;
  const adminPercent = total > 0 ? (admins / total) * 100 : 0;

  const barWidth = width - 32 - 40; // width - padding - label

  return (
    <PageContainer scroll style={styles.container} contentContainerStyle={{ paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#111827" marginTop={40} />
        </TouchableOpacity>
        <Text style={styles.title}>Statistiques</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={24} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Cartes principales */}
      <View style={styles.cardsRow}>
        <View style={[styles.card, { backgroundColor: '#F0FFFE' }]}>
          <View style={styles.cardIcon}>
            <Ionicons name="people" size={24} color="#2ccdd2" />
          </View>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.value}>{total}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#F0FDF4' }]}>
          <View style={styles.cardIcon}>
            <Ionicons name="person" size={24} color="#10B981" />
          </View>
          <Text style={styles.label}>Patients</Text>
          <Text style={styles.value}>{patients}</Text>
        </View>
      </View>

      <View style={styles.cardsRow}>
        <View style={[styles.card, { backgroundColor: '#FEF3C7' }]}>
          <View style={styles.cardIcon}>
            <Ionicons name="medkit" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.label}>Médecins</Text>
          <Text style={styles.value}>{medecins}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#F3E8FF' }]}>
          <View style={styles.cardIcon}>
            <Ionicons name="shield" size={24} color="#8B5CF6" />
          </View>
          <Text style={styles.label}>Admins</Text>
          <Text style={styles.value}>{admins}</Text>
        </View>
      </View>

      {/* Graphique en Colonnes */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Distribution des utilisateurs</Text>
        <ColumnChart
          data={[
            { label: 'Patients', value: patients, color: '#10B981' },
            { label: 'Médecins', value: medecins, color: '#F59E0B' },
            { label: 'Admins', value: admins, color: '#8B5CF6' },
          ]}
        />
      </View>

      {/* Graphique en barres */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Pourcentage par catégorie</Text>
        
        <View style={styles.barChart}>
          {/* Patients */}
          <View style={styles.barRow}>
            <View style={{ width: 80, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' }} />
              <Text style={styles.barLabel}>Patients</Text>
            </View>
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.bar,
                  { width: `${Math.max(patientPercent, 5)}%`, backgroundColor: '#10B981' },
                ]}
              />
            </View>
            <Text style={styles.barValue}>{patientPercent.toFixed(1)}%</Text>
          </View>

          {/* Médecins */}
          <View style={styles.barRow}>
            <View style={{ width: 80, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#F59E0B' }} />
              <Text style={styles.barLabel}>Médecins</Text>
            </View>
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.bar,
                  { width: `${Math.max(medecinPercent, 5)}%`, backgroundColor: '#F59E0B' },
                ]}
              />
            </View>
            <Text style={styles.barValue}>{medecinPercent.toFixed(1)}%</Text>
          </View>

          {/* Admins */}
          <View style={styles.barRow}>
            <View style={{ width: 80, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#8B5CF6' }} />
              <Text style={styles.barLabel}>Admins</Text>
            </View>
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.bar,
                  { width: `${Math.max(adminPercent, 5)}%`, backgroundColor: '#8B5CF6' },
                ]}
              />
            </View>
            <Text style={styles.barValue}>{adminPercent.toFixed(1)}%</Text>
          </View>
        </View>
      </View>

      {/* Médecins en attente */}
      <View style={styles.pendingBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Ionicons name="alert-circle" size={20} color="#DC2626" />
          <Text style={styles.pendingTitle}>Médecins en attente</Text>
        </View>
        <Text style={styles.pendingValue}>{pending}</Text>
        <Text style={styles.pendingSubtitle}>Nécessite une activation</Text>
      </View>

      {/* Résumé */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Résumé</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Taux de patients:</Text>
          <Text style={styles.summaryValue}>{patientPercent.toFixed(1)}%</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Taux de médecins:</Text>
          <Text style={styles.summaryValue}>{medecinPercent.toFixed(1)}%</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ratio patient/médecin:</Text>
          <Text style={styles.summaryValue}>{medecins > 0 ? (patients / medecins).toFixed(1) : 'N/A'}</Text>
        </View>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 12 ,marginTop:45},

  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  errorText: { color: '#DC2626', fontSize: 14, flex: 1 },

  cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  cardIcon: { marginBottom: 8 },
  label: { color: '#6B7280', fontSize: 12, marginBottom: 4 },
  value: { fontSize: 24, fontWeight: '700', color: '#111827' },

  chartContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  chartTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },

  donutSegment: {
    position: 'absolute',
  },

  barChart: { gap: 18 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  barBackground: { flex: 1, height: 32, backgroundColor: '#F3F4F6', borderRadius: 8, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 8 },
  barValue: { width: 50, textAlign: 'right', fontSize: 12, fontWeight: '700', color: '#111827' },

  pendingBox: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FCD34D' },
  pendingTitle: { fontSize: 14, fontWeight: '600', color: '#92400E' },
  pendingValue: { fontSize: 28, fontWeight: '700', color: '#F59E0B', marginVertical: 4 },
  pendingSubtitle: { fontSize: 12, color: '#B45309' },

  summaryBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  summaryLabel: { fontSize: 12, color: '#6B7280' },
  summaryValue: { fontSize: 12, fontWeight: '600', color: '#111827' },
});
