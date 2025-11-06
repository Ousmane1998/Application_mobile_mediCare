import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { resetPasswordWithCode } from '../utils/api';
import { useFormValidation } from '../hooks/useFormValidation';
import { sanitize, hasDanger, isEmailValid, phoneDigits, isPhoneDigitsValid, isStrongPassword, isCodeValid } from '../utils/validation';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ identifier?: string }>();
  const fv = useFormValidation(
    {
      identifier: String(params.identifier || ''),
      code: '',
      password: '',
      confirm: '',
    },
    {
      identifier: (raw) => {
        const ident = sanitize(String(raw || ''));
        if (!ident) return 'Identifiant requis.';
        if (hasDanger(ident)) return 'Caractères interdits (<, >).';
        const ok = ident.includes('@') ? isEmailValid(ident) : isPhoneDigitsValid(phoneDigits(ident));
        return ok ? null : 'Identifiant invalide (email ou 7XXXXXXXX).';
      },
      code: (v) => (isCodeValid(String(v || '')) ? null : 'Code invalide (4–8 alphanum.).'),
      password: (v) => (isStrongPassword(String(v || '')) ? null : 'Mot de passe: 8–64, min. 1 lettre et 1 chiffre.'),
      confirm: (v, values) => (String(v || '') === String(values.password || '') ? null : 'Les mots de passe ne correspondent pas.'),
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const validate = () => null; // validation gérée par hook

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    fv.markAllTouched();
    if (!fv.isValid) { setError(null); return; }
    try {
      setLoading(true);
      await resetPasswordWithCode(sanitize(fv.values.identifier), sanitize(fv.values.code).toUpperCase(), fv.values.password);
      setInfo('Mot de passe réinitialisé.');
      setTimeout(() => router.replace('/login'), 800);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  // Keep focused field visible when keyboard appears
  const scrollRef = useRef<ScrollView>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const register = (key: string) => (el: TextInput | null) => { inputRefs.current[key] = el; };
  const scrollIntoView = (key: string) => {
    const input = inputRefs.current[key];
    const sc = scrollRef.current as any;
    if (!input || !sc) return;
    requestAnimationFrame(() => {
      const containerNode = sc.getInnerViewNode ? sc.getInnerViewNode() : sc.getScrollableNode?.();
      if (!containerNode || !input.measureLayout) return;
      input.measureLayout(containerNode, (_x: number, y: number) => sc.scrollTo({ y: Math.max(y - 24, 0), animated: true }), () => {});
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })} keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
      <Text style={styles.title}>Réinitialiser le mot de passe</Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email ou Téléphone</Text>
        <TextInput ref={register('identifier')} style={[styles.input, fv.getError('identifier') && { borderColor: '#dc2626' }]} value={fv.values.identifier} onChangeText={(v) => fv.setField('identifier', v)} autoCapitalize="none" maxLength={100} onFocus={() => scrollIntoView('identifier')} {...fv.getInputProps('identifier')} />
        {fv.touched.identifier && fv.getError('identifier') ? (<Text style={styles.fieldError}>{fv.getError('identifier')}</Text>) : null}
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Code de vérification</Text>
        <TextInput ref={register('code')} style={[styles.input, fv.getError('code') && { borderColor: '#dc2626' }]} value={fv.values.code} onChangeText={(t) => fv.setField('code', t.replace(/\s+/g, ''))} autoCapitalize="characters" maxLength={8} onFocus={() => scrollIntoView('code')} {...fv.getInputProps('code')} />
        {fv.touched.code && fv.getError('code') ? (<Text style={styles.fieldError}>{fv.getError('code')}</Text>) : null}
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nouveau mot de passe</Text>
        <TextInput ref={register('password')} style={[styles.input, fv.getError('password') && { borderColor: '#dc2626' }]} secureTextEntry value={fv.values.password} onChangeText={(v) => fv.setField('password', v)} maxLength={64} onFocus={() => scrollIntoView('password')} {...fv.getInputProps('password')} />
        {fv.touched.password && fv.getError('password') ? (<Text style={styles.fieldError}>{fv.getError('password')}</Text>) : null}
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Confirmer le mot de passe</Text>
        <TextInput ref={register('confirm')} style={[styles.input, fv.getError('confirm') && { borderColor: '#dc2626' }]} secureTextEntry value={fv.values.confirm} onChangeText={(v) => fv.setField('confirm', v)} maxLength={64} onFocus={() => scrollIntoView('confirm')} {...fv.getInputProps('confirm')} />
        {fv.touched.confirm && fv.getError('confirm') ? (<Text style={styles.fieldError}>{fv.getError('confirm')}</Text>) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.7 }]} disabled={loading} onPress={onSubmit}>
        <Text style={styles.primaryBtnText}>{loading ? 'Réinitialisation…' : 'Réinitialiser'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
        <Text style={{ color: '#2ccdd2' }}>Retour</Text>
      </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1 },
  title: { fontSize: 22, color: '#111827', marginTop: 24 },
  fieldGroup: { marginTop: 16 },
  label: { color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12 },
  fieldError: { color: '#dc2626', fontSize: 12, marginTop: 6 },
  primaryBtn: { backgroundColor: '#2ccdd2', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  error: { color: '#dc2626', marginTop: 8 },
  info: { color: '#065F46', marginTop: 8 },
  link: { color: '#2ccdd2' },
});
