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

  const sanitize = (s: string) => (s || '').replace(/[\t\n\r]+/g, ' ').trim();
  const hasDanger = (s: string) => /[<>]/.test(s || '');
  const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s || '');
  const normalizePhone = (s: string) => (s || '').replace(/\D+/g, '');
  const isPhone = (digits: string) => /^7\d{8}$/.test(digits || '');
  const strongPwd = (s: string) => /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(s || '');
  const isCode = (s: string) => /^[A-Za-z0-9]{4,8}$/.test(s || '');

  const validate = () => {
    const ident = sanitize(identifier);
    const identOk = ident.includes('@') ? (isEmail(ident) && ident.length <= 100) : isPhone(normalizePhone(ident));
    if (!ident || !identOk) return "Identifiant invalide (email ou 7XXXXXXXX).";
    if (hasDanger(ident)) return 'Caractères interdits (<, >).';
    const cd = sanitize(code).toUpperCase();
    if (!isCode(cd)) return 'Code invalide (4–8 caractères alphanumériques).';
    if (!password || !confirm) return 'Tous les champs sont requis.';
    if (!strongPwd(password)) return 'Mot de passe: 8–64, min. 1 lettre et 1 chiffre.';
    if (password !== confirm) return 'Les mots de passe ne correspondent pas.';
    return null;
  };

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    const v = validate();
    if (v) { setError(v); return; }
    try {
      setLoading(true);
      await resetPasswordWithCode(sanitize(identifier), sanitize(code).toUpperCase(), password);
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
        <TextInput style={styles.input} value={identifier} onChangeText={setIdentifier} autoCapitalize="none" maxLength={100} />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Code de vérification</Text>
        <TextInput style={styles.input} value={code} onChangeText={(t) => setCode(t.replace(/\s+/g, ''))} autoCapitalize="characters" maxLength={8} />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nouveau mot de passe</Text>
        <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} maxLength={64} />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Confirmer le mot de passe</Text>
        <TextInput style={styles.input} secureTextEntry value={confirm} onChangeText={setConfirm} maxLength={64} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      <TouchableOpacity style={[styles.primaryBtn, (loading || !!validate()) && { opacity: 0.7 }]} disabled={loading || !!validate()} onPress={onSubmit}>
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
