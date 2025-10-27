import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/header';
import { authFetch } from '../../utils/api';
import { useRouter } from 'expo-router';

interface Patient {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  pathologie?: string;
}

export default function MyPatientsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Patient[]>([]);
  const [q, setQ] = useState('');
  const [selectedPatho, setSelectedPatho] = useState<string>(''); // '' = Tous, '__none__' = Sans pathologie

  const load = async () => {
    try {
      setError(null);
      const data = await authFetch('/users/my-patients');
      const list: Patient[] = (Array.isArray(data) ? data : data?.data || []).map((u: any) => ({
        id: String(u.id || u._id || ''),
        nom: u.nom || '',
        prenom: u.prenom || '',
        telephone: u.telephone ? String(u.telephone) : undefined,
        email: u.email || undefined,
        pathologie: u.pathologie || undefined,
      }));
      setItems(list);
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

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const uniquePathologies = useMemo(() => {
    const set = new Set<string>();
    items.forEach(p => { if (p.pathologie && p.pathologie.trim()) set.add(p.pathologie.trim()); });
    return Array.from(set).sort((a,b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter(p => {
      const textHit = !term || `${p.nom} ${p.prenom} ${p.email || ''} ${p.telephone || ''}`.toLowerCase().includes(term);
      const filt = selectedPatho === ''
        ? true
        : selectedPatho === '__none__'
          ? !p.pathologie
          : (p.pathologie || '').trim() === selectedPatho;
      return textHit && filt;
    });
  }, [items, q, selectedPatho]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Header />
      <Text style={styles.title}>Mes Patients</Text>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color="#9CA3AF" />
        <TextInput placeholder="Rechercher (nom, prenom, téléphone)" placeholderTextColor="#9CA3AF" value={q} onChangeText={setQ} style={styles.search} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
        <TouchableOpacity onPress={() => setSelectedPatho('')} style={[styles.chip, selectedPatho==='' && styles.chipActive]}>
          <Text style={[styles.chipText, selectedPatho==='' && styles.chipTextActive]}>Tous</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedPatho('__none__')} style={[styles.chip, selectedPatho==='__none__' && styles.chipActive]}>
          <Text style={[styles.chipText, selectedPatho==='__none__' && styles.chipTextActive]}>Sans pathologie</Text>
        </TouchableOpacity>
        {uniquePathologies.map((p) => (
          <TouchableOpacity key={p} onPress={() => setSelectedPatho(p)} style={[styles.chip, selectedPatho===p && styles.chipActive]}>
            <Text style={[styles.chipText, selectedPatho===p && styles.chipTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.map((p) => (
        <View key={p.id} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.avatar}><Ionicons name="person" size={20} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{p.nom} {p.prenom}</Text>
              {!!p.pathologie && <Text style={styles.sub}>{p.pathologie}</Text>}
              {!!p.telephone && <Text style={styles.sub}>Tel: {p.telephone}</Text>}
            </View>
            <TouchableOpacity style={styles.btn} onPress={() => router.push({ pathname: '/Doctor/patient/[id]' as any, params: { id: p.id } } as any)}>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 12, marginBottom: 40, marginTop: 32 },
  title: { fontSize: 18, color: '#111827', marginBottom: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  search: { flex: 1, color: '#111827' },
  chip: { backgroundColor: '#E5E7EB', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8 },
  chipActive: { backgroundColor: '#2ccdd2' },
  chipText: { color: '#111827' },
  chipTextActive: { color: '#fff' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, color: '#111827' },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  btn: { backgroundColor: '#2ccdd2', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  error: { color: '#DC2626', marginTop: 8 },
});
