// @ts-nocheck
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {FileSystemUploadType} from 'expo-file-system/build/legacy/FileSystem.types';
import { formatPhone, normalizePhone, nextSelectionAtEnd } from '../utils/phone';
import { useFormValidation } from '../hooks/useFormValidation';

export default function RegisterDoctorScreen() {
  const router = useRouter();

  const fv = useFormValidation(
    {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialty: '',
      licenseNumber: '',
      clinicAddress: '',
      hopital: '',
      password: '',
    },
    {
      firstName: (v) => (!isName(sanitize(String(v || ''))) ? 'Prénom invalide (2–50 lettres).' : null),
      lastName: (v) => (!isName(sanitize(String(v || ''))) ? 'Nom invalide (2–50 lettres).' : null),
      email: (v) => (!isEmail(sanitize(String(v || ''))) ? 'Email invalide.' : null),
      phone: (v) => (!isPhone(normalizePhone(String(v || ''))) ? "Téléphone invalide. Format 7XXXXXXXX." : null),
      specialty: (v) => (sanitize(String(v || '')).length === 0 ? 'Spécialité requise.' : (sanitize(String(v || '')).length > 60 ? 'Spécialité trop longue.' : null)),
      licenseNumber: (v) => (!isLicense(sanitize(String(v || ''))) ? "Numéro d'agrément invalide." : null),
      clinicAddress: (v) => (sanitize(String(v || '')).length === 0 ? 'Adresse requise.' : (sanitize(String(v || '')).length > 120 ? 'Adresse trop longue.' : null)),
      hopital: (v) => (sanitize(String(v || '')).length === 0 ? 'Structure requise.' : (sanitize(String(v || '')).length > 80 ? 'Structure trop longue.' : null)),
      password: (v) => (!strongPwd(String(v || '')) ? 'Mot de passe faible (8+, 1 lettre et 1 chiffre).' : null),
    }
  );
  const [photo, setPhoto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleUpload = () => {};

  const sanitize = (s: string) => s.replace(/[\t\n\r]+/g, ' ').trim();
  const hasDanger = (s: string) => /[<>]/.test(s);
  const isName = (s: string) => /^[A-Za-zÀ-ÖØ-öø-ÿ'\-\s]{2,50}$/.test(s);
  const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s) && s.length <= 100;
  const isPhone = (digits: string) => /^7\d{8}$/.test(digits);
  const isLicense = (s: string) => /^[A-Za-z0-9\-]{3,50}$/.test(s);
  const strongPwd = (s: string) => /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(s);

  const validate = () => {
    // conserve la validation globale comme sauvegarde
    const vals = fv.values;
    if (Object.values(vals).some((v) => String(v || '').trim() === '')) return 'Tous les champs sont requis.';
    if ([vals.firstName, vals.lastName, vals.specialty, vals.licenseNumber, vals.clinicAddress, vals.hopital].some(hasDanger)) return 'Caractères interdits détectés (<, >).';
    return null;
  };

  const onSubmit = () => {
    if (saving) return;
    fv.markAllTouched();
    if (!fv.isValid) { setError(null); return; }
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
          style={[styles.input, fv.getError('lastName') && { borderColor: '#dc2626' }]}
          placeholder="Entrez votre nom"
          value={fv.values.lastName}
          onChangeText={(v) => fv.setField('lastName', v)}
          maxLength={50}
          onFocus={() => scrollIntoView('lastName')}
          {...fv.getInputProps('lastName')}
        />
        {fv.touched.lastName && fv.getError('lastName') ? (<Text style={styles.fieldError}>{fv.getError('lastName')}</Text>) : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Prénom</Text>
        <TextInput
          ref={register('firstName')}
          style={[styles.input, fv.getError('firstName') && { borderColor: '#dc2626' }]}
          placeholder="Entrez votre prénom"
          value={fv.values.firstName}
          onChangeText={(v) => fv.setField('firstName', v)}
          onFocus={() => scrollIntoView('firstName')}
          {...fv.getInputProps('firstName')}
        />
        {fv.touched.firstName && fv.getError('firstName') ? (<Text style={styles.fieldError}>{fv.getError('firstName')}</Text>) : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Adresse e-mail</Text>
        <TextInput
          ref={register('email')}
          style={[styles.input, fv.getError('email') && { borderColor: '#dc2626' }]}
          placeholder="nom@exemple.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={fv.values.email}
          onChangeText={(v) => fv.setField('email', v)}
          maxLength={100}
          onFocus={() => scrollIntoView('email')}
          {...fv.getInputProps('email')}
        />
        {fv.touched.email && fv.getError('email') ? (<Text style={styles.fieldError}>{fv.getError('email')}</Text>) : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Numéro de téléphone</Text>
        <TextInput
          ref={register('phone')}
          style={[styles.input, fv.getError('phone') && { borderColor: '#dc2626' }]}
          placeholder="77 123 45 67"
          keyboardType="phone-pad"
          value={formatPhone(fv.values.phone)}
          selection={nextSelectionAtEnd(formatPhone(fv.values.phone))}
          onChangeText={(v) => fv.setField('phone', formatPhone(v))}
          maxLength={12}
          onFocus={() => scrollIntoView('phone')}
          {...fv.getInputProps('phone')}
        />
        {fv.touched.phone && fv.getError('phone') ? (<Text style={styles.fieldError}>{fv.getError('phone')}</Text>) : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text>Mot de passe</Text>
        <TextInput
          ref={register('password')}
          style={[styles.input, fv.getError('password') && { borderColor: '#dc2626' }]}
          placeholder="Entrez votre mot de passe"
          value={fv.values.password}
          onChangeText={(v) => fv.setField('password', v)}
          maxLength={64}
          secureTextEntry
          onFocus={() => scrollIntoView('password')}
          {...fv.getInputProps('password')}
        />
        {fv.touched.password && fv.getError('password') ? (<Text style={styles.fieldError}>{fv.getError('password')}</Text>) : null}
      </View>

      <Text style={styles.sectionTitle}>Informations Professionnelles</Text>

      
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Spécialité</Text>
        <TextInput
          ref={register('specialty')}
          style={[styles.input, fv.getError('specialty') && { borderColor: '#dc2626' }]}
          placeholder="Cardiologue, generaliste,..."
          value={fv.values.specialty}
          onChangeText={(v) => fv.setField('specialty', v)}
          maxLength={60}
          onFocus={() => scrollIntoView('specialty')}
          {...fv.getInputProps('specialty')}
        />
        {fv.touched.specialty && fv.getError('specialty') ? (<Text style={styles.fieldError}>{fv.getError('specialty')}</Text>) : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Numéro d&apos;ordre</Text>
        <TextInput
          ref={register('license')}
          style={[styles.input, fv.getError('licenseNumber') && { borderColor: '#dc2626' }]}
          placeholder="Entrez votre numéro d'ordre"
          value={fv.values.licenseNumber}
          onChangeText={(v) => fv.setField('licenseNumber', v)}
          maxLength={50}
          onFocus={() => scrollIntoView('license')}
          {...fv.getInputProps('licenseNumber')}
        />
        {fv.touched.licenseNumber && fv.getError('licenseNumber') ? (<Text style={styles.fieldError}>{fv.getError('licenseNumber')}</Text>) : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Structure de rattachement</Text>
        <TextInput
          ref={register('hopital')}
          style={[styles.input, fv.getError('hopital') && { borderColor: '#dc2626' }]}
          placeholder="Entrez le nom du structure ou vous etes rattaché"
          value={fv.values.hopital}
          onChangeText={(v) => fv.setField('hopital', v)}
          maxLength={80}
          onFocus={() => scrollIntoView('hopital')}
          {...fv.getInputProps('hopital')}
        />
        {fv.touched.hopital && fv.getError('hopital') ? (<Text style={styles.fieldError}>{fv.getError('hopital')}</Text>) : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Adresse de la structure</Text>
        <TextInput
          ref={register('clinicAddress')}
          style={[styles.input, fv.getError('clinicAddress') && { borderColor: '#dc2626' }]}
          placeholder="Entrez l'adresse de la structure"
          value={fv.values.clinicAddress}
          onChangeText={(v) => fv.setField('clinicAddress', v)}
          maxLength={120}
          onFocus={() => scrollIntoView('clinicAddress')}
          {...fv.getInputProps('clinicAddress')}
        />
        {fv.touched.clinicAddress && fv.getError('clinicAddress') ? (<Text style={styles.fieldError}>{fv.getError('clinicAddress')}</Text>) : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Photo</Text>
        <Text>Telecharger une photo</Text>
        <TouchableOpacity onPress={handleUpload}>
          <Text>Telecharger une photo</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={onSubmit}>
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
  fieldError: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 6,
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
