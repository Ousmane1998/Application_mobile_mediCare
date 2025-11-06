import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { formatPhone, normalizePhone, nextSelectionAtEnd } from '../../utils/phone';
import { useRouter } from 'expo-router';
import { getProfile, updateProfile, type UserProfile } from '../../utils/api';
import Snackbar from '../../components/Snackbar';
import { useFormValidation } from '../../hooks/useFormValidation';
import { sanitize, hasDanger, isEmailValid, phoneDigits, isPhoneDigitsValid } from '../../utils/validation';

export default function AdminProfileEditScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ nom: string; prenom: string; email?: string; adresse?: string; age?: string; telephone?: string }>({ nom: '', prenom: '' });
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'info' });

  const fv = useFormValidation(
    { nom: '', prenom: '', email: '', adresse: '', age: '', telephone: '' },
    {
      nom: (v) => (!String(v || '').trim() ? 'Nom requis.' : null),
      prenom: (v) => (!String(v || '').trim() ? 'Prénom requis.' : null),
      email: (v) => (isEmailValid(String(v || '')) ? null : 'Email invalide.'),
      adresse: (v) => (!String(v || '').trim() ? 'Adresse requise.' : (String(v || '').length > 120 ? 'Adresse trop longue.' : null)),
      age: (v) => (/^\d{1,3}$/.test(String(v || '')) ? null : 'Âge invalide.'),
      telephone: (v) => (isPhoneDigitsValid(phoneDigits(String(v || ''))) ? null : 'Téléphone invalide (7XXXXXXXX).'),
    }
  );

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        const u = data.user as UserProfile;
        const next = {
          nom: u.nom || '',
          prenom: u.prenom || '',
          email: u.email || '',
          adresse: u.adresse || '',
          age: u.age ? String(u.age) : '',
          telephone: u.telephone || '',
        };
        setForm(next);
        // init hook values
        (Object.keys(next) as Array<keyof typeof next>).forEach((k) => {
          // @ts-ignore
          fv.setField(k, next[k]);
        });
      } catch (e: any) {
        setError(e?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSave = async () => {
    fv.markAllTouched();
    if (!fv.isValid) { setSnack({ visible: true, message: 'Veuillez corriger les erreurs.', type: 'error' }); return; }
    const telDigits = normalizePhone(fv.values.telephone || '');
    try {
      setSaving(true);
      setError(null);
      await updateProfile({
        nom: String(fv.values.nom),
        prenom: String(fv.values.prenom),
        email: String(fv.values.email),
        adresse: String(fv.values.adresse),
        age: Number(fv.values.age),
        telephone: telDigits,
      });
      setSnack({ visible: true, message: 'Profil modifié avec succès.', type: 'success' });
      setTimeout(() => router.back(), 800);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la sauvegarde');
      setSnack({ visible: true, message: e?.message || 'Erreur lors de la sauvegarde', type: 'error' });
    } finally {
      setSaving(false);
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Modifier le profil</Text>

      <View style={styles.group}><Text style={styles.label}>Nom</Text><TextInput style={[styles.input, fv.getError('nom') && { borderColor: '#dc2626' }]} value={fv.values.nom} onChangeText={(v) => fv.setField('nom', v)} {...fv.getInputProps('nom')} /></View>
      <View style={styles.group}><Text style={styles.label}>Prénom</Text><TextInput style={[styles.input, fv.getError('prenom') && { borderColor: '#dc2626' }]} value={fv.values.prenom} onChangeText={(v) => fv.setField('prenom', v)} {...fv.getInputProps('prenom')} /></View>
      <View style={styles.group}><Text style={styles.label}>Email</Text><TextInput style={[styles.input, fv.getError('email') && { borderColor: '#dc2626' }]} value={fv.values.email} onChangeText={(v) => fv.setField('email', v)} keyboardType="email-address" autoCapitalize="none" {...fv.getInputProps('email')} /></View>
      <View style={styles.group}><Text style={styles.label}>Adresse</Text><TextInput style={[styles.input, fv.getError('adresse') && { borderColor: '#dc2626' }]} value={fv.values.adresse} onChangeText={(v) => fv.setField('adresse', v)} {...fv.getInputProps('adresse')} /></View>
      <View style={styles.group}><Text style={styles.label}>Âge</Text><TextInput style={[styles.input, fv.getError('age') && { borderColor: '#dc2626' }]} value={fv.values.age} onChangeText={(v) => fv.setField('age', v)} keyboardType="numeric" {...fv.getInputProps('age')} /></View>
      <View style={styles.group}><Text style={styles.label}>Téléphone</Text><TextInput style={[styles.input, fv.getError('telephone') && { borderColor: '#dc2626' }]} value={formatPhone(fv.values.telephone || '')} selection={nextSelectionAtEnd(formatPhone(fv.values.telephone || ''))} onChangeText={(v) => fv.setField('telephone', formatPhone(v))} keyboardType="phone-pad" maxLength={12} placeholder="7X XXX XX XX" {...fv.getInputProps('telephone')} /></View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={onSave}>
        <Text style={styles.primaryBtnText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
      </TouchableOpacity>
      <Snackbar visible={snack.visible} message={snack.message} type={snack.type} onHide={() => setSnack((s) => ({ ...s, visible: false }))} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, color: '#111827', marginBottom: 40, marginTop: 32 },
  group: { marginBottom: 12 },
  label: { fontSize: 13, color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  primaryBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  error: { color: '#DC2626', marginTop: 8 },
});
