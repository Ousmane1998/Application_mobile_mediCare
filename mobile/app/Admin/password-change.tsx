import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { changePassword } from '../../utils/api';
import Snackbar from '../../components/Snackbar';
import { useFormValidation } from '../../hooks/useFormValidation';
import { isStrongPassword } from '../../utils/validation';

export default function AdminPasswordChangeScreen() {
  const router = useRouter();
  const fv = useFormValidation(
    { oldPassword: '', password: '', confirm: '' },
    {
      oldPassword: (v) => (!String(v || '') ? 'Ancien mot de passe requis.' : null),
      password: (v) => (isStrongPassword(String(v || '')) ? null : '8–64, min. 1 lettre et 1 chiffre.'),
      confirm: (v, values) => (String(v || '') === String(values.password || '') ? null : 'Les mots de passe ne correspondent pas.'),
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'info' });
  const onSave = async () => {
    fv.markAllTouched();
    if (!fv.isValid) { setSnack({ visible: true, message: 'Veuillez corriger les erreurs.', type: 'error' }); return; }
    try {
      setSaving(true);
      setError(null);
      await changePassword(fv.values.oldPassword, fv.values.password);
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

      <View style={styles.group}><Text style={styles.label}>Ancien mot de passe</Text><TextInput style={[styles.input, fv.getError('oldPassword') && { borderColor: '#dc2626' }]} value={fv.values.oldPassword} onChangeText={(v) => fv.setField('oldPassword', v)} secureTextEntry {...fv.getInputProps('oldPassword')} />{fv.touched.oldPassword && fv.getError('oldPassword') ? (<Text style={styles.fieldError}>{fv.getError('oldPassword')}</Text>) : null}</View>
      <View style={styles.group}><Text style={styles.label}>Nouveau mot de passe</Text><TextInput style={[styles.input, fv.getError('password') && { borderColor: '#dc2626' }]} value={fv.values.password} onChangeText={(v) => fv.setField('password', v)} secureTextEntry {...fv.getInputProps('password')} />{fv.touched.password && fv.getError('password') ? (<Text style={styles.fieldError}>{fv.getError('password')}</Text>) : null}</View>
      <View style={styles.group}><Text style={styles.label}>Confirmer le mot de passe</Text><TextInput style={[styles.input, fv.getError('confirm') && { borderColor: '#dc2626' }]} value={fv.values.confirm} onChangeText={(v) => fv.setField('confirm', v)} secureTextEntry {...fv.getInputProps('confirm')} />{fv.touched.confirm && fv.getError('confirm') ? (<Text style={styles.fieldError}>{fv.getError('confirm')}</Text>) : null}</View>

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
  fieldError: { color: '#dc2626', fontSize: 12, marginTop: 6 },
  primaryBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  error: { color: '#DC2626', marginTop: 8 },
});
