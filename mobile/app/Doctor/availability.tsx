import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import PageContainer from '../../components/PageContainer';
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

    // Vérifier que l'heure de fin est supérieure à l'heure de début
    const [heureDebutH] = heureDebut.split(':').map(Number);
    const [heureFinH] = heureFin.split(':').map(Number);

    if (heureFinH <= heureDebutH) {
      Alert.alert('Validation', 'L\'heure de fin doit être supérieure à l\'heure de début.');
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
    <PageContainer scroll style={styles.container} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Mes disponibilités</Text>

      {/* Form Card */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Ajouter une disponibilité</Text>

        {/* Jour */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Jour de la semaine</Text>
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
            Icon={() => <Ionicons name="chevron-down" size={20} color="#6B7280" />}
          />
        </View>

        {/* Heures */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Horaires</Text>
          <View style={styles.hoursRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hoursLabel}>Début</Text>
              <RNPickerSelect
                onValueChange={(v) => setHeureDebut(String(v || ''))}
                value={heureDebut}
                placeholder={{ label: 'Début', value: null }}
                items={timeOptions}
                useNativeAndroidPickerStyle={false}
                style={pickerSelectStyles}
                Icon={() => <Ionicons name="chevron-down" size={18} color="#6B7280" />}
              />
            </View>
            <View style={styles.hoursArrow}>
              <Ionicons name="arrow-forward" size={20} color="#6B7280" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hoursLabel}>Fin</Text>
              <RNPickerSelect
                onValueChange={(v) => setHeureFin(String(v || ''))}
                value={heureFin}
                placeholder={{ label: 'Fin', value: null }}
                items={timeOptions}
                useNativeAndroidPickerStyle={false}
                style={pickerSelectStyles}
                Icon={() => <Ionicons name="chevron-down" size={18} color="#6B7280" />}
              />
            </View>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Ionicons name="time-outline" size={18} color="#2ccdd2" />
          <Text style={styles.summaryText}>{jour} de {heureDebut} à {heureFin}</Text>
        </View>

        <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={onAdd}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.primaryBtnText}>{saving ? 'Enregistrement…' : 'Ajouter un créneau'}</Text>
        </TouchableOpacity>
      </View>

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
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 18, color: '#111827', marginBottom: 16 },
  
  // Form Card
  formCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  formTitle: { fontSize: 16, color: '#111827', marginBottom: 16 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, color: '#374151', marginBottom: 8 },
  
  // Hours
  hoursRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  hoursLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  hoursArrow: { paddingBottom: 12, alignItems: 'center', justifyContent: 'center' },
  
  // Summary
  summary: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#E0F7F6', borderRadius: 8, marginBottom: 16, gap: 10 },
  summaryText: { fontSize: 14, color: '#0f766e' },
  
  // Old styles
  formRow: { marginBottom: 10 },
  row2: { flexDirection: 'row', alignItems: 'center' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  primaryBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D1FAE5' },
  name: { fontSize: 16, color: '#111827' },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  status: {},
  action: {},
});

// Heures de 09h à 17h par heure complète
const timeOptions = Array.from({ length: 17 - 9 + 1 }, (_, i) => {
  const hour = 9 + i;
  const label = `${hour.toString().padStart(2, '0')}:00`;
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
    paddingRight: 30,
    color: '#111827',
    fontSize: 14,
  },
  inputAndroid: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingRight: 30,
    color: '#111827',
    fontSize: 14,
  },
  placeholder: {
    color: '#9CA3AF',
  },
  iconContainer: {
    top: 13,
    right: 12,
  },
} as const;
