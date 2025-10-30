// @ts-nocheck
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {FileSystemUploadType} from 'expo-file-system/build/legacy/FileSystem.types';

export default function RegisterDoctorScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [hopital, setHopital] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleUpload = () => {};

  const sanitize = (s: string) => s.replace(/[\t\n\r]+/g, ' ').trim();
  const hasDanger = (s: string) => /[<>]/.test(s);
  const isName = (s: string) => /^[A-Za-zÀ-ÖØ-öø-ÿ'\-\s]{2,50}$/.test(s);
  const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s) && s.length <= 100;
  const normalizePhone = (s: string) => s.replace(/\D+/g, '');
  const isPhone = (digits: string) => /^7\d{8}$/.test(digits);
  const isLicense = (s: string) => /^[A-Za-z0-9\-]{3,50}$/.test(s);
  const strongPwd = (s: string) => /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(s);

  const validate = () => {
    const fn = sanitize(firstName);
    const ln = sanitize(lastName);
    const em = sanitize(email);
    const ph = normalizePhone(phone);
    const sp = sanitize(specialty);
    const lic = sanitize(licenseNumber);
    const adr = sanitize(clinicAddress);
    const hop = sanitize(hopital);
    const pw = password;

    if ([fn, ln, em, ph, sp, lic, adr, hop, pw].some(v => v === '')) return 'Tous les champs sont requis.';
    if ([fn, ln, sp, lic, adr, hop].some(hasDanger)) return 'Caractères interdits détectés (<, >).';
    if (!isName(ln) || !isName(fn)) return 'Nom et prénom doivent comporter 2–50 lettres (accents autorisés).';
    if (!isEmail(em)) return 'Email invalide.';
    if (!isPhone(ph)) return "Téléphone invalide. Format attendu: 7XXXXXXXX.";
    if (!isLicense(lic)) return "Numéro d'agrément invalide (3–50 alphanumériques et tirets).";
    if (sp.length > 60 || hop.length > 80 || adr.length > 120) return 'Texte trop long.';
    if (!strongPwd(pw)) return 'Mot de passe faible: 8–64 caractères, au moins une lettre et un chiffre.';
    return null;
  };

  const onSubmit = () => {
    if (saving) return;
    const v = validate();
    if (v) { setError(v); return; }
    setError(null);
    setSaving(true);
    router.replace('/login');
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
      input.measureLayout(containerNode, (_x: number, y: number) => {
        sc.scrollTo({ y: Math.max(y - 24, 0), animated: true });
      }, () => {});
    });
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
        <Text style={styles.label}>Nom</Text>
        <TextInput
          ref={register('lastName')}
          style={styles.input}
          placeholder="Entrez votre nom"
          value={lastName}
          onChangeText={setLastName}
          maxLength={50}
          onFocus={() => scrollIntoView('lastName')}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Prénom</Text>
        <TextInput
          ref={register('firstName')}
          style={styles.input}
          placeholder="Entrez votre prénom"
          value={firstName}
          onChangeText={setFirstName}
          onFocus={() => scrollIntoView('firstName')}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Adresse e-mail</Text>
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
        <Text style={styles.label}>Numéro de téléphone</Text>
        <TextInput
          ref={register('phone')}
          style={styles.input}
          placeholder="77 123 45 67"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={16}
          onFocus={() => scrollIntoView('phone')}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text>Mot de passe</Text>
        <TextInput
          ref={register('password')}
          style={styles.input}
          placeholder="Entrez votre mot de passe"
          value={password}
          onChangeText={setPassword}
          maxLength={64}
          secureTextEntry
          onFocus={() => scrollIntoView('password')}
        />
      </View>

      <Text style={styles.sectionTitle}>Informations Professionnelles</Text>

      
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Spécialité</Text>
        <TextInput
          ref={register('specialty')}
          style={styles.input}
          placeholder="Cardiologue, generaliste,..."
          value={specialty}
          onChangeText={setSpecialty}
          maxLength={60}
          onFocus={() => scrollIntoView('specialty')}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Numéro d&apos;ordre</Text>
        <TextInput
          ref={register('license')}
          style={styles.input}
          placeholder="Entrez votre numéro d'ordre"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          maxLength={50}
          onFocus={() => scrollIntoView('license')}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Structure de rattachement</Text>
        <TextInput
          ref={register('hopital')}
          style={styles.input}
          placeholder="Entrez le nom du structure ou vous etes rattaché"
          value={hopital}
          onChangeText={setHopital}
          maxLength={80}
          onFocus={() => scrollIntoView('hopital')}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Adresse de la structure</Text>
        <TextInput
          ref={register('clinicAddress')}
          style={styles.input}
          placeholder="Entrez l'adresse de la structure"
          value={clinicAddress}
          onChangeText={setClinicAddress}
          maxLength={120}
          onFocus={() => scrollIntoView('clinicAddress')}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Photo</Text>
        <Text>Telecharger une photo</Text>
        <TouchableOpacity onPress={handleUpload}>
          <Text>Telecharger une photo</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.primaryBtn, (saving || !!validate()) && { opacity: 0.7 }]} disabled={saving || !!validate()} onPress={onSubmit}>
        <Text style={styles.primaryBtnText}>{saving ? 'Envoi…' : "S'inscrire"}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Déjà un compte ? </Text>
        <Text style={styles.link} onPress={() => router.replace('/login')}>Connectez-vous</Text>
      </View>

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
