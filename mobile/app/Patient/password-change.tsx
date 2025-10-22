import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { changePassword } from '../../utils/api';

export default function PatientPasswordChangeScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    if (!password || !confirm) {
      Alert.alert('Validation', 'Veuillez renseigner les deux champs.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Validation', 'Les mots de passe ne correspondent pas.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await changePassword(password);
      Alert.alert('Succès', 'Mot de passe modifié avec succès.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Modifier le mot de passe</Text>

      <View style={styles.group}><Text style={styles.label}>Nouveau mot de passe</Text><TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry /></View>
      <View style={styles.group}><Text style={styles.label}>Confirmer le mot de passe</Text><TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry /></View>

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
