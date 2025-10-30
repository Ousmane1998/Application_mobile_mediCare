// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import PageContainer from '../../components/PageContainer';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, getMeasuresHistory, type MeasureType } from '../../utils/api';
import { useRouter } from 'expo-router';
import Svg, { Polyline, Line as SvgLine, G as SvgG, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';

const TYPES: Array<{ key: MeasureType; label: string }> = [
  { key: 'glycemie', label: 'Glycémie' },
  { key: 'tension', label: 'Tension' },
  { key: 'poids', label: 'Poids' },
  { key: 'pouls', label: 'Pouls' },
  { key: 'temperature', label: 'Température' },
];

export default function PatientMeasuresHistoryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<MeasureType | 'tous'>('tous');
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState<'tout' | '7j' | '30j'>('tout');
  const pageSize = 20;

  const load = async () => {
    try {
      setError(null);
      const prof = await getProfile();
      const id = (prof.user as any)._id || (prof.user as any).id;
      console.log('📊 Patient ID:', id);
      
      const history = await getMeasuresHistory(id);
      console.log('📊 Mesures reçues:', history);
      
      const arr = Array.isArray(history) ? history : [];
      console.log('📊 Nombre de mesures:', arr.length);
      
      arr.sort((a: any,b: any)=> new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
      setItems(arr);
      setPage(1);
      
      if (arr.length === 0) {
        console.warn('⚠️ Aucune mesure trouvée pour ce patient');
      }
    } catch (e: any) {
      console.error('❌ Erreur chargement mesures:', e);
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

  const withinPeriod = (d: any) => {
    if (period === 'tout') return true;
    const ts = new Date(d).getTime();
    const now = Date.now();
    const delta = period === '7j' ? 7 : 30;
    return ts >= now - delta * 24 * 60 * 60 * 1000;
  };

  const filtered = useMemo(() => {
    let arr = items.filter(m => withinPeriod(m.date || m.createdAt || Date.now()));
    if (typeFilter !== 'tous') arr = arr.filter(m => String(m.type).toLowerCase() === typeFilter);
    return arr;
  }, [items, typeFilter, period]);

  const pageSlice = filtered.slice(0, page * pageSize);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    filtered.forEach(m => { const t = String(m.type || '').toLowerCase(); c[t] = (c[t]||0)+1; });
    return c;
  }, [filtered]);

  // Build time-series for selected type
  const seriesData = useMemo(() => {
    if (typeFilter === 'tous') return [] as Array<{ ts: number; value: number }>;
    const rows = filtered.filter(m => String(m.type).toLowerCase() === typeFilter).slice();
    // chronological order
    rows.sort((a: any, b: any) => new Date(a.date || a.createdAt || 0).getTime() - new Date(b.date || b.createdAt || 0).getTime());
    const vals: Array<{ ts: number; value: number }> = [];
    rows.forEach((m: any) => {
      const ts = new Date(m.date || m.createdAt || Date.now()).getTime();
      let v: number | null = null;
      const raw = String(m.value ?? '').trim();
      if (typeFilter === 'tension') {
        const parts = raw.split('/');
        if (parts.length >= 1) {
          const s = parseFloat(parts[0].replace(',', '.'));
          if (!Number.isNaN(s)) v = s; // plot systolic by défaut
        }
      } else {
        const num = parseFloat(raw.replace(',', '.'));
        if (!Number.isNaN(num)) v = num;
      }
      if (v != null) vals.push({ ts, value: v });
    });
    return vals.slice(-60); // last 60 points max
  }, [filtered, typeFilter]);

  // Get last and previous value for percentage change
  const lastMeasureInfo = useMemo(() => {
    if (typeFilter === 'tous') return null;
    const rows = filtered.filter(m => String(m.type).toLowerCase() === typeFilter).slice();
    rows.sort((a: any, b: any) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
    if (rows.length === 0) return null;
    
    const last = rows[0];
    const prev = rows[1];
    
    let lastVal: number | null = null;
    let prevVal: number | null = null;
    
    const raw = String(last.value ?? '').trim();
    if (typeFilter === 'tension') {
      const parts = raw.split('/');
      if (parts.length >= 1) {
        const s = parseFloat(parts[0].replace(',', '.'));
        if (!Number.isNaN(s)) lastVal = s;
      }
    } else {
      const num = parseFloat(raw.replace(',', '.'));
      if (!Number.isNaN(num)) lastVal = num;
    }
    
    if (prev) {
      const rawPrev = String(prev.value ?? '').trim();
      if (typeFilter === 'tension') {
        const parts = rawPrev.split('/');
        if (parts.length >= 1) {
          const s = parseFloat(parts[0].replace(',', '.'));
          if (!Number.isNaN(s)) prevVal = s;
        }
      } else {
        const num = parseFloat(rawPrev.replace(',', '.'));
        if (!Number.isNaN(num)) prevVal = num;
      }
    }
    
    let percentChange = null;
    if (lastVal !== null && prevVal !== null && prevVal !== 0) {
      percentChange = Math.round(((lastVal - prevVal) / prevVal) * 100);
    }
    
    return {
      value: last.value,
      date: new Date(last.date || last.createdAt || Date.now()),
      percentChange
    };
  }, [filtered, typeFilter]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <PageContainer scroll style={styles.container} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 24, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111827" marginTop={37}  />
          </TouchableOpacity>
          <Text style={styles.title}>Historique des mesures</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/Patient/measure-add')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 12 }}>
          <Ionicons name="add-circle-outline" size={20} color="#10B981" />
          <Text style={{ color: '#10B981', fontWeight: '600', fontSize: 14, }}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartBox}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          {(['tout','7j','30j'] as const).map(p => (
            <TouchableOpacity key={p} onPress={() => setPeriod(p)}>
              <View style={period === p ? styles.chipActive : styles.chip}><Text style={period === p ? styles.chipTextActive : styles.chipText}>{p.toUpperCase()}</Text></View>
            </TouchableOpacity>
          ))}
        </View>
        {TYPES.map(t => {
          const rows = filtered.filter(m => String(m.type).toLowerCase() === t.key);
          const last = rows.slice(0, 12).reverse();
          const values = last.map(m => Number(m.value) || 0);
          const maxVal = Math.max(1, ...values);
          const count = counts[t.key] || 0;
          return (
            <View key={t.key} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.chartLabel}>{t.label}</Text>
                <Text style={styles.chartCount}>{count}</Text>
              </View>
              <View style={styles.sparkRow}>
                {values.length === 0 ? (
                  <Text style={styles.chartCount}>—</Text>
                ) : (
                  values.map((v, i) => (
                    <View key={i} style={[styles.sparkBar, { height: Math.max(3, Math.round((v / maxVal) * 28)) }]} />
                  ))
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Last measure info */}
      {typeFilter !== 'tous' && lastMeasureInfo && (
        <View style={styles.lastMeasureBox}>
          <Text style={styles.chartLabel}>Evolution de la {TYPES.find(t=>t.key===typeFilter)?.label.toLowerCase()}</Text>
          <Text style={styles.lastMeasureValue}>{lastMeasureInfo.value}</Text>
          {lastMeasureInfo.percentChange !== null && (
            <Text style={[styles.percentChange, lastMeasureInfo.percentChange > 0 ? { color: '#EF4444' } : { color: '#10B981' }]}>
              Cette semaine {lastMeasureInfo.percentChange > 0 ? '+' : ''}{lastMeasureInfo.percentChange}%
            </Text>
          )}
        </View>
      )}

      {/* Time-series line chart for selected type */}
      {typeFilter !== 'tous' && (
        <View style={styles.timeSeriesBox}>
          <Text style={styles.chartLabel}>Graphique</Text>
          {seriesData.length < 2 ? (
            <Text style={styles.chartCount}>
              Pas assez de points pour tracer la courbe
            </Text>
          ) : (
            <Svg width="100%" height={180} viewBox="0 0 320 180">
              {(() => {
                const w = 300; const h = 140; const left = 16; const top = 16; const bottom = 24; const right = 4;
                const innerW = w - left - right; const innerH = h - top - bottom;
                const xs = seriesData.map(d => d.ts);
                const ys = seriesData.map(d => d.value);
                const minX = Math.min(...xs), maxX = Math.max(...xs);
                const minY = Math.min(...ys), maxY = Math.max(...ys);
                const padY = (maxY - minY) * 0.1 || 1;
                const y0 = minY - padY; const y1 = maxY + padY;
                const xScale = (x: number) => left + (innerW * (x - minX)) / Math.max(1, (maxX - minX));
                const yScale = (y: number) => top + innerH - (innerH * (y - y0)) / Math.max(1, (y1 - y0));
                const pts = seriesData.map(d => `${xScale(d.ts)},${yScale(d.value)}`).join(' ');
                const yTicks = [y0, (y0 + y1) / 2, y1];
                // Build X ticks at start, middle, end (JJ/MM)
                const tickCount = 3;
                const tickTs: number[] = [];
                for (let i = 0; i < tickCount; i++) {
                  const t = minX + ((maxX - minX) * i) / (tickCount - 1 || 1);
                  tickTs.push(t);
                }
                const fmt = (ts: number) => {
                  const d = new Date(ts);
                  const dd = String(d.getDate()).padStart(2, '0');
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  return `${dd}/${mm}`;
                };
                return (
                  <SvgG>
                    <SvgLine x1={left} y1={top} x2={left} y2={top + innerH} stroke="#E5E7EB" strokeWidth={1} />
                    <SvgLine x1={left} y1={top + innerH} x2={left + innerW} y2={top + innerH} stroke="#E5E7EB" strokeWidth={1} />
                    {yTicks.map((yt, i) => (
                      <SvgG key={i}>
                        <SvgLine x1={left} y1={yScale(yt)} x2={left + innerW} y2={yScale(yt)} stroke="#F3F4F6" strokeWidth={1} />
                        <SvgText x={2} y={yScale(yt) + 4} fontSize="10" fill="#6B7280">{Math.round(yt)}</SvgText>
                      </SvgG>
                    ))}
                    {tickTs.map((tx, i) => (
                      <SvgG key={`xt${i}`}>
                        <SvgLine x1={xScale(tx)} y1={top} x2={xScale(tx)} y2={top + innerH} stroke="#F3F4F6" strokeWidth={1} />
                        <SvgText x={xScale(tx) - 12} y={top + innerH + 14} fontSize="10" fill="#6B7280">{fmt(tx)}</SvgText>
                      </SvgG>
                    ))}
                    <Polyline points={pts} fill="none" stroke="#10B981" strokeWidth={2} />
                    {seriesData.map((d, i) => (
                      <SvgCircle key={i} cx={xScale(d.ts)} cy={yScale(d.value)} r={2} fill="#10B981" />
                    ))}
                  </SvgG>
                );
              })()}
            </Svg>
          )}
        </View>
      )}

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

      {/* All measurements section */}
      {filtered.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Toutes les mesures</Text>
          {pageSlice.map((m, idx) => {
            const typeInfo = TYPES.find(t => t.key === String(m.type).toLowerCase());
            const iconColor = typeInfo?.key === 'glycemie' ? '#2ccdd2' : typeInfo?.key === 'tension' ? '#F59E0B' : typeInfo?.key === 'poids' ? '#10B981' : typeInfo?.key === 'pouls' ? '#EF4444' : '#6B7280';
            const iconName = typeInfo?.key === 'glycemie' ? 'water-outline' : typeInfo?.key === 'tension' ? 'pulse-outline' : typeInfo?.key === 'poids' ? 'scale-outline' : typeInfo?.key === 'pouls' ? 'heart-outline' : 'thermometer-outline';
            
            return (
              <View key={(m._id || idx).toString()} style={styles.measureCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.measureIcon, { backgroundColor: `${iconColor}22` }]}>
                    <Ionicons name={iconName as any} color={iconColor} size={20} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.measureName}>{String(m.type).charAt(0).toUpperCase() + String(m.type).slice(1)}: {m.value}</Text>
                    <Text style={styles.measureTime}>{new Date(m.date || m.createdAt || Date.now()).toLocaleString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  <View style={[styles.measureDot, { backgroundColor: iconColor }]} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {filtered.length === 0 && (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
          <Text style={{ marginTop: 12, color: '#9CA3AF', fontSize: 16 }}>Aucune mesure</Text>
          <TouchableOpacity onPress={() => router.push('/Patient/measure-add')} style={{ marginTop: 12, backgroundColor: '#10B981', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 }}>
            <Text style={{ color: '#fff' }}>Ajouter une mesure</Text>
          </TouchableOpacity>
        </View>
      )}

      {pageSlice.length < filtered.length && (
        <TouchableOpacity style={styles.loadMore} onPress={() => setPage(p => p + 1)}>
          <Text style={styles.loadMoreText}>Charger plus</Text>
        </TouchableOpacity>
      )}

      {error ? <Text style={{ color: '#DC2626', marginTop: 8 }}>{error}</Text> : null}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 20, color: '#111827',marginTop: 40 },
  chip: { backgroundColor: '#E5E7EB', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8 },
  chipActive: { backgroundColor: '#2ccdd2', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8 },
  chipText: { color: '#111827' },
  chipTextActive: { color: '#fff' },
  chartBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  chartLabel: { color: '#111827', fontSize: 13, fontWeight: '600' },
  chartCount: { color: '#6B7280', fontSize: 12 },
  chartBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 999, overflow: 'hidden', marginTop: 4 },
  chartBarFill: { height: 8, backgroundColor: '#2ccdd2' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  badge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB' },
  name: { fontSize: 16, color: '#111827' },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  loadMore: { marginTop: 12, backgroundColor: '#E5E7EB', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  loadMoreText: { color: '#111827' },
  sparkRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 30, marginTop: 6 },
  sparkBar: { width: 6, backgroundColor: '#10B981', borderRadius: 2 },
  timeSeriesBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  lastMeasureBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  lastMeasureValue: { fontSize: 32, fontWeight: '700', color: '#111827', marginTop: 8 },
  percentChange: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  measureCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  measureIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  measureName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  measureTime: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  measureDot: { width: 10, height: 10, borderRadius: 5 },
});
