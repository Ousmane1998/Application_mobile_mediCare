import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import PageContainer from '../../components/PageContainer';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listHealthRecords, updateHealthRecord, type HealthRecord } from '../../utils/api';

export default function DoctorPatientHealthRecordScreen() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rec, setRec] = useState<HealthRecord | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    groupeSanguin?: string;
    maladies?: string;
    traitements?: string;
    allergies?: string;
    antecedents?: string;
  }>({});

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const list = await listHealthRecords();
        const found = (Array.isArray(list) ? list : []).find((f: any) => String((f.patient?._id)||f.patient) === String(patientId));
        setRec(found || null);
        if (found) {
          setForm({
            groupeSanguin: found.groupeSanguin || '',
            maladies: (found.maladies || []).join(', '),
            traitements: (found.traitements || []).join(', '),
            allergies: (found.allergies || []).join(', '),
            antecedents: (found.antecedents || []).join(', '),
          });
        }
      } catch (e: any) {
        setError(e?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId]);

  const parseList = (v?: string) => (v ? v.split(',').map(s => s.trim()).filter(Boolean) : []);
  const onSave = async () => {
    if (!rec?._id) return;
    try {
      setSaving(true);
      await updateHealthRecord(rec._id, {
        groupeSanguin: form.groupeSanguin || undefined,
        maladies: parseList(form.maladies),
        traitements: parseList(form.traitements),
        allergies: parseList(form.allergies),
        antecedents: parseList(form.antecedents),
      });
      Alert.alert('Succès', 'Fiche mise à jour');
      setEditMode(false);
      // refresh local view
      const list = await listHealthRecords();
      const found = (Array.isArray(list) ? list : []).find((f: any) => String((f.patient?._id)||f.patient) === String(patientId));
      setRec(found || null);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || "Échec de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (<View style={styles.center}><ActivityIndicator /></View>);
  if (error || !rec) return (<View style={styles.center}><Text style={{ color: '#DC2626' }}>{error || 'Fiche introuvable'}</Text></View>);

  return (
    <PageContainer scroll style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Fiche de santé du patient</Text>
        </View>
        <TouchableOpacity onPress={() => setEditMode(e => !e)}>
          <Text style={{ color: '#2563EB' }}>{editMode ? 'Annuler' : 'Modifier'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Groupe sanguin</Text>
        {editMode ? (
          <TextInput
            placeholder="Ex: O+, A-, ..."
            value={form.groupeSanguin}
            onChangeText={(t) => setForm((f) => ({ ...f, groupeSanguin: t }))}
            style={styles.input}
          />
        ) : (
          <Text style={styles.value}>{rec.groupeSanguin || '—'}</Text>
        )}

        <Text style={[styles.label, { marginTop: 8 }]}>Dernière mise à jour</Text>
        <Text style={styles.value}>{rec.derniereMiseAJour ? new Date(rec.derniereMiseAJour).toLocaleString() : '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Allergies</Text>
        {editMode ? (
          <TextInput placeholder="Séparées par des virgules" value={form.allergies} onChangeText={(t) => setForm((f) => ({ ...f, allergies: t }))} style={styles.input} multiline />
        ) : (
          (rec.allergies && rec.allergies.length > 0) ? rec.allergies.map((t, i) => (
            <Text key={`${t}_${i}`} style={styles.item}>• {t}</Text>
          )) : <Text style={styles.itemMuted}>Aucun</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Maladies</Text>
        {editMode ? (
          <TextInput placeholder="Séparées par des virgules" value={form.maladies} onChangeText={(t) => setForm((f) => ({ ...f, maladies: t }))} style={styles.input} multiline />
        ) : (
          (rec.maladies && rec.maladies.length > 0) ? rec.maladies.map((t, i) => (
            <Text key={`${t}_${i}`} style={styles.item}>• {t}</Text>
          )) : <Text style={styles.itemMuted}>Aucun</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Traitements</Text>
        {editMode ? (
          <TextInput placeholder="Séparés par des virgules" value={form.traitements} onChangeText={(t) => setForm((f) => ({ ...f, traitements: t }))} style={styles.input} multiline />
        ) : (
          (rec.traitements && rec.traitements.length > 0) ? rec.traitements.map((t, i) => (
            <Text key={`${t}_${i}`} style={styles.item}>• {t}</Text>
          )) : <Text style={styles.itemMuted}>Aucun</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Antécédents</Text>
        {editMode ? (
          <TextInput placeholder="Séparés par des virgules" value={form.antecedents} onChangeText={(t) => setForm((f) => ({ ...f, antecedents: t }))} style={styles.input} multiline />
        ) : (
          (rec.antecedents && rec.antecedents.length > 0) ? rec.antecedents.map((t, i) => (
            <Text key={`${t}_${i}`} style={styles.item}>• {t}</Text>
          )) : <Text style={styles.itemMuted}>Aucun</Text>
        )}
      </View>

      {editMode ? (
        <TouchableOpacity onPress={onSave} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.7 }]}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Enregistrer</Text>}
        </TouchableOpacity>
      ) : null}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, color: '#111827', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  label: { color: '#6B7280' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginTop: 6 },
  value: { color: '#111827', fontSize: 16 },
  section: { color: '#111827', marginBottom: 6 },
  item: { color: '#374151', marginTop: 4 },
  itemMuted: { color: '#6B7280' },
  saveBtn: { backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveText: { color: '#fff', fontSize: 16 },
});
