// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markNotificationRead, deleteNotification, type NotificationItem, getProfile, type UserProfile, SOCKET_URL } from '../../utils/api';
import io from 'socket.io-client';
import { useRouter } from 'expo-router';

// Notifications orientées médecin: nouveaux messages, demandes de rendez-vous, alertes patient

const FILTERS = ['Tout', 'Messages', 'Rendez-vous', 'Alertes', 'SOS'] as const;

// Composant pour le glissement
function SwipeableNotificationItem({ 
  notification, 
  onMarkRead, 
  onDelete, 
  onPress, 
  children 
}: any) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [swiped, setSwiped] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < 0) {
          pan.x.setValue(Math.max(gestureState.dx, -100));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -50) {
          setSwiped(true);
          Animated.timing(pan.x, {
            toValue: -100,
            duration: 200,
            useNativeDriver: false,
          }).start();
        } else {
          setSwiped(false);
          Animated.timing(pan.x, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Animated.timing(pan.x, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      setSwiped(false);
      onDelete(String(notification._id));
    });
  };

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.deleteAction}>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteActionButton}>
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.deleteActionText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[
          styles.notificationWrapper,
          { transform: [{ translateX: pan.x }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          style={[styles.card, !notification.isRead && styles.cardUnread]} 
          activeOpacity={0.7} 
          onPress={() => {
            if (!notification.isRead) {
              onMarkRead(String(notification._id));
            }
            onPress();
          }}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function iconAndAccentFor(n: NotificationItem) {
  const t = (n.type || '').toLowerCase();
  if (t === 'message') return { icon: 'chatbubbles-outline' as const, accent: '#22C55E' };
  if (t === 'rdv' || t === 'appointment') return { icon: 'calendar-outline' as const, accent: '#10B981' };
  if (t === 'alerte' || t === 'alert') return { icon: 'warning-outline' as const, accent: '#EF4444' };
  if (t === 'emergency') return { icon: 'call-outline' as const, accent: '#DC2626' };
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
      console.log('👨‍⚕️ [Notifications] Profil médecin :', prof.user._id || prof.user.id);
      setMe(prof.user);
      
      const userId = prof.user._id || prof.user.id;
      console.log('📬 [Notifications] Récupération des notifications pour userId :', userId);
      
      const list = await getNotifications(userId);
      console.log('✅ [Notifications] Notifications reçues :', list);
      console.log('📊 [Notifications] Nombre de notifications :', Array.isArray(list) ? list.length : 0);
      
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      console.error('❌ [Notifications] Erreur :', e);
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
    
    // Écouter les alertes (mesures)
    s.on('alert', (payload: any) => {
      console.log('🔔 [Socket] Alerte reçue :', payload);
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
    
    // Écouter les rendez-vous en attente
    s.on('rdv', (payload: any) => {
      console.log('📅 [Socket] Rendez-vous reçu :', payload);
      const n = {
        _id: `rdv_${Date.now()}`,
        userId: id,
        type: 'rdv',
        message: String(payload?.message || 'Nouvelle demande de rendez-vous'),
        isRead: false,
        createdAt: new Date().toISOString(),
        data: payload,
      } as any as NotificationItem;
      setItems((prev) => [n, ...prev]);
    });
    
    // Écouter les alertes d'urgence
    s.on('emergency', (payload: any) => {
      console.log('🚨 [Socket] Alerte SOS reçue :', payload);
      const n = {
        _id: `emergency_${Date.now()}`,
        userId: id,
        type: 'emergency',
        message: String(payload?.message || '🚨 Alerte SOS'),
        isRead: false,
        createdAt: new Date().toISOString(),
        data: payload,
      } as any as NotificationItem;
      setItems((prev) => [n, ...prev]);
    });
    
    // Écouter les notifications génériques
    s.on('notification', (payload: any) => {
      console.log('📬 [Socket] Notification reçue :', payload);
      const n = {
        _id: `notif_${Date.now()}`,
        userId: id,
        type: payload?.type || 'notification',
        message: String(payload?.message || 'Notification'),
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
    else if (filter === 'SOS') arr = arr.filter(i => (i.type || '').toLowerCase() === 'emergency');
    if (patientIdFilter !== 'all') {
      arr = arr.filter((n: any) => String(n?.data?.patientId || '') === String(patientIdFilter));
    }
    return arr;
  }, [items, filter, patientIdFilter]);

  // Helpers for sender initials (patient or other emitter)
  const getInitials = (name?: string) => {
    const n = String(name || '').trim();
    if (!n) return undefined;
    const parts = n.split(/\s+/).filter(Boolean);
    const a = parts[0]?.charAt(0) || '';
    const b = parts[1]?.charAt(0) || '';
    const init = `${a}${b}`.toUpperCase();
    return init || undefined;
  };
  const extractSenderInitials = (n: any) => {
    const d = (n?.data) || {};
    const name = d.senderName || d.patientName || [d.prenom, d.nom].filter(Boolean).join(' ').trim();
    return getInitials(name);
  };

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

  const onOpenMessage = (n: any) => {
    const patientId = n?.data?.patientId || n?.userId;
    
    // Essayer plusieurs sources pour le nom
    let patientName = n?.data?.patientName;
    if (!patientName || patientName === 'Patient') {
      const prenom = n?.data?.prenom || '';
      const nom = n?.data?.nom || '';
      patientName = `${prenom} ${nom}`.trim();
    }
    if (!patientName) {
      patientName = 'Patient';
    }
    
    console.log('💬 [Message] Ouverture chat:', { patientId, patientName, fullData: n?.data });
    
    if (patientId) {
      onMarkRead(String(n._id));
      router.push({
        pathname: '/Doctor/chat-detail',
        params: {
          patientId: String(patientId),
          patientName: patientName
        }
      });
    } else {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la conversation: patient non trouvé');
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
        const isRdvPending = ((n as any)?.type === 'rdv' || (n as any)?.type === 'appointment') && (n as any)?.data?.status === 'pending';
        const isAlerte = ['alerte', 'alert'].includes((n as any)?.type?.toLowerCase());
        const isEmergency = (n as any)?.type === 'emergency';
        const isMessage = (n as any)?.type?.toLowerCase() === 'message';
        const senderInitials = extractSenderInitials(n);
        
        const onOpen = () => {
          if (isMessage) {
            onOpenMessage(n);
          } else if (canOpenMeasure) {
            router.push({
              pathname: '/Doctor/measure-detail',
              params: { 
                measureId: (n as any).data.measureId,
                patientId: (n as any).data.patientId
              }
            });
          } else if (canOpenFiche) {
            router.push(`/Doctor/health-record/${(n as any).data.patientId}`);
          } else if (isRdvPending) {
            const appointmentId = (n as any).data?.appointmentId || (n as any).data?._id;
            console.log('📅 [RDV] Ouverture RDV:', { appointmentId, data: (n as any).data });
            if (appointmentId) {
              router.push({
                pathname: '/Doctor/appointment-confirm',
                params: { appointmentId: String(appointmentId) }
              });
            } else {
              Alert.alert('Erreur', 'Impossible d\'ouvrir le rendez-vous: ID non trouvé');
            }
          } else if (isEmergency) {
            router.push({
              pathname: '/Doctor/emergency-detail',
              params: { 
                emergencyId: (n as any)._id,
                patientId: (n as any).data?.patientId,
                patientInfo: JSON.stringify((n as any).data?.patientInfo || {}),
                location: JSON.stringify((n as any).data?.location || {}),
                lastMeasure: JSON.stringify((n as any).data?.lastMeasure || {})
              }
            });
          }
        };
        
        return (
          <SwipeableNotificationItem
            key={String(n._id)}
            notification={n}
            onMarkRead={onMarkRead}
            onDelete={onDelete}
            onPress={onOpen}
          >
            <View style={styles.cardHead}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {senderInitials ? (
                  <View style={[styles.avatarSmall, { backgroundColor: accent }]}>
                    <Text style={styles.avatarInitialsSmall}>{senderInitials}</Text>
                  </View>
                ) : (
                  <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}> 
                    <Ionicons name={icon} size={20} color={accent} />
                    {!n.isRead && <View style={[styles.dot, { backgroundColor: accent }]} />}
                  </View>
                )}
              </View>
            </View>
            <Text style={[styles.cardTitle, !n.isRead && styles.cardTitleUnread]}>{title}</Text>
            {!!time && <Text style={styles.time}>{time}</Text>}
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            
            {/* Action Buttons */}
            {isRdvPending && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={() => {
                    onMarkRead(String(n._id));
                    router.push({
                      pathname: '/Doctor/appointment-confirm',
                      params: { appointmentId: (n as any).data.appointmentId }
                    });
                  }}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Confirmer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => {
                    Alert.alert('Rejeter', 'Êtes-vous sûr de vouloir rejeter ce rendez-vous?', [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Rejeter', style: 'destructive', onPress: () => onDelete(String(n._id)) }
                    ]);
                  }}
                >
                  <Ionicons name="close-circle" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Rejeter</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {isAlerte && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={() => {
                    onMarkRead(String(n._id));
                    router.push({
                      pathname: '/Doctor/measure-detail',
                      params: { 
                        measureId: (n as any).data.measureId,
                        patientId: (n as any).data.patientId
                      }
                    });
                  }}
                >
                  <Ionicons name="eye" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Voir la mesure</Text>
                </TouchableOpacity>
              </View>
            )}
          </SwipeableNotificationItem>
        );
      })}

      {error ? <Text style={{ color: '#DC2626', marginTop: 8 }}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 20, color: '#111827' , marginTop: 40},
  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#E5E7EB' },
  filterChipActive: { backgroundColor: '#D1FAE5' },
  filterText: { color: '#374151' },
  filterTextActive: { color: '#065F46' },
  
  // Swipe Container
  swipeContainer: { position: 'relative', marginBottom: 12, overflow: 'hidden', borderRadius: 16 },
  deleteAction: { position: 'absolute', right: 0, top: 0, bottom: 0, backgroundColor: '#EF4444', borderRadius: 16, justifyContent: 'center', alignItems: 'center', width: 100, zIndex: 0 },
  deleteActionButton: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  deleteActionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  
  notificationWrapper: { zIndex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  cardUnread: { backgroundColor: '#F0FFFE', borderLeftWidth: 4, borderLeftColor: '#2ccdd2' },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  dot: { width: 8, height: 8, borderRadius: 999, position: 'absolute', top: 4, right: 4 },
  cta: { fontWeight: '600' },
  cardTitle: { fontSize: 16, color: '#111827', marginTop: 8 },
  cardTitleUnread: { fontWeight: '600', color: '#111827' },
  time: { color: '#6B7280', marginTop: 4, fontSize: 12 },
  subtitle: { color: '#374151', marginTop: 6 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarInitialsSmall: { color: '#fff', fontSize: 14, fontWeight: '700' },
  
  // Action Buttons
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
  confirmButton: { backgroundColor: '#10B981' },
  rejectButton: { backgroundColor: '#EF4444' },
  viewButton: { backgroundColor: '#2ccdd2' },
  actionButtonText: { fontSize: 12, color: '#fff' },
});
