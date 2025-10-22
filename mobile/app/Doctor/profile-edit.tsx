import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getProfile, updateProfile, type UserProfile } from '../../utils/api';

export default function DoctorProfileEditScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ nom: string; prenom: string; email?: string; adresse?: string; age?: string; telephone?: string; specialite?: string; hopital?: string }>({ nom: '', prenom: '' });

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        const u = data.user as UserProfile;
        setForm({
          nom: u.nom || '',
          prenom: u.prenom || '',
          email: u.email || '',
          adresse: u.adresse || '',
          age: u.age ? String(u.age) : '',
          telephone: u.telephone || '',
          specialite: u.specialite || '',
          hopital: u.hopital || '',
        });
      } catch (e: any) {
        setError(e?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSave = async () => {
    if (!form.nom || !form.prenom || !form.email || !form.adresse || !form.age || !form.telephone) {
      Alert.alert('Validation', 'Tous les champs sont requis.');
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    const phoneRegex = /^7\d{8}$/;
    if (!emailRegex.test(form.email)) {
      Alert.alert('Validation', 'Format email invalide. Format attendu: string@string.string.');
      return;
    }
    if (!phoneRegex.test(form.telephone)) {
      Alert.alert('Validation', 'Format téléphone invalide. Format attendu: 7XXXXXXXX.');
      return;
    }
    if (isNaN(Number(form.age))) {
      Alert.alert('Validation', "Âge invalide.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await updateProfile({
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        adresse: form.adresse,
        age: Number(form.age),
        telephone: form.telephone,
        specialite: form.specialite,
        hopital: form.hopital,
      });
      Alert.alert('Succès', 'Profil modifié avec succès.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la sauvegarde');
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

      <View style={styles.group}><Text style={styles.label}>Nom</Text><TextInput style={styles.input} value={form.nom} onChangeText={(v) => setForm((f) => ({ ...f, nom: v }))} /></View>
      <View style={styles.group}><Text style={styles.label}>Prénom</Text><TextInput style={styles.input} value={form.prenom} onChangeText={(v) => setForm((f) => ({ ...f, prenom: v }))} /></View>
      <View style={styles.group}><Text style={styles.label}>Email</Text><TextInput style={styles.input} value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" /></View>
      <View style={styles.group}><Text style={styles.label}>Adresse</Text><TextInput style={styles.input} value={form.adresse} onChangeText={(v) => setForm((f) => ({ ...f, adresse: v }))} /></View>
      <View style={styles.group}><Text style={styles.label}>Âge</Text><TextInput style={styles.input} value={form.age} onChangeText={(v) => setForm((f) => ({ ...f, age: v }))} keyboardType="numeric" /></View>
      <View style={styles.group}><Text style={styles.label}>Téléphone</Text><TextInput style={styles.input} value={form.telephone} onChangeText={(v) => setForm((f) => ({ ...f, telephone: v }))} keyboardType="phone-pad" /></View>
      <View style={styles.group}><Text style={styles.label}>Spécialité</Text><TextInput style={styles.input} value={form.specialite} onChangeText={(v) => setForm((f) => ({ ...f, specialite: v }))} /></View>
      <View style={styles.group}><Text style={styles.label}>Hôpital</Text><TextInput style={styles.input} value={form.hopital} onChangeText={(v) => setForm((f) => ({ ...f, hopital: v }))} /></View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={onSave}>
        <Text style={styles.primaryBtnText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, color: '#111827', marginBottom: 12 },
  group: { marginBottom: 12 },
  label: { fontSize: 13, color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  primaryBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  error: { color: '#DC2626', marginTop: 8 },
});
