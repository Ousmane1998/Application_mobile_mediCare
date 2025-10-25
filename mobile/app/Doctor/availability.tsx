import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, getAvailabilityByMedecin, setAvailability, updateAvailability, deleteAvailabilityApi, type UserProfile } from '../../utils/api';
import RNPickerSelect from 'react-native-picker-select';

export default function DoctorAvailabilityScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<Array<{ _id?: string; jour: string; heureDebut: string; heureFin: string; disponible?: boolean }>>([]);

  const [jour, setJour] = useState<string>('Lundi');
  const [heureDebut, setHeureDebut] = useState<string>('09:00');
  const [heureFin, setHeureFin] = useState<string>('17:00');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setError(null);
      const prof = await getProfile();
      setMe(prof.user);
      const list = await getAvailabilityByMedecin(prof.user._id || (prof.user as any).id);
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onAdd = async () => {
    if (!me) return;
    if (!jour || !heureDebut || !heureFin) {
      Alert.alert('Validation', 'Veuillez renseigner jour, heure début et heure fin.');
      return;
    }
    try {
      setSaving(true);
      await setAvailability({ medecinId: (me._id || (me as any).id) as string, jour, heureDebut, heureFin, disponible: true });
      setJour('Lundi'); setHeureDebut('09:00'); setHeureFin('17:00');
      await load();
      Alert.alert('Succès', 'Disponibilité enregistrée.');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || "Impossible d'enregistrer");
    } finally {
      setSaving(false);
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Mes disponibilités</Text>

      <View style={styles.formRow}>
        <RNPickerSelect
          onValueChange={(v) => setJour(String(v || ''))}
          value={jour}
          placeholder={{ label: 'Choisir un jour', value: null }}
          items={[
            { label: 'Lundi', value: 'Lundi' },
            { label: 'Mardi', value: 'Mardi' },
            { label: 'Mercredi', value: 'Mercredi' },
            { label: 'Jeudi', value: 'Jeudi' },
            { label: 'Vendredi', value: 'Vendredi' },
            { label: 'Samedi', value: 'Samedi' },
            { label: 'Dimanche', value: 'Dimanche' },
          ]}
          useNativeAndroidPickerStyle={false}
          style={pickerSelectStyles}
        />
      </View>
      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <RNPickerSelect
            onValueChange={(v) => setHeureDebut(String(v || ''))}
            value={heureDebut}
            placeholder={{ label: 'Début (HH:MM)', value: null }}
            items={timeOptions}
            useNativeAndroidPickerStyle={false}
            style={pickerSelectStyles}
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <RNPickerSelect
            onValueChange={(v) => setHeureFin(String(v || ''))}
            value={heureFin}
            placeholder={{ label: 'Fin (HH:MM)', value: null }}
            items={timeOptions}
            useNativeAndroidPickerStyle={false}
            style={pickerSelectStyles}
          />
        </View>
      </View>

      <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={onAdd}>
        <Text style={styles.primaryBtnText}>{saving ? 'Enregistrement…' : 'Ajouter un créneau'}</Text>
      </TouchableOpacity>

      <View style={{ height: 16 }} />

      {items.map((a, idx) => (
        <View key={(a._id || idx).toString()} style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.badge}><Ionicons name="time-outline" size={16} color="#065F46" /></View>
              <View>
                <Text style={styles.name}>{a.jour}</Text>
                <Text style={styles.sub}>{a.heureDebut} - {a.heureFin}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={async () => {
                try {
                  await updateAvailability(String(a._id), { disponible: a.disponible === false ? true : false });
                  await load();
                } catch (e: any) {
                  Alert.alert('Erreur', e?.message || 'Mise à jour impossible');
                }
              }}>
                <Text style={[styles.action, { color: a.disponible === false ? '#059669' : '#DC2626' }]}>{a.disponible === false ? 'Activer' : 'Désactiver'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                Alert.alert('Confirmation', 'Supprimer ce créneau ?', [
                  { text: 'Annuler' },
                  { text: 'Supprimer', style: 'destructive', onPress: async () => {
                    try { await deleteAvailabilityApi(String(a._id)); await load(); } catch (e: any) { Alert.alert('Erreur', e?.message || 'Suppression impossible'); }
                  }}
                ]);
              }}>
                <Text style={[styles.action, { color: '#EF4444' }]}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.status, { color: a.disponible === false ? '#DC2626' : '#059669', marginTop: 8 }]}>{a.disponible === false ? 'Indisponible' : 'Disponible'}</Text>
        </View>
      ))}

      {error ? <Text style={{ color: '#DC2626', marginTop: 8 }}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 18, color: '#111827', marginBottom: 12 },
  formRow: { marginBottom: 10 },
  row2: { flexDirection: 'row', alignItems: 'center' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  primaryBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D1FAE5' },
  name: { fontSize: 16, color: '#111827' },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  status: { fontWeight: '600' },
  action: { fontWeight: '600' },
});

const timeOptions = Array.from({ length: ((20 - 8) * 60) / 30 + 1 }, (_, i) => {
  const minutes = 8 * 60 + i * 30;
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  const label = `${h}:${m}`;
  return { label, value: label } as const;
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
