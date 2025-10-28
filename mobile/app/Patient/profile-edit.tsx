import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import PageContainer from '../../components/PageContainer';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, updateProfile, updatePhoto, type UserProfile } from '../../utils/api';
import Snackbar from '../../components/Snackbar';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export default function PatientProfileEditScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ nom: string; prenom: string; email?: string; adresse?: string; age?: string; telephone?: string }>({ nom: '', prenom: '' });
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'info' });
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
    };
    if (!v.nom || !v.prenom || !v.email || !v.adresse || !v.age || !v.telephone) return 'Tous les champs sont requis.';
    if ([v.nom, v.prenom, v.adresse].some(hasDanger)) return 'Caractères interdits détectés (<, >).';
    if (!isName(v.nom) || !isName(v.prenom)) return 'Nom/Prénom: 2–50 lettres (accents autorisés).';
    if (!isEmail(v.email) || v.email.length > 100) return 'Email invalide.';
    if (!isPhone(v.telephone)) return 'Téléphone invalide (7XXXXXXXX).';
    if (v.adresse.length > 120) return 'Adresse trop longue (max 120).';
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
    const vmsg = validate();
    if (vmsg) { setSnack({ visible: true, message: vmsg, type: 'error' }); return; }
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
    <PageContainer scroll style={styles.container}>
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

      <View style={styles.group}><Text style={styles.label}>Nom</Text><TextInput style={styles.input} value={form.nom} onChangeText={(v) => setForm((f) => ({ ...f, nom: v }))} maxLength={50} /></View>
      <View style={styles.group}><Text style={styles.label}>Prénom</Text><TextInput style={styles.input} value={form.prenom} onChangeText={(v) => setForm((f) => ({ ...f, prenom: v }))} maxLength={50} /></View>
      <View style={styles.group}><Text style={styles.label}>Email</Text><TextInput style={styles.input} value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" maxLength={100} /></View>
      <View style={styles.group}><Text style={styles.label}>Adresse</Text><TextInput style={styles.input} value={form.adresse} onChangeText={(v) => setForm((f) => ({ ...f, adresse: v }))} maxLength={120} /></View>
      <View style={styles.group}><Text style={styles.label}>Âge</Text><TextInput style={styles.input} value={form.age} onChangeText={(v) => setForm((f) => ({ ...f, age: v }))} keyboardType="numeric" maxLength={3} /></View>
      <View style={styles.group}><Text style={styles.label}>Téléphone</Text><TextInput style={styles.input} value={form.telephone} onChangeText={(v) => setForm((f) => ({ ...f, telephone: v }))} keyboardType="phone-pad" maxLength={16} /></View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.primaryBtn, (saving || !!validate()) && { opacity: 0.7 }]} disabled={saving || !!validate()} onPress={onSave}>
        <Text style={styles.primaryBtnText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
      </TouchableOpacity>
      <Snackbar visible={snack.visible} message={snack.message} type={snack.type} onHide={() => setSnack((s) => ({ ...s, visible: false }))} />
    </PageContainer>
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
