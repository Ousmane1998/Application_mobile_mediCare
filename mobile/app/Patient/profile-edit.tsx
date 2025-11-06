import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, updateProfile, updatePhoto, type UserProfile } from '../../utils/api';
import { formatPhone, normalizePhone, isPhone, nextSelectionAtEnd } from '../../utils/phone';
import Snackbar from '../../components/Snackbar';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useFormValidation } from '../../hooks/useFormValidation';
import { sanitize as s1, hasDanger, isEmailValid, phoneDigits, isPhoneDigitsValid, isName, isAgeValid } from '../../utils/validation';

export default function PatientProfileEditScreen() {
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
  const [form, setForm] = useState<{ nom: string; prenom: string; email?: string; adresse?: string; age?: string; telephone?: string }>({ nom: '', prenom: '' });
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'info' });
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);

  const fv = useFormValidation(
    { nom: '', prenom: '', email: '', adresse: '', age: '', telephone: '' },
    {
      nom: (v) => (isName(String(v || '')) ? null : 'Nom invalide (2–50).'),
      prenom: (v) => (isName(String(v || '')) ? null : 'Prénom invalide (2–50).'),
      email: (v) => (isEmailValid(String(v || '')) ? null : 'Email invalide.'),
      adresse: (v) => (!String(v || '').trim() ? 'Adresse requise.' : (String(v || '').length > 120 ? 'Adresse trop longue.' : null)),
      age: (v) => (isAgeValid(String(v || '')) ? null : 'Âge invalide (0–120).'),
      telephone: (v) => (isPhoneDigitsValid(phoneDigits(String(v || ''))) ? null : 'Téléphone invalide (7XXXXXXXX).'),
    }
  );

  // Validation globale conservée si besoin
  const validate = (): string | null => {
    const v = fv.values;
    if (!String(v.nom).trim() || !String(v.prenom).trim() || !String(v.email).trim() || !String(v.adresse).trim() || !String(v.age).trim() || !String(v.telephone).trim()) return 'Tous les champs sont requis.';
    if ([v.nom, v.prenom, v.adresse].some((x) => hasDanger(String(x || '')))) return 'Caractères interdits détectés (<, >).';
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
    if (!fv.isValid) { setSnack({ visible: true, message: 'Veuillez corriger les erreurs.', type: 'error' }); return; }
    const vmsg = validate();
    if (vmsg) { setSnack({ visible: true, message: vmsg, type: 'error' }); return; }
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
      });
      setSnack({ visible: true, message: 'Profil modifié avec succès.', type: 'success' });
      setTimeout(() => router.back(), 800);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la sauvegarde');
      setSnack({ visible: true, message: e?.message || 'Erreur lors de la sauvegarde', type: 'error' });
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
        setSnack({ visible: true, message: "Permission galerie refusée.", type: 'error' });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 1 });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) { setSnack({ visible: true, message: "Fichier invalide.", type: 'error' }); return; }

      // Déterminer le format en fonction du MIME/extension
      const mime = asset.mimeType || (asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg');
      const format = mime === 'image/png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG;

      // Redimensionner max 512px, compresser
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512 } }],
        { compress: 0.8, format, base64: true }
      );
      if (!manipulated.base64) { setSnack({ visible: true, message: "Conversion base64 échouée.", type: 'error' }); return; }
      const dataUrl = `data:${mime};base64,${manipulated.base64}`;
      await updatePhoto(dataUrl);
      setPhotoPreview(dataUrl);
      setSnack({ visible: true, message: 'Photo mise à jour.', type: 'success' });
    } catch (e: any) {
      setSnack({ visible: true, message: e?.message || "Erreur lors de l'upload", type: 'error' });
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Modifier le profil</Text>
      </View>

      <View style={[styles.group, { alignItems: 'center' }]}>
        {photoPreview ? (
          <Image source={{ uri: photoPreview }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }]} />
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

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={onSave}>
        <Text style={styles.primaryBtnText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
      </TouchableOpacity>
      <Snackbar visible={snack.visible} message={snack.message} type={snack.type} onHide={() => setSnack((s) => ({ ...s, visible: false }))} />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1,padding: 16 },
  title: { fontSize: 18, color: '#111827', marginBottom: 12 },
  group: { marginBottom: 12 },
  label: { fontSize: 13, color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  primaryBtn: { backgroundColor: '#2ccdd2', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  error: { color: '#DC2626', marginTop: 8 },
  avatar: { width: 96, height: 96, borderRadius: 999, marginBottom: 8 },
  photoBtn: { backgroundColor: '#2ccdd2', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  photoBtnText: { color: '#fff', fontSize: 14 },
});
