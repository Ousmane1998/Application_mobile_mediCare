import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listHealthRecords, updateHealthRecord, type HealthRecord } from '../../utils/api';
import { useFormValidation } from '../../hooks/useFormValidation';
import { hasDanger } from '../../utils/validation';

export default function DoctorPatientHealthRecordScreen() {
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
  const fv = useFormValidation(
    { groupeSanguin: '', maladies: '', traitements: '', allergies: '', antecedents: '' },
    {
      groupeSanguin: (v) => (String(v || '').length > 10 ? 'Trop long.' : (hasDanger(String(v || '')) ? 'Caractères interdits (<, >).' : null)),
      maladies: (v) => (String(v || '').length > 500 ? 'Trop long.' : (hasDanger(String(v || '')) ? 'Caractères interdits (<, >).' : null)),
      traitements: (v) => (String(v || '').length > 500 ? 'Trop long.' : (hasDanger(String(v || '')) ? 'Caractères interdits (<, >).' : null)),
      allergies: (v) => (String(v || '').length > 500 ? 'Trop long.' : (hasDanger(String(v || '')) ? 'Caractères interdits (<, >).' : null)),
      antecedents: (v) => (String(v || '').length > 500 ? 'Trop long.' : (hasDanger(String(v || '')) ? 'Caractères interdits (<, >).' : null)),
    }
  );

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const list = await listHealthRecords();
        const found = (Array.isArray(list) ? list : []).find((f: any) => String((f.patient?._id)||f.patient) === String(patientId));
        setRec(found || null);
        if (found) {
          const next = {
            groupeSanguin: found.groupeSanguin || '',
            maladies: (found.maladies || []).join(', '),
            traitements: (found.traitements || []).join(', '),
            allergies: (found.allergies || []).join(', '),
            antecedents: (found.antecedents || []).join(', '),
          };
          setForm(next);
          (Object.keys(next) as Array<keyof typeof next>).forEach((k) => {
            // @ts-ignore
            fv.setField(k, next[k] || '');
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
    fv.markAllTouched();
    if (!fv.isValid) { Alert.alert('Validation', 'Veuillez corriger les erreurs.'); return; }
    if (!rec?._id) return;
    try {
      setSaving(true);
      await updateHealthRecord(rec._id, {
        groupeSanguin: fv.values.groupeSanguin || undefined,
        maladies: parseList(fv.values.maladies),
        traitements: parseList(fv.values.traitements),
        allergies: parseList(fv.values.allergies),
        antecedents: parseList(fv.values.antecedents),
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })} keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}>
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
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
          <>
            <TextInput
              ref={register('groupeSanguin')}
              onFocus={() => scrollIntoView('groupeSanguin')}
              placeholder="Ex: O+, A-, ..."
              value={fv.values.groupeSanguin}
              onChangeText={(t) => fv.setField('groupeSanguin', t)}
              style={[styles.input, fv.getError('groupeSanguin') && { borderColor: '#dc2626' }]}
              {...fv.getInputProps('groupeSanguin')}
            />
            {fv.touched.groupeSanguin && fv.getError('groupeSanguin') ? (<Text style={styles.fieldError}>{fv.getError('groupeSanguin')}</Text>) : null}
          </>
        ) : (
          <Text style={styles.value}>{rec.groupeSanguin || '—'}</Text>
        )}

        <Text style={[styles.label, { marginTop: 8 }]}>Dernière mise à jour</Text>
        <Text style={styles.value}>{rec.derniereMiseAJour ? new Date(rec.derniereMiseAJour).toLocaleString() : '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Allergies</Text>
        {editMode ? (
          <>
            <TextInput ref={register('allergies')} onFocus={() => scrollIntoView('allergies')} placeholder="Séparées par des virgules" value={fv.values.allergies} onChangeText={(t) => fv.setField('allergies', t)} style={[styles.input, fv.getError('allergies') && { borderColor: '#dc2626' }]} multiline {...fv.getInputProps('allergies')} />
            {fv.touched.allergies && fv.getError('allergies') ? (<Text style={styles.fieldError}>{fv.getError('allergies')}</Text>) : null}
          </>
        ) : (
          (rec.allergies && rec.allergies.length > 0) ? rec.allergies.map((t, i) => (
            <Text key={`${t}_${i}`} style={styles.item}>• {t}</Text>
          )) : <Text style={styles.itemMuted}>Aucun</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Maladies</Text>
        {editMode ? (
          <>
            <TextInput ref={register('maladies')} onFocus={() => scrollIntoView('maladies')} placeholder="Séparées par des virgules" value={fv.values.maladies} onChangeText={(t) => fv.setField('maladies', t)} style={[styles.input, fv.getError('maladies') && { borderColor: '#dc2626' }]} multiline {...fv.getInputProps('maladies')} />
            {fv.touched.maladies && fv.getError('maladies') ? (<Text style={styles.fieldError}>{fv.getError('maladies')}</Text>) : null}
          </>
        ) : (
          (rec.maladies && rec.maladies.length > 0) ? rec.maladies.map((t, i) => (
            <Text key={`${t}_${i}`} style={styles.item}>• {t}</Text>
          )) : <Text style={styles.itemMuted}>Aucun</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Traitements</Text>
        {editMode ? (
          <>
            <TextInput ref={register('traitements')} onFocus={() => scrollIntoView('traitements')} placeholder="Séparés par des virgules" value={fv.values.traitements} onChangeText={(t) => fv.setField('traitements', t)} style={[styles.input, fv.getError('traitements') && { borderColor: '#dc2626' }]} multiline {...fv.getInputProps('traitements')} />
            {fv.touched.traitements && fv.getError('traitements') ? (<Text style={styles.fieldError}>{fv.getError('traitements')}</Text>) : null}
          </>
        ) : (
          (rec.traitements && rec.traitements.length > 0) ? rec.traitements.map((t, i) => (
            <Text key={`${t}_${i}`} style={styles.item}>• {t}</Text>
          )) : <Text style={styles.itemMuted}>Aucun</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Antécédents</Text>
        {editMode ? (
          <>
            <TextInput ref={register('antecedents')} onFocus={() => scrollIntoView('antecedents')} placeholder="Séparés par des virgules" value={fv.values.antecedents} onChangeText={(t) => fv.setField('antecedents', t)} style={[styles.input, fv.getError('antecedents') && { borderColor: '#dc2626' }]} multiline {...fv.getInputProps('antecedents')} />
            {fv.touched.antecedents && fv.getError('antecedents') ? (<Text style={styles.fieldError}>{fv.getError('antecedents')}</Text>) : null}
          </>
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
    </ScrollView>
    </KeyboardAvoidingView>
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
  fieldError: { color: '#dc2626', fontSize: 12, marginTop: 6 },
});
