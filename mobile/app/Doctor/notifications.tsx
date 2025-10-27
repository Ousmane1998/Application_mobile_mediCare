// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markNotificationRead, deleteNotification, type NotificationItem, getProfile, type UserProfile, SOCKET_URL } from '../../utils/api';
import io from 'socket.io-client';
import { useRouter } from 'expo-router';

// Notifications orientées médecin: nouveaux messages, demandes de rendez-vous, alertes patient

const FILTERS = ['Tout', 'Messages', 'Rendez-vous', 'Alertes'] as const;

function iconAndAccentFor(n: NotificationItem) {
  const t = (n.type || '').toLowerCase();
  if (t === 'message') return { icon: 'chatbubbles-outline' as const, accent: '#22C55E' };
  if (t === 'rdv' || t === 'appointment') return { icon: 'calendar-outline' as const, accent: '#10B981' };
  if (t === 'alerte' || t === 'alert') return { icon: 'warning-outline' as const, accent: '#EF4444' };
  return { icon: 'notifications-outline' as const, accent: '#6366F1' };
}

export default function DoctorNotificationsScreen() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Tout');
  const [patientIdFilter, setPatientIdFilter] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const socketRef = useRef<any>(null);
  const router = useRouter();

  const load = async () => {
    try {
      setError(null);
      const prof = await getProfile();
      setMe(prof.user);
      const list = await getNotifications(prof.user._id || prof.user.id);
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const id = (me as any)?._id || (me as any)?.id;
    if (!id) return;
    const s = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = s;
    s.emit('join', String(id));
    s.on('alert', (payload: any) => {
      const n = {
        _id: `rt_${Date.now()}`,
        userId: id,
        type: 'alerte',
        message: String(payload?.message || 'Alerte'),
        isRead: false,
        createdAt: new Date().toISOString(),
        data: payload,
      } as any as NotificationItem;
      setItems((prev) => [n, ...prev]);
    });
    return () => {
      try { s.disconnect(); } catch {}
      socketRef.current = null;
    };
  }, [me]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    let arr = items;
    if (filter === 'Messages') arr = arr.filter(i => (i.type || '').toLowerCase() === 'message');
    else if (filter === 'Rendez-vous') arr = arr.filter(i => ['rdv', 'appointment'].includes((i.type || '').toLowerCase()));
    else if (filter === 'Alertes') arr = arr.filter(i => ['alerte', 'alert'].includes((i.type || '').toLowerCase()));
    if (patientIdFilter !== 'all') {
      arr = arr.filter((n: any) => String(n?.data?.patientId || '') === String(patientIdFilter));
    }
    return arr;
  }, [items, filter, patientIdFilter]);

  const patientOptions = useMemo(() => {
    const map = new Map<string, string>();
    (items as any[]).forEach((n) => {
      const pid = n?.data?.patientId;
      if (pid) {
        const name = (n?.data?.patientName) || [n?.data?.prenom, n?.data?.nom].filter(Boolean).join(' ').trim();
        map.set(String(pid), name && name.length > 0 ? name : String(pid));
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  const onMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setItems(prev => prev.map(n => (String(n._id) === String(id) ? { ...n, isRead: true } : n)));
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible de marquer comme lu');
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setItems(prev => prev.filter(n => String(n._id) !== String(id)));
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Suppression impossible');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
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

      {patientOptions.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <TouchableOpacity onPress={() => setPatientIdFilter('all')}>
            <View style={[styles.filterChip, patientIdFilter === 'all' && styles.filterChipActive]}>
              <Text style={[styles.filterText, patientIdFilter === 'all' && styles.filterTextActive]}>Tous les patients</Text>
            </View>
          </TouchableOpacity>
          {patientOptions.map(p => (
            <TouchableOpacity key={p.id} onPress={() => setPatientIdFilter(p.id)}>
              <View style={[styles.filterChip, patientIdFilter === p.id && styles.filterChipActive]}>
                <Text style={[styles.filterText, patientIdFilter === p.id && styles.filterTextActive]} numberOfLines={1}>{p.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {filtered.map(n => {
        const { icon, accent } = iconAndAccentFor(n);
        const time = n.createdAt ? new Date(n.createdAt).toLocaleString() : '';
        const title = n.type ? n.type.charAt(0).toUpperCase() + n.type.slice(1) : 'Notification';
        const subtitle = n.message || '';
        const canOpenMeasure = (n as any)?.data?.measureId;
        const canOpenFiche = ((n as any)?.type === 'share_fiche' || (n as any)?.type === 'fiche') && (n as any)?.data?.patientId;
        const onOpen = () => {
          if (canOpenMeasure) {
            router.push(`/Doctor/measure/${(n as any).data.measureId}`);
          } else if (canOpenFiche) {
            router.push(`/Doctor/health-record/${(n as any).data.patientId}`);
          }
        };
        return (
          <TouchableOpacity key={String(n._id)} style={styles.card} activeOpacity={(canOpenMeasure || canOpenFiche) ? 0.7 : 1} onPress={onOpen}>
            <View style={styles.cardHead}>
              <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}> 
                <Ionicons name={icon} size={20} color={accent} />
                {!n.isRead && <View style={[styles.dot, { backgroundColor: accent }]} />}
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {!n.isRead && (
                  <TouchableOpacity onPress={() => onMarkRead(String(n._id))}><Text style={[styles.cta, { color: accent }]}>Marquer lu</Text></TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => onDelete(String(n._id))}><Text style={[styles.cta, { color: '#EF4444' }]}>Supprimer</Text></TouchableOpacity>
              </View>
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
            {!!time && <Text style={styles.time}>{time}</Text>}
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </TouchableOpacity>
        );
      })}

      {error ? <Text style={{ color: '#DC2626', marginTop: 8 }}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16, marginBottom: 40, marginTop: 32 },
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
