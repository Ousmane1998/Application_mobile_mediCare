import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useRouter } from 'expo-router';
import { createPatient } from '../../utils/api';

export default function DoctorAddPatientScreen() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [adresse, setAdresse] = useState('');
  const [idMedecin, setIdMedecin] = useState('');

  const [pathologie, setPathologie] = useState('Diabète');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const sanitize = (s: string) => (s || '').replace(/[\t\n\r]+/g, ' ').trim();
  const hasDanger = (s: string) => /[<>]/.test(s || '');
  const isName = (s: string) => /^[A-Za-zÀ-ÖØ-öø-ÿ'\-\s]{2,50}$/.test(s || '');
  const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s || '');
  const normalizePhone = (s: string) => (s || '').replace(/\D+/g, '');
  const isPhone = (digits: string) => /^7\d{8}$/.test(digits || '');
  const strongPwd = (s: string) => /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(s || '');
  const isAge = (s: string) => /^\d{1,3}$/.test(s || '') && Number(s) >= 0 && Number(s) <= 120;

  const validate = () => {
    const vNom = sanitize(nom);
    const vPrenom = sanitize(prenom);
    const vEmail = sanitize(email);
    const vTelDigits = normalizePhone(telephone);
    const vAdresse = sanitize(adresse);
    const vPwd = password;
    const vAge = sanitize(age);

    if ([vNom, vPrenom, vEmail, vTelDigits].some(v => !v)) return 'Veuillez remplir tous les champs obligatoires.';
    if ([vNom, vPrenom, vAdresse].some(hasDanger)) return 'Caractères interdits détectés (<, >).';
    if (!isName(vNom) || !isName(vPrenom)) return 'Nom et prénom: 2–50 lettres (accents autorisés).';
    if (!isEmail(vEmail)) return 'Email invalide.';
    if (!isPhone(vTelDigits)) return 'Téléphone invalide (format 7XXXXXXXX).';
    if (vAdresse.length > 120) return 'Adresse trop longue (max 120).';
    if (vAge && !isAge(vAge)) return "Âge invalide (0–120).";
    if (vPwd && !strongPwd(vPwd)) return 'Mot de passe faible: 8–64 caractères, au moins une lettre et un chiffre.';
    return null;
  };
  const onSave = async () => {
    setError(null);
    setInfo(null);
    const v = validate();
    if (v) { setError(v); return; }
    try {
      setLoading(true);
      const res = await createPatient({
        nom: sanitize(nom),
        prenom: sanitize(prenom),
        email: sanitize(email),
        telephone: normalizePhone(telephone),
        age: sanitize(age),
        pathologie,
        adresse: sanitize(adresse),
        idMedecin,
      });

      console.log("✅ Réponse complète du backend :", res);
      setInfo('Patient créé avec succès.');
      setTimeout(() => router.back(), 700);
    } catch (e: any) {
      console.log("Erreur complète reçue :", e);
      if (e?.debug) {
        console.log("Détails backend :", e.debug);
        alert(`Erreur serveur: ${e.debug.message}\n\n${e.debug.stack?.slice(0, 200)}...`);
      }
      setError(e?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }

  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ajouter un nouveau patient</Text>

      <View style={styles.group}>
        <Text style={styles.label}>Nom</Text>
        <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Entrez le nom de famille" maxLength={50} />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Prénom</Text>
        <TextInput style={styles.input} value={prenom} onChangeText={setPrenom} placeholder="Entrez le prénom" maxLength={50} />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Adresse e-mail</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="example@email.com" autoCapitalize="none" maxLength={100} />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Numéro de téléphone</Text>
        <TextInput style={styles.input} value={telephone} onChangeText={setTelephone} placeholder="7XXXXXXXX" keyboardType="number-pad" maxLength={16} />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Adresse</Text>
        <TextInput
          style={styles.input}
          value={adresse}
          onChangeText={setAdresse}
          placeholder="Adresse du patient"
          maxLength={120}
        />
      </View>


      <View style={styles.group}>
        <Text style={styles.label}>Age</Text>
        <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="Entrez l'âge" keyboardType="number-pad" maxLength={3} />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Pathologie principale</Text>
        <RNPickerSelect
          onValueChange={(value) => setPathologie(value)}
          items={[
            { label: 'Diabète', value: 'Diabète' },
            { label: 'Hypertension artérielle', value: 'Hypertension artérielle' },
          ]}
          placeholder={{ label: 'Choisir une pathologie...', value: null }}
          value={pathologie}
          style={pickerSelectStyles}
          useNativeAndroidPickerStyle={false}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      <TouchableOpacity style={[styles.primaryBtn, (loading || !!validate()) && { opacity: 0.7 }]} disabled={loading || !!validate()} onPress={onSave}>
        <Text style={styles.primaryBtnText}>{loading ? 'Enregistrement…' : 'Enregistrer le patient'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', minHeight: '100%', marginBottom: 40, marginTop: 32 },
  title: { fontSize: 20, color: '#111827', marginBottom: 12 },
  group: { marginBottom: 12 },
  label: { fontSize: 13, color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12 },
  primaryBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  error: { color: '#DC2626', marginTop: 8 },
  info: { color: '#065F46', marginTop: 8 },
});

const pickerSelectStyles = {
  inputIOS: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111827',
  },
  inputAndroid: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111827',
  },
  placeholder: {
    color: '#9CA3AF',
  },
} as const;
