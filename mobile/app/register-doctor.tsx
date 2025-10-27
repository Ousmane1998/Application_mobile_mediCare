// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import PageContainer from '../components/PageContainer';
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

  const onSubmit = () => {
    // TODO: envoyer au backend
    router.replace('/login');
  };

  return (
    <PageContainer scroll style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerBar}>
        <Text style={styles.back} onPress={() => router.back()}>←</Text>
        <Text style={styles.headerTitle}>Inscription Médecin</Text>
        <View style={{ width: 20 }} />
      </View>

      <Text style={styles.sectionTitle}>Informations Personnelles</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nom</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez votre nom"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Prénom</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez votre prénom"
          value={firstName}
          onChangeText={setFirstName}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Adresse e-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="nom@exemple.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Numéro de téléphone</Text>
        <TextInput
          style={styles.input}
          placeholder="77 123 45 67"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Spécialité</Text>
        <TextInput
          style={styles.input}
          placeholder="Cardiologue, generaliste,..."
          value={specialty}
          onChangeText={setSpecialty}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text>Mot de passe</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez votre mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <Text style={styles.sectionTitle}>Informations Professionnelles</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Numéro d&apos;agrément</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez votre numéro d'agrément"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nom de l&apos;hôpital ou du cabinet</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez le nom de l'hôpital ou du cabinet ou vous etes rattaché"
          value={hopital}
          onChangeText={setHopital}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Adresse de l&apos;hôpital ou du cabinet</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez votre adresse"
          value={clinicAddress}
          onChangeText={setClinicAddress}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Photo</Text>
        <Text>Telecharger une photo</Text>
        <TouchableOpacity onPress={handleUpload}>
          <Text>Telecharger une photo</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit}>
        <Text style={styles.primaryBtnText}>S&apos;inscrire</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Déjà un compte ? </Text>
        <Text style={styles.link} onPress={() => router.replace('/login')}>Connectez-vous</Text>
      </View>

      <Text style={styles.terms}>
        En vous inscrivant, vous acceptez notre Politique de confidentialité et nos Conditions d&apos;utilisation.
      </Text>
    </PageContainer>
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
