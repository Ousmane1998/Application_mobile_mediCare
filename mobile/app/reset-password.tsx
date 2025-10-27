import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import PageContainer from '../components/PageContainer';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { resetPasswordWithCode } from '../utils/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ identifier?: string }>();
  const [identifier, setIdentifier] = useState(params.identifier || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    if (!identifier || !code || !password || !confirm) {
      setError('Tous les champs sont requis.');
      return;
    }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 6) { setError('6 caractères minimum.'); return; }
    try {
      setLoading(true);
      await resetPasswordWithCode(identifier, code, password);
      setInfo('Mot de passe réinitialisé.');
      setTimeout(() => router.replace('/login'), 800);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer scroll style={styles.container}>
      <Text style={styles.title}>Réinitialiser le mot de passe</Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email ou Téléphone</Text>
        <TextInput style={styles.input} value={identifier} onChangeText={setIdentifier} autoCapitalize="none" />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Code de vérification</Text>
        <TextInput style={styles.input} value={code} onChangeText={setCode} autoCapitalize="characters" />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nouveau mot de passe</Text>
        <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Confirmer le mot de passe</Text>
        <TextInput style={styles.input} secureTextEntry value={confirm} onChangeText={setConfirm} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.7 }]} disabled={loading} onPress={onSubmit}>
        <Text style={styles.primaryBtnText}>{loading ? 'Réinitialisation…' : 'Réinitialiser'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
        <Text style={{ color: '#2ccdd2' }}>Retour</Text>
      </TouchableOpacity>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1 },
  title: { fontSize: 22, color: '#111827', marginTop: 24 },
  fieldGroup: { marginTop: 16 },
  label: { color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12 },
  primaryBtn: { backgroundColor: '#2ccdd2', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  error: { color: '#dc2626', marginTop: 8 },
  info: { color: '#065F46', marginTop: 8 },
  link: { color: '#2ccdd2' },
});
