// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { formatPhone, normalizePhone, nextSelectionAtEnd } from '../../utils/phone';
import PageContainer from '../../components/PageContainer';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/header';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { adminUpdateUser, adminUpdateUserRole, adminListUsers, type AppUser } from '../../utils/api';
import { useFormValidation } from '../../hooks/useFormValidation';
import { isEmailValid, phoneDigits, isPhoneDigitsValid, isName, sanitize, hasDanger } from '../../utils/validation';

export default function UserEditPage() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const [user, setUser] = useState<AppUser | null>(null);
  const fv = useFormValidation(
    { nom: '', prenom: '', email: '', telephone: '' },
    {
      nom: (v) => (isName(String(v || '')) ? null : 'Nom invalide (2–50).'),
      prenom: (v) => (isName(String(v || '')) ? null : 'Prénom invalide (2–50).'),
      email: (v) => (isEmailValid(String(v || '')) ? null : 'Email invalide.'),
      telephone: (v) => {
        const d = phoneDigits(String(v || ''));
        if (!d) return null; // facultatif
        return isPhoneDigitsValid(d) ? null : 'Téléphone invalide (7XXXXXXXX).';
      },
    }
  );
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
          fv.setField('nom', found.nom || '');
          fv.setField('prenom', found.prenom || '');
          fv.setField('email', found.email || '');
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
    fv.markAllTouched();
    if (!fv.isValid) { Alert.alert('Erreur', 'Veuillez corriger les erreurs.'); return; }

    try {
      setSaving(true);
      console.log('💾 Sauvegarde des modifications...');
      
      // Préparer les données à mettre à jour
      const updateData: any = {
        nom: String(fv.values.nom).trim(),
        prenom: String(fv.values.prenom).trim(),
        email: String(fv.values.email).trim(),
        role,
      };
      
      if (String(telephone).trim()) {
        const digits = normalizePhone(telephone);
        if (digits) updateData.telephone = parseInt(digits);
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
      <ScrollView style={styles.container}>
        <Header />
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />

      <Text style={styles.title}>Modifier l'utilisateur</Text>

      {/* Prénom */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Prénom</Text>
        <TextInput
          style={[styles.input, fv.getError('prenom') && { borderColor: '#dc2626' }]}
          placeholder="Prénom"
          value={fv.values.prenom}
          onChangeText={(v) => fv.setField('prenom', v)}
          editable={!saving}
          {...fv.getInputProps('prenom')}
        />
        {fv.touched.prenom && fv.getError('prenom') ? (<Text style={styles.fieldError}>{fv.getError('prenom')}</Text>) : null}
      </View>

      {/* Nom */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nom</Text>
        <TextInput
          style={[styles.input, fv.getError('nom') && { borderColor: '#dc2626' }]}
          placeholder="Nom"
          value={fv.values.nom}
          onChangeText={(v) => fv.setField('nom', v)}
          editable={!saving}
          {...fv.getInputProps('nom')}
        />
        {fv.touched.nom && fv.getError('nom') ? (<Text style={styles.fieldError}>{fv.getError('nom')}</Text>) : null}
      </View>

      {/* Email */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, fv.getError('email') && { borderColor: '#dc2626' }]}
          placeholder="Email"
          value={fv.values.email}
          onChangeText={(v) => fv.setField('email', v)}
          keyboardType="email-address"
          editable={!saving}
          autoCapitalize="none"
          {...fv.getInputProps('email')}
        />
        {fv.touched.email && fv.getError('email') ? (<Text style={styles.fieldError}>{fv.getError('email')}</Text>) : null}
      </View>

      {/* Téléphone */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Téléphone</Text>
        <TextInput
          style={[styles.input, fv.getError('telephone') && { borderColor: '#dc2626' }]}
          placeholder="Téléphone"
          value={formatPhone(telephone)}
          selection={nextSelectionAtEnd(formatPhone(telephone))}
          onChangeText={(v) => setTelephone(formatPhone(v))}
          keyboardType="phone-pad"
          editable={!saving}
          maxLength={12}
          {...fv.getInputProps('telephone')}
          onBlur={() => fv.setField('telephone', telephone)}
        />
        {fv.touched.telephone && fv.getError('telephone') ? (<Text style={styles.fieldError}>{fv.getError('telephone')}</Text>) : null}
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
    </ScrollView>
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
  fieldError: { color: '#dc2626', fontSize: 12, marginTop: 6 },

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
