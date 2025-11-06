import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getProfile, updateProfile, updatePhoto, type UserProfile } from '../../utils/api';
import { formatPhone, normalizePhone, isPhone, nextSelectionAtEnd } from '../../utils/phone';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useFormValidation } from '../../hooks/useFormValidation';
import { sanitize as s1, hasDanger, isEmailValid, phoneDigits, isPhoneDigitsValid, isName, isAgeValid } from '../../utils/validation';

export default function DoctorProfileEditScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const register = (key: string) => (el: TextInput | null) => { inputRefs.current[key] = el; };
  const scrollIntoView = (key: string) => {
    const input = inputRefs.current[key];
    const sc: any = scrollRef.current as any;
    if (!input || !sc) return;
    requestAnimationFrame(() => {
      const containerNode = sc.getInnerViewNode ? sc.getInnerViewNode() : sc.getScrollableNode?.();
      if (!containerNode || !input.measureLayout) return;
      input.measureLayout(containerNode, (_x: number, y: number) => sc.scrollTo({ y: Math.max(y - 24, 0), animated: true }), () => {});
    });
  };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ nom: string; prenom: string; email?: string; adresse?: string; age?: string; telephone?: string; specialite?: string; hopital?: string }>({ nom: '', prenom: '' });
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);

  const fv = useFormValidation(
    { nom: '', prenom: '', email: '', adresse: '', age: '', telephone: '', specialite: '', hopital: '' },
    {
      nom: (v) => (isName(String(v || '')) ? null : 'Nom invalide (2–50).'),
      prenom: (v) => (isName(String(v || '')) ? null : 'Prénom invalide (2–50).'),
      email: (v) => (isEmailValid(String(v || '')) ? null : 'Email invalide.'),
      adresse: (v) => (!String(v || '').trim() ? 'Adresse requise.' : (String(v || '').length > 120 ? 'Adresse trop longue.' : null)),
      age: (v) => (isAgeValid(String(v || '')) ? null : 'Âge invalide (0–120).'),
      telephone: (v) => (isPhoneDigitsValid(phoneDigits(String(v || ''))) ? null : 'Téléphone invalide (7XXXXXXXX).'),
      specialite: (v) => (String(v || '').length > 60 ? 'Spécialité trop longue.' : null),
      hopital: (v) => (String(v || '').length > 80 ? 'Hôpital trop long.' : null),
    }
  );

  // Validation globale conservée au besoin
  const validate = (): string | null => {
    const v = fv.values;
    if (!String(v.nom).trim() || !String(v.prenom).trim() || !String(v.email).trim() || !String(v.adresse).trim() || !String(v.age).trim() || !String(v.telephone).trim()) return 'Tous les champs requis.';
    if ([v.nom, v.prenom, v.adresse, v.specialite, v.hopital].some((x) => hasDanger(String(x || '')))) return 'Caractères interdits (<, >).';
    return null;
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        const u = data.user as UserProfile;
        const next = {
          nom: u.nom || '',
          prenom: u.prenom || '',
          email: u.email || '',
          adresse: u.adresse || '',
          age: u.age ? String(u.age) : '',
          telephone: u.telephone || '',
          specialite: u.specialite || '',
          hopital: u.hopital || '',
        };
        setForm(next);
        (Object.keys(next) as Array<keyof typeof next>).forEach((k) => {
          // @ts-ignore
          fv.setField(k, next[k]);
        });
        if (u.photo) setPhotoPreview(u.photo);
      } catch (e: any) {
        setError(e?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSave = async () => {
    fv.markAllTouched();
    if (!fv.isValid) { Alert.alert('Validation', 'Veuillez corriger les erreurs.'); return; }
    const v = validate();
    if (v) { Alert.alert('Validation', v); return; }
    try {
      setSaving(true);
      setError(null);
      await updateProfile({
        nom: s1(String(fv.values.nom)),
        prenom: s1(String(fv.values.prenom)),
        email: s1(String(fv.values.email || '')),
        adresse: s1(String(fv.values.adresse || '')),
        age: Number(s1(String(fv.values.age || ''))),
        telephone: normalizePhone(fv.values.telephone || ''),
        specialite: s1(String(fv.values.specialite || '')),
        hopital: s1(String(fv.values.hopital || '')),
      });
      Alert.alert('Succès', 'Profil modifié avec succès.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const onPickAndUploadPhoto = async () => {
    try {
      setUploading(true);
      setError(null);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Permission galerie refusée.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 1 });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) { Alert.alert('Erreur', 'Fichier invalide.'); return; }
      const mime = asset.mimeType || (asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg');
      const format = mime === 'image/png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG;
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512 } }],
        { compress: 0.8, format, base64: true }
      );
      if (!manipulated.base64) { Alert.alert('Erreur', 'Conversion base64 échouée.'); return; }
      const dataUrl = `data:${mime};base64,${manipulated.base64}`;
      await updatePhoto(dataUrl);
      setPhotoPreview(dataUrl);
      Alert.alert('Succès', 'Photo mise à jour.');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })} keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}>
      <ScrollView ref={scrollRef} style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>Modifier le profil</Text>

      <View style={[styles.group, { alignItems: 'center' }]}>
        {photoPreview ? (
          <Image source={{ uri: photoPreview }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: '#10B981' }]} />
        )}
        <TouchableOpacity style={[styles.photoBtn, uploading && { opacity: 0.7 }]} disabled={uploading} onPress={onPickAndUploadPhoto}>
          <Text style={styles.photoBtnText}>{uploading ? 'Envoi…' : 'Changer la photo'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.group}><Text style={styles.label}>Nom</Text><TextInput ref={register('nom')} onFocus={() => scrollIntoView('nom')} style={[styles.input, fv.getError('nom') && { borderColor: '#dc2626' }]} value={fv.values.nom} onChangeText={(v) => fv.setField('nom', v)} maxLength={50} {...fv.getInputProps('nom')} /></View>
      <View style={styles.group}><Text style={styles.label}>Prénom</Text><TextInput ref={register('prenom')} onFocus={() => scrollIntoView('prenom')} style={[styles.input, fv.getError('prenom') && { borderColor: '#dc2626' }]} value={fv.values.prenom} onChangeText={(v) => fv.setField('prenom', v)} maxLength={50} {...fv.getInputProps('prenom')} /></View>
      <View style={styles.group}><Text style={styles.label}>Email</Text><TextInput ref={register('email')} onFocus={() => scrollIntoView('email')} style={[styles.input, fv.getError('email') && { borderColor: '#dc2626' }]} value={fv.values.email} onChangeText={(v) => fv.setField('email', v)} keyboardType="email-address" autoCapitalize="none" maxLength={100} {...fv.getInputProps('email')} /></View>
      <View style={styles.group}><Text style={styles.label}>Adresse</Text><TextInput ref={register('adresse')} onFocus={() => scrollIntoView('adresse')} style={[styles.input, fv.getError('adresse') && { borderColor: '#dc2626' }]} value={fv.values.adresse} onChangeText={(v) => fv.setField('adresse', v)} maxLength={120} {...fv.getInputProps('adresse')} /></View>
      <View style={styles.group}><Text style={styles.label}>Âge</Text><TextInput ref={register('age')} onFocus={() => scrollIntoView('age')} style={[styles.input, fv.getError('age') && { borderColor: '#dc2626' }]} value={fv.values.age} onChangeText={(v) => fv.setField('age', v)} keyboardType="numeric" maxLength={3} {...fv.getInputProps('age')} /></View>
      <View style={styles.group}><Text style={styles.label}>Téléphone</Text><TextInput ref={register('telephone')} onFocus={() => scrollIntoView('telephone')} style={[styles.input, fv.getError('telephone') && { borderColor: '#dc2626' }]} value={formatPhone(fv.values.telephone || '')} selection={nextSelectionAtEnd(formatPhone(fv.values.telephone || ''))} onChangeText={(v) => fv.setField('telephone', formatPhone(v))} keyboardType="phone-pad" maxLength={12} placeholder="7X XXX XX XX" {...fv.getInputProps('telephone')} /></View>
      <View style={styles.group}><Text style={styles.label}>Spécialité</Text><TextInput ref={register('specialite')} onFocus={() => scrollIntoView('specialite')} style={[styles.input, fv.getError('specialite') && { borderColor: '#dc2626' }]} value={fv.values.specialite} onChangeText={(v) => fv.setField('specialite', v)} maxLength={60} {...fv.getInputProps('specialite')} /></View>
      <View style={styles.group}><Text style={styles.label}>Hôpital</Text><TextInput ref={register('hopital')} onFocus={() => scrollIntoView('hopital')} style={[styles.input, fv.getError('hopital') && { borderColor: '#dc2626' }]} value={fv.values.hopital} onChangeText={(v) => fv.setField('hopital', v)} maxLength={80} {...fv.getInputProps('hopital')} /></View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={onSave}>
        <Text style={styles.primaryBtnText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, color: '#111827', marginBottom: 40, marginTop: 32 },
  group: { marginBottom: 12 },
  label: { fontSize: 13, color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  primaryBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  error: { color: '#DC2626', marginTop: 8 },
  avatar: { width: 96, height: 96, borderRadius: 999, marginBottom: 8 },
  photoBtn: { backgroundColor: '#2ccdd2', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  photoBtnText: { color: '#fff', fontSize: 14 },
});
