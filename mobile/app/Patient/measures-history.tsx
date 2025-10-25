import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, getMeasuresHistory, type MeasureType } from '../../utils/api';

const TYPES: Array<{ key: MeasureType; label: string }> = [
  { key: 'glycemie', label: 'Glycémie' },
  { key: 'tension', label: 'Tension' },
  { key: 'poids', label: 'Poids' },
  { key: 'pouls', label: 'Pouls' },
  { key: 'temperature', label: 'Température' },
];

export default function PatientMeasuresHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<MeasureType | 'tous'>('tous');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = async () => {
    try {
      setError(null);
      const prof = await getProfile();
      const id = (prof.user as any)._id || (prof.user as any).id;
      const history = await getMeasuresHistory(id);
      const arr = Array.isArray(history) ? history : [];
      arr.sort((a: any,b: any)=> new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
      setItems(arr);
      setPage(1);
    } catch (e: any) {
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

  const filtered = useMemo(() => {
    if (typeFilter === 'tous') return items;
    return items.filter(m => String(m.type).toLowerCase() === typeFilter);
  }, [items, typeFilter]);

  const pageSlice = filtered.slice(0, page * pageSize);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach(m => { const t = String(m.type || '').toLowerCase(); c[t] = (c[t]||0)+1; });
    return c;
  }, [items]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Historique des mesures</Text>

      <View style={styles.chartBox}>
        {TYPES.map(t => {
          const count = counts[t.key] || 0;
          const max = Math.max(1, ...Object.values(counts));
          const pct = Math.round((count / max) * 100);
          return (
            <View key={t.key} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.chartLabel}>{t.label}</Text>
                <Text style={styles.chartCount}>{count}</Text>
              </View>
              <View style={styles.chartBarBg}>
                <View style={[styles.chartBarFill, { width: `${pct}%` }]} />
              </View>
            </View>
          );
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
        <TouchableOpacity onPress={() => setTypeFilter('tous')}>
          <View style={typeFilter === 'tous' ? styles.chipActive : styles.chip}><Text style={typeFilter === 'tous' ? styles.chipTextActive : styles.chipText}>Tous</Text></View>
        </TouchableOpacity>
        {TYPES.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTypeFilter(t.key)}>
            <View style={typeFilter === t.key ? styles.chipActive : styles.chip}><Text style={typeFilter === t.key ? styles.chipTextActive : styles.chipText}>{t.label}</Text></View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {pageSlice.map((m, idx) => (
        <View key={(m._id || idx).toString()} style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.badge}><Ionicons name="trending-up-outline" color="#111827" size={16} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{String(m.type).toUpperCase()} — {m.value}</Text>
              <Text style={styles.sub}>{new Date(m.date || m.createdAt || Date.now()).toLocaleString()}</Text>
            </View>
          </View>
        </View>
      ))}

      {pageSlice.length < filtered.length && (
        <TouchableOpacity style={styles.loadMore} onPress={() => setPage(p => p + 1)}>
          <Text style={styles.loadMoreText}>Charger plus</Text>
        </TouchableOpacity>
      )}

      {error ? <Text style={{ color: '#DC2626', marginTop: 8 }}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 20, color: '#111827' },
  chip: { backgroundColor: '#E5E7EB', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8 },
  chipActive: { backgroundColor: '#2ccdd2', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8 },
  chipText: { color: '#111827' },
  chipTextActive: { color: '#fff' },
  chartBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  chartLabel: { color: '#111827', fontSize: 13 },
  chartCount: { color: '#6B7280', fontSize: 12 },
  chartBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 999, overflow: 'hidden', marginTop: 4 },
  chartBarFill: { height: 8, backgroundColor: '#2ccdd2' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  badge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB' },
  name: { fontSize: 16, color: '#111827' },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  loadMore: { marginTop: 12, backgroundColor: '#E5E7EB', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  loadMoreText: { color: '#111827' },
});
