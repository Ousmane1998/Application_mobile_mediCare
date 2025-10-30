import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getProfile, updateProfile, updatePhoto, type UserProfile } from '../../utils/api';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

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

  // Validation helpers
  const sanitize = (s: string) => (s || '').replace(/[\t\n\r]+/g, ' ').trim();
  const hasDanger = (s: string) => /[<>]/.test(s || '');
  const isName = (s: string) => /^[A-Za-zÀ-ÖØ-öø-ÿ'\-\s]{2,50}$/.test(s || '');
  const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s || '');
  const normalizePhone = (s: string) => (s || '').replace(/\D+/g, '');
  const isPhone = (digits: string) => /^7\d{8}$/.test(digits || '');
  const isAge = (s: string) => /^\d{1,3}$/.test(s || '') && Number(s) >= 0 && Number(s) <= 120;

  const validate = (): string | null => {
    const v = {
      nom: sanitize(form.nom),
      prenom: sanitize(form.prenom),
      email: sanitize(form.email || ''),
      adresse: sanitize(form.adresse || ''),
      age: sanitize(form.age || ''),
      telephone: normalizePhone(form.telephone || ''),
      specialite: sanitize(form.specialite || ''),
      hopital: sanitize(form.hopital || ''),
    };
    if (!v.nom || !v.prenom || !v.email || !v.adresse || !v.age || !v.telephone) return 'Tous les champs requis.';
    if ([v.nom, v.prenom, v.adresse, v.specialite, v.hopital].some(hasDanger)) return 'Caractères interdits (<, >).';
    if (!isName(v.nom) || !isName(v.prenom)) return 'Nom/Prénom: 2–50 lettres.';
    if (!isEmail(v.email) || v.email.length > 100) return 'Email invalide.';
    if (!isPhone(v.telephone)) return 'Téléphone invalide (7XXXXXXXX).';
    if (v.adresse.length > 120 || v.specialite.length > 60 || v.hopital.length > 80) return 'Texte trop long.';
    if (!isAge(v.age)) return 'Âge invalide (0–120).';
    return null;
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        const u = data.user as UserProfile;
        setForm({
          nom: u.nom || '',
          prenom: u.prenom || '',
          email: u.email || '',
          adresse: u.adresse || '',
          age: u.age ? String(u.age) : '',
          telephone: u.telephone || '',
          specialite: u.specialite || '',
          hopital: u.hopital || '',
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
    const v = validate();
    if (v) { Alert.alert('Validation', v); return; }
    try {
      setSaving(true);
      setError(null);
      await updateProfile({
        nom: sanitize(form.nom),
        prenom: sanitize(form.prenom),
        email: sanitize(form.email || ''),
        adresse: sanitize(form.adresse || ''),
        age: Number(sanitize(form.age || '')),
        telephone: normalizePhone(form.telephone || ''),
        specialite: sanitize(form.specialite || ''),
        hopital: sanitize(form.hopital || ''),
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

      <View style={styles.group}><Text style={styles.label}>Nom</Text><TextInput ref={register('nom')} onFocus={() => scrollIntoView('nom')} style={styles.input} value={form.nom} onChangeText={(v) => setForm((f) => ({ ...f, nom: v }))} maxLength={50} /></View>
      <View style={styles.group}><Text style={styles.label}>Prénom</Text><TextInput ref={register('prenom')} onFocus={() => scrollIntoView('prenom')} style={styles.input} value={form.prenom} onChangeText={(v) => setForm((f) => ({ ...f, prenom: v }))} maxLength={50} /></View>
      <View style={styles.group}><Text style={styles.label}>Email</Text><TextInput ref={register('email')} onFocus={() => scrollIntoView('email')} style={styles.input} value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" maxLength={100} /></View>
      <View style={styles.group}><Text style={styles.label}>Adresse</Text><TextInput ref={register('adresse')} onFocus={() => scrollIntoView('adresse')} style={styles.input} value={form.adresse} onChangeText={(v) => setForm((f) => ({ ...f, adresse: v }))} maxLength={120} /></View>
      <View style={styles.group}><Text style={styles.label}>Âge</Text><TextInput ref={register('age')} onFocus={() => scrollIntoView('age')} style={styles.input} value={form.age} onChangeText={(v) => setForm((f) => ({ ...f, age: v }))} keyboardType="numeric" maxLength={3} /></View>
      <View style={styles.group}><Text style={styles.label}>Téléphone</Text><TextInput ref={register('telephone')} onFocus={() => scrollIntoView('telephone')} style={styles.input} value={form.telephone} onChangeText={(v) => setForm((f) => ({ ...f, telephone: v }))} keyboardType="phone-pad" maxLength={16} /></View>
      <View style={styles.group}><Text style={styles.label}>Spécialité</Text><TextInput ref={register('specialite')} onFocus={() => scrollIntoView('specialite')} style={styles.input} value={form.specialite} onChangeText={(v) => setForm((f) => ({ ...f, specialite: v }))} maxLength={60} /></View>
      <View style={styles.group}><Text style={styles.label}>Hôpital</Text><TextInput ref={register('hopital')} onFocus={() => scrollIntoView('hopital')} style={styles.input} value={form.hopital} onChangeText={(v) => setForm((f) => ({ ...f, hopital: v }))} maxLength={80} /></View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.primaryBtn, (saving || !!validate()) && { opacity: 0.7 }]} disabled={saving || !!validate()} onPress={onSave}>
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
