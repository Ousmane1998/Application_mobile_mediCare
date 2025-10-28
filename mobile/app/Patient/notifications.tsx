import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import PageContainer from '../../components/PageContainer';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, getProfile, NotificationItem } from '../../utils/api';

type DisplayItem = {
  _id: string;
  type: 'rappel' | 'alerte' | 'rdv' | 'message' | string;
  message: string;
  title?: string;
  subtitle?: string;
  createdAt: string;
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
  isRead?: boolean;
  senderInitials?: string;
};

const FILTERS = ['Tout', 'Rappels', 'Alertes', 'Rendez-vous', 'Messages'] as const;

// Helpers pour extraire des initiales d'un nom
const getInitials = (name?: string) => {
  const n = String(name || '').trim();
  if (!n) return undefined;
  const parts = n.split(/\s+/).filter(Boolean);
  const a = parts[0]?.charAt(0) || '';
  const b = parts[1]?.charAt(0) || '';
  const init = `${a}${b}`.toUpperCase();
  return init || undefined;
};
const extractSenderInitials = (notif: NotificationItem) => {
  const d: any = (notif as any)?.data || {};
  // Champs possibles côté API
  const name = d.senderName || d.doctorName || d.medecinName || [d.prenom, d.nom].filter(Boolean).join(' ').trim();
  return getInitials(name);
};

// Fonction pour mapper les notifications de la BD aux éléments d'affichage
const mapNotificationToDisplay = (notif: NotificationItem): DisplayItem => {
  const typeMap: Record<string, { accent: string; icon: keyof typeof Ionicons.glyphMap; title: string }> = {
    'alerte': { accent: '#EF4444', icon: 'alert-circle-outline', title: 'Alerte de santé' },
    'rappel': { accent: '#F59E0B', icon: 'bandage-outline', title: 'Rappel de médicament' },
    'rdv': { accent: '#10B981', icon: 'calendar-outline', title: 'Rendez-vous' },
    'message': { accent: '#22C55E', icon: 'chatbubbles-outline', title: 'Nouveau message' },
  };

  const notifType = (notif.type || 'alerte') as string;
  const config = typeMap[notifType] || typeMap['alerte'];

  return {
    _id: notif._id || '',
    type: notifType,
    message: notif.message || '',
    title: config?.title || 'Notification',
    subtitle: notif.message || '',
    createdAt: notif.createdAt || new Date().toISOString(),
    accent: config?.accent || '#EF4444',
    icon: config?.icon || 'alert-circle-outline',
    isRead: notif.isRead,
    senderInitials: extractSenderInitials(notif),
  };
};

// Fonction pour formater la date
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `il y a ${diffMins}m`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `il y a ${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR');
};

export default function PatientNotificationsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Tout');
  const [notifications, setNotifications] = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer l'ID de l'utilisateur connecté
        const { user } = await getProfile();
        console.log("📬 Récupération des notifications pour :", user._id);
        
        // Récupérer les notifications
        const notifs = await getNotifications(user._id);
        console.log("✅ Notifications reçues :", notifs);
        
        // Mapper les notifications
        const displayItems = (Array.isArray(notifs) ? notifs : []).map(mapNotificationToDisplay);
        setNotifications(displayItems);
      } catch (err: any) {
        console.error("❌ Erreur lors du chargement des notifications :", err);
        setError(err?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const items = useMemo(() => {
    if (filter === 'Tout') return notifications;
    if (filter === 'Rappels') return notifications.filter(i => i.type === 'rappel');
    if (filter === 'Alertes') return notifications.filter(i => i.type === 'alerte');
    if (filter === 'Rendez-vous') return notifications.filter(i => i.type === 'rdv');
    if (filter === 'Messages') return notifications.filter(i => i.type === 'message');
    return notifications;
  }, [filter, notifications]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2ccdd2" />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>Chargement des notifications...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={{ marginTop: 12, color: '#EF4444', fontSize: 16 }}>Erreur: {error}</Text>
      </View>
    );
  }

  return (
    <PageContainer scroll style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
        </View>
        <Ionicons name="funnel-outline" size={22} color="#111827" />
      </View>

      <View style={styles.filtersRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {items.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
          <Text style={{ marginTop: 12, color: '#9CA3AF', fontSize: 16 }}>Aucune notification</Text>
        </View>
      ) : (
        items.map(item => (
          <View key={item._id} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {item.senderInitials ? (
                  <View style={styles.avatarSmall}>
                    <Text style={styles.avatarInitialsSmall}>{item.senderInitials}</Text>
                  </View>
                ) : (
                  <View style={[styles.iconWrap, { backgroundColor: `${item.accent}22` }]}> 
                    <Ionicons name={item.icon} size={20} color={item.accent} />
                    {!item.isRead && <View style={[styles.dot, { backgroundColor: item.accent }]} />}
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            {!!item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
          </View>
        ))
      )}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16 },
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
  avatarSmall: { width: 28, height: 28, borderRadius: 999, backgroundColor: '#2ccdd2', alignItems: 'center', justifyContent: 'center' },
  avatarInitialsSmall: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
