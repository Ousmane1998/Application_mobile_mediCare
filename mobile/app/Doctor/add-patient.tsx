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
  const [age, setAge] = useState('');
  const [adresse, setAdresse] = useState('');

  const [pathologie, setPathologie] = useState('Diabète');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const onSave = async () => {
    setError(null);
    setInfo(null);
    if (!nom || !prenom || !email || !telephone) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    const phoneRegex = /^7\d{8}$/;
    if (!emailRegex.test(email)) { setError('Email invalide.'); return; }
    if (!phoneRegex.test(telephone)) { setError('Téléphone invalide (7XXXXXXXX).'); return; }

  try {
  setLoading(true);
  const res = await createPatient({
    nom,
    prenom,
    email,
    telephone,
    age,
    pathologie,
    adresse,
  });

  console.log("✅ Réponse complète du backend :", res);
  setInfo('Patient créé avec succès.');
  setTimeout(() => router.back(), 700);
} catch (e: any) {
  console.log("🔥 Erreur complète reçue :", e);
  if (e?.debug) {
    console.log("🧠 Détails backend :", e.debug);
    alert(`Erreur serveur: ${e.debug.message}\n\n${e.debug.stack?.slice(0, 200)}...`);
  }
  setError(e?.message || "Erreur lors de l'enregistrement.");
}
finally {
  setLoading(false);
}

  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ajouter un nouveau patient</Text>

      <View style={styles.group}>
        <Text style={styles.label}>Nom</Text>
        <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Entrez le nom de famille" />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Prénom</Text>
        <TextInput style={styles.input} value={prenom} onChangeText={setPrenom} placeholder="Entrez le prénom" />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Adresse e-mail</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="example@email.com" autoCapitalize="none" />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Numéro de téléphone</Text>
        <TextInput style={styles.input} value={telephone} onChangeText={setTelephone} placeholder="7XXXXXXXX" keyboardType="number-pad" />
      </View>
      <View style={styles.group}>
  <Text style={styles.label}>Adresse</Text>
  <TextInput
    style={styles.input}
    value={adresse}
    onChangeText={setAdresse}
    placeholder="Adresse du patient"
  />
</View>


      <View style={styles.group}>
        <Text style={styles.label}>Age</Text>
        <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="Entrez l'âge" keyboardType="number-pad" />
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
  container: { padding: 16, backgroundColor: '#fff', minHeight: '100%' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 12 },
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
