import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { authFetch } from '../../utils/api';

interface AdminNotification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    userRole?: string;
  };
  read: boolean;
  createdAt: string;
}

export default function AdminNotificationsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setError(null);
      console.log('📬 [AdminNotifications] Chargement des notifications...');
      
      // authFetch retourne déjà les données JSON, pas la réponse
      const data = await authFetch('/notifications');
      console.log('📬 [AdminNotifications] Données reçues:', data);
      
      if (!data) {
        console.log('📬 [AdminNotifications] Aucune donnée reçue');
        setNotifications([]);
      } else if (Array.isArray(data)) {
        console.log('📬 [AdminNotifications] Notifications (array):', data.length);
        setNotifications(data);
      } else if (data.notifications && Array.isArray(data.notifications)) {
        console.log('📬 [AdminNotifications] Notifications (nested):', data.notifications.length);
        setNotifications(data.notifications);
      } else {
        console.log('📬 [AdminNotifications] Format inattendu:', typeof data);
        setNotifications([]);
      }
    } catch (e: any) {
      console.error('❌ [AdminNotifications] Erreur complète:', e);
      console.error('❌ [AdminNotifications] Message:', e.message);
      setError(e?.message || 'Erreur de chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await authFetch(`/notifications/${notificationId}/read`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
    } catch (e: any) {
      console.error('❌ [markAsRead] Erreur:', e.message);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await authFetch(`/notifications/${notificationId}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (e: any) {
      console.error('❌ [deleteNotification] Erreur:', e.message);
    }
  };

  const handleNotificationPress = async (notification: AdminNotification) => {
    // Marquer comme lu
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Rediriger selon le type
    if (notification.type === 'user_registration' || notification.type === 'new_user') {
      // Rediriger vers la page de validation des utilisateurs
      router.push('/Admin/users');
    } else if (notification.type === 'doctor_activation') {
      router.push('/Admin/doctors-activation');
    }
  };

  const confirmDelete = (notificationId: string) => {
    Alert.alert('Confirmation', 'Supprimer cette notification ?', [
      { text: 'Annuler' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteNotification(notificationId) }
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifications.filter(n => !n.read).length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notifications.filter(n => !n.read).length}</Text>
          </View>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Aucune notification</Text>
        </View>
      ) : (
        notifications.map(notification => (
          <TouchableOpacity
            key={notification._id}
            onPress={() => handleNotificationPress(notification)}
            style={[styles.notificationCard, !notification.read && styles.notificationCardUnread]}
          >
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={notification.type === 'user_registration' ? 'person-add-outline' : 'checkmark-circle-outline'}
                    size={24}
                    color={notification.type === 'user_registration' ? '#3B82F6' : '#10B981'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notificationTitle}>{notification.title || notification.message}</Text>
                  <Text style={styles.notificationTime}>
                    {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                {!notification.read && <View style={styles.unreadDot} />}
              </View>

              {notification.data?.userName && (
                <View style={styles.notificationDetails}>
                  <Text style={styles.detailText}>
                    <Text style={{ fontWeight: '600' }}>Utilisateur:</Text> {notification.data.userName}
                  </Text>
                  {notification.data.userEmail && (
                    <Text style={styles.detailText}>
                      <Text style={{ fontWeight: '600' }}>Email:</Text> {notification.data.userEmail}
                    </Text>
                  )}
                  {notification.data.userRole && (
                    <Text style={styles.detailText}>
                      <Text style={{ fontWeight: '600' }}>Rôle:</Text> {notification.data.userRole}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View style={styles.notificationActions}>
              <TouchableOpacity onPress={() => confirmDelete(notification._id)}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 999,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 12,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationCardUnread: {
    backgroundColor: '#F0F9FF',
    borderColor: '#3B82F6',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  notificationDetails: {
    marginTop: 8,
    paddingLeft: 52,
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  error: {
    color: '#DC2626',
    marginTop: 16,
    textAlign: 'center',
  },
});
