// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import PageContainer from '../../components/PageContainer';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/header';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { adminUpdateUser, adminUpdateUserRole, adminListUsers, type AppUser } from '../../utils/api';

export default function UserEditPage() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const [user, setUser] = useState<AppUser | null>(null);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const users = await adminListUsers();
        const found = Array.isArray(users) ? users.find((u: any) => u._id === userId) : null;
        if (found) {
          setUser(found);
          setNom(found.nom || '');
          setPrenom(found.prenom || '');
          setEmail(found.email || '');
          setTelephone(found.telephone || '');
          setRole(found.role || 'patient');
        } else {
          Alert.alert('Erreur', 'Utilisateur non trouvé');
          router.back();
        }
      } catch (e) {
        console.error('❌ Erreur chargement utilisateur:', e);
        Alert.alert('Erreur', 'Impossible de charger les données');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleSave = async () => {
    if (!nom.trim() || !prenom.trim() || !email.trim()) {
      Alert.alert('Erreur', 'Tous les champs sont requis');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Sauvegarde des modifications...');
      
      // Préparer les données à mettre à jour
      const updateData: any = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim(),
        role,
      };
      
      if (telephone.trim()) {
        updateData.telephone = parseInt(telephone.trim());
      }
      
      // Mettre à jour l'utilisateur
      await adminUpdateUser(userId as string, updateData);
      console.log('✅ Utilisateur modifié avec succès');
      Alert.alert('Succès', 'Utilisateur modifié avec succès');
      router.back();
    } catch (e) {
      console.error('❌ Erreur sauvegarde:', e);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer style={styles.container}>
        <Header />
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </PageContainer>
    );
  }

  return (
    <PageContainer scroll style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />

      <Text style={styles.title}>Modifier l'utilisateur</Text>

      {/* Prénom */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Prénom</Text>
        <TextInput
          style={styles.input}
          placeholder="Prénom"
          value={prenom}
          onChangeText={setPrenom}
          editable={!saving}
        />
      </View>

      {/* Nom */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nom</Text>
        <TextInput
          style={styles.input}
          placeholder="Nom"
          value={nom}
          onChangeText={setNom}
          editable={!saving}
        />
      </View>

      {/* Email */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          editable={!saving}
        />
      </View>

      {/* Téléphone */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Téléphone</Text>
        <TextInput
          style={styles.input}
          placeholder="Téléphone"
          value={telephone}
          onChangeText={setTelephone}
          keyboardType="phone-pad"
          editable={!saving}
        />
      </View>

      {/* Rôle */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Rôle</Text>
        <View style={styles.roleButtons}>
          {['patient', 'medecin', 'admin'].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleBtn, role === r && styles.roleBtnActive]}
              onPress={() => setRole(r)}
              disabled={saving}
            >
              <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Boutons d'action */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.btn, styles.btnCancel]}
          onPress={() => router.back()}
          disabled={saving}
        >
          <Text style={styles.btnText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSave]}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name={saving ? 'hourglass' : 'checkmark'} size={18} color="#fff" />
          <Text style={styles.btnText}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</Text>
        </TouchableOpacity>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 12 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#6B7280' },

  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16, marginTop: 8 },

  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 6 },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  roleButtons: { flexDirection: 'row', gap: 8 },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  roleBtnActive: { backgroundColor: '#2ccdd2', borderColor: '#2ccdd2' },
  roleBtnText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  roleBtnTextActive: { color: '#fff' },

  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  btnCancel: { backgroundColor: '#E5E7EB' },
  btnSave: { backgroundColor: '#10B981' },
  btnText: { fontSize: 14, fontWeight: '600', color: '#111827' },
});
