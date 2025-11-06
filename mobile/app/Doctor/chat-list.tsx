import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getProfile, authFetch } from '../../utils/api';
import { useAppTheme } from '../../theme/ThemeContext';

interface Patient {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
}

interface Conversation {
  patientId: string;
  patientName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  patient: Patient;
}

export default function ChatListScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctor, setDoctor] = useState<any>(null);

  // Charger les patients et les derniers messages
  const loadConversations = async () => {
    try {
      setLoading(true);

      // Récupérer le profil du médecin
      const { user } = await getProfile();
      setDoctor(user);

      // Récupérer la liste des patients
      const patientsData = await authFetch('/users/my-patients');
      const patients: Patient[] = (Array.isArray(patientsData) ? patientsData : patientsData?.data || []).map((u: any) => ({
        id: String(u.id || u._id || ''),
        nom: u.nom || '',
        prenom: u.prenom || '',
        email: u.email || undefined,
        telephone: u.telephone ? String(u.telephone) : undefined,
      }));

      // Charger les derniers messages pour chaque patient
      const convs: Conversation[] = [];
      for (const patient of patients) {
        try {
          const messages = await authFetch(`/messages?user1=${user._id}&user2=${patient.id}`);
          const msgList = Array.isArray(messages) ? messages : messages?.data || [];
          
          // Récupérer le dernier message
          const lastMsg = msgList.length > 0 ? msgList[msgList.length - 1] : null;
          
          convs.push({
            patientId: patient.id,
            patientName: `${patient.prenom} ${patient.nom}`,
            lastMessage: lastMsg?.text || lastMsg?.voiceUrl ? (lastMsg?.text || '🎵 Message vocal') : 'Aucun message',
            lastMessageTime: lastMsg?.createdAt ? new Date(lastMsg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
            unreadCount: msgList.filter((m: any) => !m.isRead && m.receiverId === user._id).length,
            patient,
          });
        } catch (err) {
          console.warn(`⚠️ Erreur chargement messages pour patient ${patient.id}:`, err);
          convs.push({
            patientId: patient.id,
            patientName: `${patient.prenom} ${patient.nom}`,
            lastMessage: 'Aucun message',
            lastMessageTime: '',
            unreadCount: 0,
            patient,
          });
        }
      }

      // Trier par dernier message (plus récent en premier)
      convs.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setConversations(convs);
    } catch (err: any) {
      console.error('❌ Erreur chargement conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  // Filtrer les conversations par recherche
  const filtered = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return conversations;
    
    return conversations.filter(conv =>
      `${conv.patient.nom} ${conv.patient.prenom} ${conv.patient.email || ''} ${conv.patient.telephone || ''}`.toLowerCase().includes(term)
    );
  }, [conversations, searchQuery]);

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.conversationCard, { backgroundColor: theme.colors.card }]}
      onPress={() =>
        router.push({
          pathname: '/Doctor/chat',
          params: {
            patientId: item.patientId,
            patientName: item.patientName,
          },
        } as any)
      }
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: '#10B981' }]}>
          <Ionicons name="person" size={20} color="#fff" />
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Infos */}
      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.patientName, { color: theme.colors.text }]} numberOfLines={1}>
            {item.patientName}
          </Text>
          <Text style={[styles.time, { color: theme.colors.muted }]}>
            {item.lastMessageTime}
          </Text>
        </View>
        <Text style={[styles.lastMessage, { color: theme.colors.muted }]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>

      {/* Bouton Chat */}
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() =>
          router.push({
            pathname: '/Doctor/chat',
            params: {
              patientId: item.patientId,
              patientName: item.patientName,
            },
          } as any)
        }
      >
        <Ionicons name="chatbox-outline" size={20} color="#2ccdd2" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 12, color: theme.colors.muted }}>Chargement des conversations...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Messages</Text>
        <TouchableOpacity style={styles.newMessageBtn}>
          <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Recherche */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.searchBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="search" size={18} color={theme.colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Rechercher un patient..."
            placeholderTextColor={theme.colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Liste des conversations */}
      {filtered.length > 0 ? (
        <FlatList
          data={filtered}
          renderItem={renderConversation}
          keyExtractor={(item) => item.patientId}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.muted} />
          <Text style={[styles.emptyText, { color: theme.colors.muted }]}>
            {searchQuery ? 'Aucun patient trouvé' : 'Aucune conversation'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  newMessageBtn: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 13,
  },
  chatButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});
