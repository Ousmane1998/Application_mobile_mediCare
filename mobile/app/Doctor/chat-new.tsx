import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
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

export default function ChatNewScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const patientsData = await authFetch('/users/my-patients');
      const patientsList: Patient[] = (Array.isArray(patientsData) ? patientsData : patientsData?.data || []).map((u: any) => ({
        id: String(u.id || u._id || ''),
        nom: u.nom || '',
        prenom: u.prenom || '',
        email: u.email || undefined,
        telephone: u.telephone ? String(u.telephone) : undefined,
      }));
      setPatients(patientsList);
    } catch (err) {
      console.error('❌ Erreur chargement patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter(p => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return true;
    return `${p.nom} ${p.prenom} ${p.email || ''} ${p.telephone || ''}`.toLowerCase().includes(term);
  });

  const handleSelectPatient = (patient: Patient) => {
    router.push({
      pathname: '/Doctor/chat-detail',
      params: {
        patientId: patient.id,
        patientName: `${patient.prenom} ${patient.nom}`,
      },
    } as any);
  };

  const renderPatient = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={[styles.patientCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={() => handleSelectPatient(item)}
    >
      <View style={[styles.avatar, { backgroundColor: '#2ccdd2' }]}>
        <Ionicons name="person" size={20} color="#fff" />
      </View>
      <View style={styles.infoContainer}>
        <Text style={[styles.patientName, { color: theme.colors.text }]}>
          {item.prenom} {item.nom}
        </Text>
        {item.email && (
          <Text style={[styles.patientEmail, { color: theme.colors.muted }]}>
            {item.email}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Nouveau message</Text>
        <View style={{ width: 24 }} />
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

      {/* Liste des patients */}
      {filtered.length > 0 ? (
        <FlatList
          data={filtered}
          renderItem={renderPatient}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={48} color={theme.colors.muted} />
          <Text style={[styles.emptyText, { color: theme.colors.muted }]}>
            {searchQuery ? 'Aucun patient trouvé' : 'Aucun patient'}
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
    fontSize: 18,
    fontWeight: '700',
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
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  patientEmail: {
    fontSize: 13,
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
