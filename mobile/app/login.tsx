/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { API_URL } from '../utils/api';


WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gLoading, setGLoading] = useState(false);

  const expoClientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || '';
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

  const [request, response, promptAsync] = Google.useAuthRequest({
    // expoClientId: expoClientId || undefined,
    iosClientId: iosClientId || undefined,
    androidClientId: androidClientId || undefined,
    responseType: 'id_token',
    scopes: ['profile', 'email'],
  });

  const onLogin = async () => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    const phoneRegex = /^7\d{8}$/;
    if (!emailOrPhone || !password) {
      setError('Veuillez renseigner vos identifiants.');
      return;
    }
    const isEmail = emailOrPhone.includes('@');
    if (isEmail) {
      if (!emailRegex.test(emailOrPhone)) {
        setError('Format email invalide. Format attendu: string@string.string.');
        return;
      }
    } else {
      if (!phoneRegex.test(emailOrPhone)) {
        setError('Format téléphone invalide. Format attendu: 7XXXXXXXX.');
        return;
      }
    }
    if (String(password).length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: emailOrPhone, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || 'Échec de la connexion.';
        setError(String(msg));
        return;
      }
      const token: string | undefined = data?.token || data?.accessToken;
      const roleRaw: string | undefined = data?.user?.role || data?.role;
      if (token) await AsyncStorage.setItem('authToken', token);
      if (roleRaw) await AsyncStorage.setItem('userRole', roleRaw);

      const role = (roleRaw || '').toLowerCase();
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
          const res = await fetch(`${API_URL}/auth/google`, {
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
          const roleRaw: string | undefined = data?.user?.role || data?.role;
          if (token) await AsyncStorage.setItem('authToken', token);
          if (roleRaw) await AsyncStorage.setItem('userRole', roleRaw);
          const role = (roleRaw || '').toLowerCase();
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
    <ScrollView>
      <View style={styles.container}>
      <View style={styles.header}>        
        <Image source={require('../assets/images/logo MediCare.png')} style={{width: 50, height: 50}} />
        <Text style={styles.brand}>MediCare</Text>
      </View>

      <View style={styles.avatarWrap}>
        <Image source={require('../assets/images/docteur medicare.jpg')} style={{width: 200, height: 200}}/>
      </View>

      <Text style={styles.title}>Ravi de vous revoir</Text>
      <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email ou Téléphone</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez votre email ou téléphone"
          value={emailOrPhone}
          onChangeText={setEmailOrPhone}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Mot de passe</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Entrez votre mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity style={styles.eye} onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Text style={styles.forgot}>Mot de passe oublié ?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.7 }]} disabled={loading} onPress={onLogin}>
        <Text style={styles.primaryBtnText}>{loading ? 'Connexion…' : 'Se Connecter'}</Text>
      </TouchableOpacity>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <View style={styles.separatorRow}>
        <View style={styles.separator} />
        <Text style={styles.sepText}>Ou continuer avec</Text>
        <View style={styles.separator} />
      </View>

      <TouchableOpacity style={[styles.googleBtn, (loading || gLoading) && { opacity: 0.7 }]} disabled={loading || gLoading} onPress={onGoogleLogin}>
        <Image source={require('../assets/images/google.png')} style={{width: 24, height: 24}} />
        <Text style={styles.googleText}>{gLoading ? 'Connexion…' : 'Google'}</Text>
      </TouchableOpacity>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Pas encore de compte ? </Text>
        <Text style={styles.signup} onPress={() => router.push('/register-doctor')}>S&apos;inscrire</Text>
      </View>
    </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandIcon: {
    fontSize: 18,
    color: '#2ccdd2',
  },
  brand: {
    fontSize: 18,
    color: '#2E2E2E',
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
