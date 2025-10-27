import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { changePassword } from '../../utils/api';
import Snackbar from '../../components/Snackbar';

export default function DoctorPasswordChangeScreen() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'info' });

  const onSave = async () => {
    if (!oldPassword) {
      setSnack({ visible: true, message: "Saisir l'ancien mot de passe.", type: 'error' });
      return;
    }
    if (!password || !confirm) {
      setSnack({ visible: true, message: 'Veuillez renseigner les deux champs.', type: 'error' });
      return;
    }
    if (password.length < 6 || confirm.length < 6) {
      setSnack({ visible: true, message: 'Le mot de passe doit contenir au moins 6 caractères.', type: 'error' });
      return;
    }
    if (password !== confirm) {
      setSnack({ visible: true, message: 'Les mots de passe ne correspondent pas.', type: 'error' });
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await changePassword(oldPassword, password);
      setSnack({ visible: true, message: 'Mot de passe modifié avec succès.', type: 'success' });
      setTimeout(() => router.back(), 800);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la modification');
      setSnack({ visible: true, message: e?.message || 'Erreur lors de la modification', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Modifier le mot de passe</Text>

      <View style={styles.group}><Text style={styles.label}>Ancien mot de passe</Text><TextInput style={styles.input} value={oldPassword} onChangeText={setOldPassword} secureTextEntry /></View>
      <View style={styles.group}><Text style={styles.label}>Nouveau mot de passe</Text><TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry /></View>
      <View style={styles.group}><Text style={styles.label}>Confirmer le mot de passe</Text><TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry /></View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={onSave}>
        <Text style={styles.primaryBtnText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
      </TouchableOpacity>
      <Snackbar visible={snack.visible} message={snack.message} type={snack.type} onHide={() => setSnack((s) => ({ ...s, visible: false }))} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, marginBottom: 40, marginTop: 32 },
  title: { fontSize: 18, color: '#111827', marginBottom: 12 },
  group: { marginBottom: 12 },
  label: { fontSize: 13, color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  primaryBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  error: { color: '#DC2626', marginTop: 8 },
});
