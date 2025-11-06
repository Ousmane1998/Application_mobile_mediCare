import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useRouter } from 'expo-router';
import { createPatient } from '../../utils/api';
import { formatPhone, normalizePhone, isPhone, nextSelectionAtEnd } from '../../utils/phone';
import { useFormValidation } from '../../hooks/useFormValidation';
import { sanitize, hasDanger, isEmailValid, isName, isStrongPassword, isAgeValid, phoneDigits, isPhoneDigitsValid } from '../../utils/validation';

export default function DoctorAddPatientScreen() {
  const router = useRouter();
  const fv = useFormValidation(
    { nom: '', prenom: '', email: '', telephone: '', password: '', age: '', adresse: '' },
    {
      nom: (v) => (isName(String(v || '')) ? null : 'Nom invalide (2–50).'),
      prenom: (v) => (isName(String(v || '')) ? null : 'Prénom invalide (2–50).'),
      email: (v) => (isEmailValid(String(v || '')) ? null : 'Email invalide.'),
      telephone: (v) => (isPhoneDigitsValid(phoneDigits(String(v || ''))) ? null : 'Téléphone invalide (7XXXXXXXX).'),
      password: (v) => (!String(v || '') ? null : (isStrongPassword(String(v || '')) ? null : 'Mot de passe faible: 8–64, 1 lettre et 1 chiffre.')),
      age: (v) => (!String(v || '') ? null : (isAgeValid(String(v || '')) ? null : 'Âge invalide (0–120).')),
      adresse: (v) => (String(v || '').length > 120 ? 'Adresse trop longue (max 120).' : null),
    }
  );
  const [telephone, setTelephone] = useState('');
  const [idMedecin, setIdMedecin] = useState('');

  const [pathologie, setPathologie] = useState('Diabète');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const validate = () => {
    const vals = fv.values;
    if (![vals.nom, vals.prenom, vals.email, telephone].every((x) => String(x || '').trim())) return 'Veuillez remplir tous les champs obligatoires.';
    if ([vals.nom, vals.prenom, vals.adresse].some((x) => hasDanger(String(x || '')))) return 'Caractères interdits détectés (<, >).';
    return null;
  };
  const onSave = async () => {
    setError(null);
    setInfo(null);
    fv.markAllTouched();
    if (!fv.isValid) { setError('Veuillez corriger les erreurs.'); return; }
    const v = validate();
    if (v) { setError(v); return; }
    try {
      setLoading(true);
      const res = await createPatient({
        nom: sanitize(String(fv.values.nom)),
        prenom: sanitize(String(fv.values.prenom)),
        email: sanitize(String(fv.values.email)),
        telephone: normalizePhone(telephone),
        age: sanitize(String(fv.values.age)),
        pathologie,
        adresse: sanitize(String(fv.values.adresse)),
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
        <TextInput style={[styles.input, fv.getError('nom') && { borderColor: '#dc2626' }]} value={fv.values.nom} onChangeText={(v) => fv.setField('nom', v)} placeholder="Entrez le nom de famille" maxLength={50} {...fv.getInputProps('nom')} />
        {fv.touched.nom && fv.getError('nom') ? (<Text style={styles.fieldError}>{fv.getError('nom')}</Text>) : null}
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Prénom</Text>
        <TextInput style={[styles.input, fv.getError('prenom') && { borderColor: '#dc2626' }]} value={fv.values.prenom} onChangeText={(v) => fv.setField('prenom', v)} placeholder="Entrez le prénom" maxLength={50} {...fv.getInputProps('prenom')} />
        {fv.touched.prenom && fv.getError('prenom') ? (<Text style={styles.fieldError}>{fv.getError('prenom')}</Text>) : null}
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Adresse e-mail</Text>
        <TextInput style={[styles.input, fv.getError('email') && { borderColor: '#dc2626' }]} value={fv.values.email} onChangeText={(v) => fv.setField('email', v)} placeholder="example@email.com" autoCapitalize="none" maxLength={100} {...fv.getInputProps('email')} />
        {fv.touched.email && fv.getError('email') ? (<Text style={styles.fieldError}>{fv.getError('email')}</Text>) : null}
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Numéro de téléphone</Text>
        <TextInput
          style={styles.input}
          value={formatPhone(telephone)}
          selection={nextSelectionAtEnd(formatPhone(telephone))}
          onChangeText={(v) => setTelephone(formatPhone(v))}
          placeholder="7X XXX XX XX"
          keyboardType="phone-pad"
          maxLength={12}
        />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Adresse</Text>
        <TextInput
          style={[styles.input, fv.getError('adresse') && { borderColor: '#dc2626' }]}
          value={fv.values.adresse}
          onChangeText={(v) => fv.setField('adresse', v)}
          placeholder="Adresse du patient"
          maxLength={120}
          {...fv.getInputProps('adresse')}
        />
        {fv.touched.adresse && fv.getError('adresse') ? (<Text style={styles.fieldError}>{fv.getError('adresse')}</Text>) : null}
      </View>


      <View style={styles.group}>
        <Text style={styles.label}>Age</Text>
        <TextInput style={[styles.input, fv.getError('age') && { borderColor: '#dc2626' }]} value={fv.values.age} onChangeText={(v) => fv.setField('age', v)} placeholder="Entrez l'âge" keyboardType="number-pad" maxLength={3} {...fv.getInputProps('age')} />
        {fv.touched.age && fv.getError('age') ? (<Text style={styles.fieldError}>{fv.getError('age')}</Text>) : null}
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

      <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.7 }]} disabled={loading} onPress={onSave}>
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
  fieldError: { color: '#dc2626', fontSize: 12, marginTop: 6 },
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
