// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authRegisterDoctor } from '../utils/api';

export default function RegisterDoctorScreen() {
  const router = useRouter();

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [age, setAge] = useState('');
  const [adresse, setAdresse] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [hopital, setHopital] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isUserConnected, setIsUserConnected] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const sanitize = (s: string) => s.replace(/[\t\n\r]+/g, ' ').trim();
  const isName = (s: string) => /^[A-Za-zÀ-ÖØ-öø-ÿ'\-\s]{2,50}$/.test(s);
  const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);
  const normalizePhone = (s: string) => s.replace(/\D+/g, '');
  const isPhone = (digits: string) => /^7\d{8}$/.test(digits);

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const role = await AsyncStorage.getItem('userRole');
        
        console.log('🔍 [RegisterDoctor] Vérification connexion:', { token: !!token, role });
        
        if (token && role) {
          setIsUserConnected(true);
          setUserRole(role);
          console.log('✅ [RegisterDoctor] Utilisateur connecté:', { role });
        } else {
          setIsUserConnected(false);
          setUserRole(null);
          console.log('❌ [RegisterDoctor] Aucun utilisateur connecté');
        }
      } catch (err) {
        console.error('⚠️ [RegisterDoctor] Erreur vérification connexion:', err);
        setIsUserConnected(false);
        setUserRole(null);
      }
    };
    
    checkConnection();
  }, []);

  // Nettoyer les erreurs quand le composant se démonte
  useEffect(() => {
    return () => {
      setError(null);
      setSaving(false);
    };
  }, []);

  const validate = () => {
    const n = sanitize(nom);
    const p = sanitize(prenom);
    const em = sanitize(email);
    const ph = normalizePhone(telephone);
    const ad = sanitize(adresse);
    const sp = sanitize(specialite);
    const hop = sanitize(hopital);

    // Champs requis: nom, prenom, email, telephone
    if (!n || !p || !em || !ph) return 'Champs requis: nom, prénom, email, téléphone.';
    if (!isName(n) || !isName(p)) return 'Nom et prénom doivent comporter 2–50 lettres (accents autorisés).';
    if (!isEmail(em)) return 'Email invalide.';
    if (!isPhone(ph)) return "Téléphone invalide. Format attendu: 7XXXXXXXX.";
    return null;
  };

  const onSubmit = async () => {
    if (saving) return;
    const v = validate();
    if (v) { setError(v); return; }
    setError(null);
    setSaving(true);

    try {
      console.log('📝 [RegisterDoctor] Envoi des données:', { nom, prenom, email, telephone, adresse, specialite, hopital });
      
      const result = await authRegisterDoctor({
        nom: sanitize(nom),
        prenom: sanitize(prenom),
        email: sanitize(email),
        telephone: normalizePhone(telephone),
        age: age ? Number(age) : undefined,
        adresse: sanitize(adresse),
        specialite: sanitize(specialite),
        hopital: sanitize(hopital),
      });

      console.log('✅ [RegisterDoctor] Inscription réussie:', result);
      
      // Vérifier à nouveau si l'utilisateur est toujours connecté
      const currentToken = await AsyncStorage.getItem('authToken');
      const currentRole = await AsyncStorage.getItem('userRole');
      const isAdmin = currentToken && currentRole && 
        (currentRole === 'admin' || String(currentRole).toLowerCase() === 'admin');
      
      console.log('🔍 [RegisterDoctor] Vérification admin finale:', { isAdmin, currentRole });
      
      if (isAdmin) {
        // Admin connecté → rediriger vers le dashboard admin
        console.log('👨‍💼 [RegisterDoctor] Admin connecté → Redirection vers Admin/dashboard');
        Alert.alert('Succès', 'Médecin inscrit avec succès! Un email avec ses identifiants a été envoyé.', [
          { text: 'OK', onPress: () => router.replace('/Admin/dashboard') }
        ]);
      } else {
        // Pas connecté → rediriger vers login
        console.log('🔓 [RegisterDoctor] Non connecté → Redirection vers login');
        Alert.alert('Succès', 'Inscription réussie! Un email avec vos identifiants a été envoyé.', [
          { text: 'OK', onPress: () => router.replace('/login') }
        ]);
      }
    } catch (err: any) {
      console.error('❌ [RegisterDoctor] Erreur:', err.message);
      setError(err.message || 'Erreur lors de l\'inscription');
      setSaving(false);
    }
  };

  // Keep focused field visible when keyboard appears
  const scrollRef = useRef<ScrollView>(null);
  const scrollIntoView = (key: string) => {
    // Simplified scroll - just scroll down a bit when field is focused
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  
  // Register refs (needed for TextInput refs, even if not used for scroll)
  const register = (key: string) => (el: any) => {
    // Just a placeholder - we don't need to store these refs anymore
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })} keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.back} onPress={() => router.back()}>←</Text>
        <Text style={styles.headerTitle}>Inscription Médecin</Text>
        <View style={{ width: 20 }} />
      </View>

      <Text style={styles.sectionTitle}>Informations Personnelles</Text>
      {error ? <Text style={{ color: '#DC2626', marginBottom: 8 }}>{error}</Text> : null}

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nom *</Text>
        <TextInput
          ref={register('nom')}
          style={styles.input}
          placeholder="Entrez votre nom"
          value={nom}
          onChangeText={setNom}
          maxLength={50}
          onFocus={() => scrollIntoView('nom')}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Prénom *</Text>
        <TextInput
          ref={register('prenom')}
          style={styles.input}
          placeholder="Entrez votre prénom"
          value={prenom}
          onChangeText={setPrenom}
          maxLength={50}
          onFocus={() => scrollIntoView('prenom')}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Adresse e-mail *</Text>
        <TextInput
          ref={register('email')}
          style={styles.input}
          placeholder="nom@exemple.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          maxLength={100}
          onFocus={() => scrollIntoView('email')}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Numéro de téléphone *</Text>
        <TextInput
          ref={register('telephone')}
          style={styles.input}
          placeholder="77 123 45 67"
          keyboardType="phone-pad"
          value={telephone}
          onChangeText={setTelephone}
          maxLength={16}
          onFocus={() => scrollIntoView('telephone')}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Âge</Text>
        <TextInput
          ref={register('age')}
          style={styles.input}
          placeholder="Entrez votre âge"
          keyboardType="number-pad"
          value={age}
          onChangeText={setAge}
          maxLength={3}
          onFocus={() => scrollIntoView('age')}
        />
      </View>

      <Text style={styles.sectionTitle}>Informations Professionnelles</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Spécialité</Text>
        <TextInput
          ref={register('specialite')}
          style={styles.input}
          placeholder="Cardiologue, généraliste, ..."
          value={specialite}
          onChangeText={setSpecialite}
          maxLength={60}
          onFocus={() => scrollIntoView('specialite')}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Hôpital / Structure</Text>
        <TextInput
          ref={register('hopital')}
          style={styles.input}
          placeholder="Nom de votre hôpital ou structure"
          value={hopital}
          onChangeText={setHopital}
          maxLength={80}
          onFocus={() => scrollIntoView('hopital')}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Adresse</Text>
        <TextInput
          ref={register('adresse')}
          style={styles.input}
          placeholder="Adresse de votre structure"
          value={adresse}
          onChangeText={setAdresse}
          maxLength={120}
          onFocus={() => scrollIntoView('adresse')}
        />
      </View>

      <TouchableOpacity style={[styles.primaryBtn, (saving || !!validate()) && { opacity: 0.7 }]} disabled={saving || !!validate()} onPress={onSubmit}>
        <Text style={styles.primaryBtnText}>{saving ? 'Envoi…' : "S'inscrire"}</Text>
      </TouchableOpacity>

      {/* Afficher le lien de connexion SEULEMENT si l'utilisateur n'est pas connecté */}
      {!isUserConnected && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <Text style={styles.link} onPress={() => router.replace('/login')}>Connectez-vous</Text>
        </View>
      )}

      {/* Afficher un message si l'admin est connecté */}
      {isUserConnected && (userRole === 'admin' || String(userRole).toLowerCase() === 'admin') && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Vous êtes connecté en tant qu'admin</Text>
        </View>
      )}

      <Text style={styles.terms}>
        En vous inscrivant, vous acceptez notre Politique de confidentialité et nos Conditions d&apos;utilisation.
      </Text>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  back: {
    width: 20,
    textAlign: 'left',
    fontSize: 18,
    color: '#111827',
  },
  headerTitle: {
    fontSize: 16,
    color: '#111827',
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
    color: '#111827',
  },
  fieldGroup: {
    marginBottom: 12,
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
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  link: {
    color: '#2ccdd2',
    fontSize: 14,
  },
  terms: {
    marginTop: 8,
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
