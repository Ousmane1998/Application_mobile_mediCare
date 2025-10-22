import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Notifications orientées médecin: nouveaux messages, demandes de rendez-vous, alertes patient

type Item = {
  id: string;
  type: 'message' | 'rdv' | 'alerte';
  title: string;
  subtitle?: string;
  time: string;
  cta?: string;
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const SAMPLE: Item[] = [
  { id: '1', type: 'message', title: 'Nouveau message', subtitle: "Patient: M. Ndiaye — " + 'il y a 10 min', time: '10:05', accent: '#22C55E', icon: 'chatbubbles-outline' },
  { id: '2', type: 'rdv', title: 'Nouvelle demande de rendez-vous', subtitle: 'Patient: A. Diop — 25/10 à 15:30', time: '09:40', cta: 'Planifier', accent: '#10B981', icon: 'calendar-outline' },
  { id: '3', type: 'alerte', title: 'Alerte patient', subtitle: 'Glycémie basse détectée — 62 mg/dL (P. Faye)', time: 'Hier, 21:15', cta: 'Voir', accent: '#EF4444', icon: 'warning-outline' },
];

const FILTERS = ['Tout', 'Messages', 'Rendez-vous', 'Alertes'] as const;

export default function DoctorNotificationsScreen() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Tout');
  const items = useMemo(() => {
    if (filter === 'Tout') return SAMPLE;
    if (filter === 'Messages') return SAMPLE.filter(i => i.type === 'message');
    if (filter === 'Rendez-vous') return SAMPLE.filter(i => i.type === 'rdv');
    if (filter === 'Alertes') return SAMPLE.filter(i => i.type === 'alerte');
    return SAMPLE;
  }, [filter]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Notifications</Text>
        <Ionicons name="funnel-outline" size={22} color="#111827" />
      </View>

      <View style={styles.filtersRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {items.map(item => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHead}>
            <View style={[styles.iconWrap, { backgroundColor: `${item.accent}22` }]}> 
              <Ionicons name={item.icon} size={20} color={item.accent} />
              <View style={[styles.dot, { backgroundColor: item.accent }]} />
            </View>
            {!!item.cta && <Text style={[styles.cta, { color: item.accent }]}>{item.cta}</Text>}
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.time}>{item.time}</Text>
          {!!item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 20, color: '#111827' },
  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#E5E7EB' },
  filterChipActive: { backgroundColor: '#D1FAE5' },
  filterText: { color: '#374151' },
  filterTextActive: { color: '#065F46' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  dot: { width: 8, height: 8, borderRadius: 999, position: 'absolute', top: 4, right: 4 },
  cta: { fontWeight: '600' },
  cardTitle: { fontSize: 16, color: '#111827', marginTop: 8 },
  time: { color: '#6B7280', marginTop: 4 },
  subtitle: { color: '#374151', marginTop: 6 },
});
