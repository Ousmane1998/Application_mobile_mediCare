/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { API_URL } from '../utils/api';
import { useAppTheme } from '../theme/ThemeContext';


WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gLoading, setGLoading] = useState(false);

const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  responseType: "id_token",
  scopes: ["profile", "email"],
});

  const sanitize = (s: string) => (s || '').replace(/[\t\n\r]+/g, ' ').trim();
  const hasDanger = (s: string) => /[<>]/.test(s || '');
  const emailRegex = /^\S+@\S+\.\S+$/;
  const phoneRegex = /^7\d{8}$/;
  const validate = () => {
    const ident = sanitize(emailOrPhone);
    const pwd = String(password);
    if (!ident || !pwd) return 'mail ou telephone requis.';
    if (hasDanger(ident)) return 'Caractères interdits détectés (<, >).';
    if (ident.includes('@')) {
      if (!emailRegex.test(ident) || ident.length > 100) return 'Format email invalide. Format attendu: string@string.string.';
    } else {
      if (!phoneRegex.test(ident)) return 'Format téléphone invalide. Format attendu: 7X XXX XX XX.';
    }
    if (pwd.length < 6 || pwd.length > 64) return 'Le mot de passe doit contenir entre 6 et 64 caractères.';
    return null;
  };

  const onLogin = async () => {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      console.log("🔗 Tentative de connexion à :", `${API_URL}/api/auth/login`);

      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiant: sanitize(emailOrPhone), password }),
      });
      const raw = await res.text();
      console.log("📡 Réponse brute :", res.status, raw);
      const data = JSON.parse(raw);

      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || 'Échec de la connexion.';
        setError(String(msg));
        return;
      }
      const token: string | undefined = data?.token || data?.accessToken;
      const user = data?.user || {};
      const roleRaw: string | undefined = user?.role || data?.role;
      const role = (roleRaw || '').toLowerCase();

      // Block doctor login until admin activation
      const isDoctor = role === 'doctor' || role === 'medecin';
      const statusStr = typeof user?.status === 'string' ? String(user.status).toLowerCase() : undefined;
      const notActive = (user?.active === false) || (user?.isActive === false) || (statusStr ? statusStr !== 'active' : false);
      if (isDoctor && notActive) {
        setError("Votre compte médecin doit être activé par un administrateur avant connexion.");
        return;
      }

      if (token) await AsyncStorage.setItem('authToken', token);
      if (roleRaw) await AsyncStorage.setItem('userRole', roleRaw);

      if (role === 'admin') {
        router.replace('/Admin/dashboard');
      } else if (role === 'doctor' || role === 'medecin') {
        router.replace('/Doctor/dashboard');
      } else if (role === 'patient') {
        router.replace('/Patient/dashboard');
      } else {
        setError("Rôle d'utilisateur inconnu.");
      }
    } catch (e: any) {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handle = async () => {
      if (response?.type === 'success') {
        try {
          setGLoading(true);
          setError(null);
          const idToken = response.authentication?.idToken as string | undefined;
          if (!idToken) {
            setError('Connexion Google invalide.');
            return;
          }
          const res = await fetch(`${API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            const msg = (data && (data.message || data.error)) || 'Échec de la connexion Google.';
            setError(String(msg));
            return;
          }
          const token: string | undefined = data?.token || data?.accessToken;
          const user = data?.user || {};
          const roleRaw: string | undefined = user?.role || data?.role;
          const role = (roleRaw || '').toLowerCase();

          // Block doctor login until admin activation
          const isDoctor = role === 'doctor' || role === 'medecin';
          const statusStr = typeof user?.status === 'string' ? String(user.status).toLowerCase() : undefined;
          const notActive = (user?.active === false) || (user?.isActive === false) || (statusStr ? statusStr !== 'active' : false);
          if (isDoctor && notActive) {
            setError("Votre compte médecin doit être activé par un administrateur avant connexion.");
            return;
          }

          if (token) await AsyncStorage.setItem('authToken', token);
          if (roleRaw) await AsyncStorage.setItem('userRole', roleRaw);
          if (role === 'admin') {
            router.replace('/Admin/dashboard');
          } else if (role === 'doctor' || role === 'medecin') {
            router.replace('/Doctor/dashboard');
          } else if (role === 'patient') {
            router.replace('/Patient/dashboard');
          } else {
            setError("Rôle d'utilisateur inconnu.");
          }
        } catch (e: any) {
          setError('Impossible de contacter le serveur.');
        } finally {
          setGLoading(false);
        }
      }
    };
    handle();
  }, [response]);

  const onGoogleLogin = async () => {
    setError(null);
    await promptAsync();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.container}> 
      <View style={styles.header}>        
        <Image source={require('../assets/images/logoMedicare.png')} style={{width: 75, height: 75,}} />
      </View>

      <View style={styles.avatarWrap}>
        <Image source={require('../assets/images/docteur medicare.jpg')} style={{width: 300, height: 300}}/>
      </View>

      <Text style={[styles.title, { color: theme.colors.text }]}>Ravi de vous revoir</Text>
      <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Connectez-vous à votre compte</Text>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Email ou Téléphone</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder="Entrez votre email ou téléphone"
          value={emailOrPhone}
          onChangeText={setEmailOrPhone}
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={100}
          placeholderTextColor={theme.colors.muted}
          selectionColor={theme.colors.primary}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Mot de passe</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
            placeholder="Entrez votre mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            maxLength={64}
            placeholderTextColor={theme.colors.muted}
            selectionColor={theme.colors.primary}
          />
          <TouchableOpacity style={styles.eye} onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.push('/forgot-password' as any)}>
          <Text style={[styles.forgot, { color: theme.colors.primary }]}>Mot de passe oublié ?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }, (loading || !!validate()) && { opacity: 0.7 }]} disabled={loading || !!validate()} onPress={onLogin}>
        <Text style={[styles.primaryBtnText, { color: theme.colors.primaryText }]}>{loading ? 'Connexion…' : 'Se Connecter'}</Text>
      </TouchableOpacity>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <View style={styles.separatorRow}>
        <View style={styles.separator} />
        <Text style={[styles.sepText, { color: theme.colors.muted }]}>Ou continuer avec</Text>
        <View style={styles.separator} />
      </View>

      <TouchableOpacity style={[styles.googleBtn, { borderColor: theme.colors.border }, (loading || gLoading) && { opacity: 0.7 }]} disabled={loading || gLoading} onPress={onGoogleLogin}>
        <Image source={require('../assets/images/google.png')} style={{width: 24, height: 24}} />
        <Text style={[styles.googleText, { color: theme.colors.text }]}>{gLoading ? 'Connexion…' : 'Google'}</Text>
      </TouchableOpacity>

      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: theme.colors.muted }]}>Pas encore de compte ? </Text>
        <Text style={[styles.signup, { color: theme.colors.primary }]} onPress={() => router.push('/register-doctor')}>S&apos;inscrire</Text>
      </View>
    </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginHorizontal: 40,
    marginBottom: 16,
    marginTop: 16,
    justifyContent: 'center',
    flex: 1,

  },
  brandIcon: {
    fontSize: 18,
    color: '#2ccdd2',
  },
  brand: {
    fontSize: 18,
    color: '#2ccdd2',
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: 16,
  },
  avatar: {
    fontSize: 80,
  },
  title: {
    fontSize: 24,
    color: '#374151',
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontSize: 15,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eye: {
    marginLeft: 8,
    fontSize: 18,
    paddingHorizontal: 4,
    color: '#6B7280',
  },
  forgot: {
    color: '#2ccdd2',
    fontSize: 13,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  primaryBtn: {
    backgroundColor: '#2ccdd2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  separatorRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  separator: {
    height: 1,
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  sepText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  googleBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  googleIcon: {
    fontSize: 14,
  },
  googleText: {
    fontSize: 15,
    color: '#111827',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  signup: {
    color: '#2ccdd2',
    fontSize: 14,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 8,
  },
});
