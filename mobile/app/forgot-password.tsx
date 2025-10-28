import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import PageContainer from '../components/PageContainer';
import { useRouter } from 'expo-router';
import { requestPasswordReset } from '../utils/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const sanitize = (s: string) => (s || '').replace(/[\t\n\r]+/g, ' ').trim();
  const hasDanger = (s: string) => /[<>]/.test(s || '');
  const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s || '');
  const validate = () => {
    const v = sanitize(identifier);
    if (!v) return 'Email requis.';
    if (hasDanger(v)) return 'Caractères interdits (<, >).';
    if (!isEmail(v) || v.length > 100) return 'Email invalide.';
    return null;
  };

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    const v = validate();
    if (v) { setError(v); return; }
    try {
      setLoading(true);
      await requestPasswordReset(sanitize(identifier));
      setInfo('Un code de réinitialisation vous a été envoyé par email.');
      router.push('/reset-password' as any);
      router.setParams({ identifier });
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer scroll style={styles.container}>
      <Text style={styles.title}>Mot de passe oublié</Text>
      <Text style={styles.subtitle}>Entrez votre email pour recevoir un code de réinitialisation.</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={identifier} onChangeText={setIdentifier} placeholder="ex: example@example.com" autoCapitalize="none" maxLength={100} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      <TouchableOpacity style={[styles.primaryBtn, (loading || !!validate()) && { opacity: 0.7 }]} disabled={loading || !!validate()} onPress={onSubmit}>
        <Text style={styles.primaryBtnText}>{loading ? 'Envoi…' : 'Envoyer le code'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
        <Text style={styles.link}>Retour</Text>
      </TouchableOpacity>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1 },
  title: { fontSize: 22, color: '#111827' },
  subtitle: { color: '#6B7280', marginTop: 6 },
  fieldGroup: { marginTop: 16 },
  label: { color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12 },
  primaryBtn: { backgroundColor: '#2ccdd2', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  error: { color: '#dc2626', marginTop: 8 },
  info: { color: '#065F46', marginTop: 8 },
  link: { color: '#2ccdd2' },
});
