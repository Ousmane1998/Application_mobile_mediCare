import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from "@react-native-community/datetimepicker";
import Snackbar from "../../components/Snackbar";
import { addMeasure, getProfile, type UserProfile, type MeasureType } from "../../utils/api";
import AsyncStorage from '@react-native-async-storage/async-storage';


const types: MeasureType[] = ["glycemie", "tension", "poids", "pouls", "temperature"];

export default function PatientMeasureAddScreen() {
  const router = useRouter();
  const [type, setType] = useState<MeasureType>("glycemie");
  const [value, setValue] = useState("");
  const [dateObj, setDateObj] = useState<Date | null>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: "success" | "error" | "info" }>({
    visible: false,
    message: "",
    type: "info",
  });
  const [me, setMe] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState('');
  // pickers already declared above; remove duplicates

  // Input filters per measure type
  const filterDecimal = (t: string) => {
    const cleaned = (t || '').replace(/[^0-9.,]/g, '');
    let out = '';
    let seenSep = false;
    for (const ch of cleaned) {
      if (ch === '.' || ch === ',') {
        if (!seenSep) { out += ch; seenSep = true; }
      } else {
        out += ch;
      }
    }
    return out;
  };
  const filterInteger = (t: string, maxLen = 3) => (t || '').replace(/\D/g, '').slice(0, maxLen);
  const filterBP = (t: string) => {
    let s = (t || '').replace(/[^0-9/]/g, '');
    const parts = s.split('/').slice(0, 2).map(p => p.replace(/\D/g, '').slice(0, 3));
    return parts.join(parts.length > 1 ? '/' : '');
  };
  const onChangeValue = (t: string) => {
    if (type === 'tension') setValue(filterBP(t));
    else if (type === 'pouls') setValue(filterInteger(t, 3));
    else setValue(filterDecimal(t));
  };
  const getKeyboard = () => {
    if (type === 'tension') return Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default';
    if (type === 'pouls') return 'number-pad';
    return Platform.OS === 'ios' ? 'decimal-pad' : 'numeric';
  };

  // Inline validation for value field
  const getValueError = (): string | null => {
    if (!value) return null; // no hard error when empty while typing
    const val = value.trim();
    const onlyNumber = /^\d+(?:[\.,]\d+)?$/;
    const bpRegex = /^\d{2,3}\/\d{2,3}$/;
    if (type === 'tension') {
      if (!bpRegex.test(val)) return "Format tension invalide (ex: 120/80)";
      const [sysStr, diaStr] = val.split('/');
      const sys = parseInt(sysStr, 10); const dia = parseInt(diaStr, 10);
      if (sys < 80 || sys > 200 || dia < 50 || dia > 130) return 'Plages: sys 80–200, dia 50–130';
      return null;
    }
    if (type === 'pouls') {
      if (!/^\d+$/.test(val)) return 'Entier attendu (bpm)';
      const v = parseInt(val, 10); if (v < 30 || v > 220) return 'Entre 30 et 220 bpm';
      return null;
    }
    // decimal types
    if (!onlyNumber.test(val)) return 'Valeur numérique attendue';
    const v = parseFloat(val.replace(',', '.'));
    if (type === 'glycemie' && (v < 40 || v > 600)) return 'Glycémie: 40–600 mg/dL';
    if (type === 'poids' && (v < 1 || v > 500)) return 'Poids: 1–500 kg';
    if (type === 'temperature' && (v < 34 || v > 43)) return 'Température: 34–43 °C';
    return null;
  };
  const valueError = getValueError();

useEffect(() => {
  (async () => {
    try {
      const data = await getProfile();
      console.log("Profile fetched:", data);

      // Mapper _id -> id
      const user: UserProfile = {
        ...data.user,
        id: data.user._id, // <-- ici on crée `id`
      };
      setMe(user);
    } catch (e: any) {
      setSnack({ visible: true, message: e?.message || "Erreur de chargement", type: "error" });
    }
  })();
}, []);



  const formatDisplayDate = (d: Date | null) => {
    if (!d) return "Sélectionner date et heure";
    // ex: 10/27/2023, 10:00 AM
    return d.toLocaleString(undefined, {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const onChangeDate = (event: any, selected?: Date) => {
    setShowDatePicker(Platform.OS === "ios"); // keep open on iOS
    if (selected) {
      const current = dateObj ? new Date(dateObj) : new Date();
      current.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setDateObj(current);
    }
  };

  const onChangeTime = (event: any, selected?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selected) {
      const current = dateObj ? new Date(dateObj) : new Date();
      current.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setDateObj(current);
    }
  };

  const onSave = async () => {
    if (!value) {
      setSnack({ visible: true, message: "Saisir la valeur.", type: "error" });
      return;
    }
    // validations (gardées depuis ton code)
    const onlyNumber = /^\d+(?:[\.,]\d+)?$/;
    const bpRegex = /^\d{2,3}\/\d{2,3}$/; // ex: 120/80
    switch (type) {
      case "tension":
        if (!bpRegex.test(value.trim())) {
          setSnack({ visible: true, message: "Format tension invalide. Utilisez '120/80'.", type: "error" });
          return;
        }
        {
          const [sysStr, diaStr] = value.trim().split("/");
          const sys = parseInt(sysStr, 10);
          const dia = parseInt(diaStr, 10);
          if (sys < 80 || sys > 200 || dia < 50 || dia > 130) {
            setSnack({
              visible: true,
              message: "Plages tension : systolique 80–200, diastolique 50–130.",
              type: "error",
            });
            return;
          }
        }
        break;
      case "glycemie":
      case "poids":
      case "temperature":
        if (!onlyNumber.test(value.trim())) {
          setSnack({ visible: true, message: "Valeur numérique attendue.", type: "error" });
          return;
        }
        {
          const v = parseFloat(value.trim().replace(",", "."));
          if (type === "glycemie" && (v < 40 || v > 600)) {
            setSnack({ visible: true, message: "Glycémie attendue entre 40 et 600 mg/dL.", type: "error" });
            return;
          }
          if (type === "poids" && (v < 1 || v > 500)) {
            setSnack({ visible: true, message: "Poids attendu entre 1 et 500 kg.", type: "error" });
            return;
          }
          if (type === "temperature" && (v < 34 || v > 43)) {
            setSnack({ visible: true, message: "Température attendue entre 34 et 43 °C.", type: "error" });
            return;
          }
        }
        break;
      case "pouls":
        if (!/^\d+$/.test(value.trim())) {
          setSnack({ visible: true, message: "Pouls doit être un entier (bpm).", type: "error" });
          return;
        }
        {
          const v = parseInt(value.trim(), 10);
          if (v < 30 || v > 220) {
            setSnack({ visible: true, message: "Pouls attendu entre 30 et 220 bpm.", type: "error" });
            return;
          }
        }
        break;
    }

    if (!me?.id) {
      setSnack({ visible: true, message: "Profil non chargé.", type: "error" });
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const dateISO = dateObj ? dateObj.toISOString() : undefined;
      const measureData = { patientId: me.id, type, value: value.trim().replace(',', '.'), heure: dateISO, notes: notes.trim() || undefined };

      if (offlineMode) {
        // Mode hors ligne : sauvegarder localement
        const offlineMeasures = await AsyncStorage.getItem('offlineMeasures');
        const measures = offlineMeasures ? JSON.parse(offlineMeasures) : [];
        measures.push({ ...measureData, synced: false, createdAt: new Date().toISOString() });
        await AsyncStorage.setItem('offlineMeasures', JSON.stringify(measures));
        setSnack({ visible: true, message: '📱 Mesure sauvegardée localement. Elle sera synchronisée quand vous aurez une connexion.', type: 'success' });
      } else {
        // Mode en ligne : envoyer au serveur
        await addMeasure(measureData);
        setSnack({ visible: true, message: 'Mesure ajoutée.', type: 'success' });
      }
      
      setTimeout(() => router.back(), 800);
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'ajout");
      setSnack({ visible: true, message: e?.message || "Erreur lors de l'ajout", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Keep focused field visible when keyboard appears
  const scrollRef = useRef<ScrollView>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const register = (key: string) => (el: TextInput | null) => { inputRefs.current[key] = el; };
  const scrollIntoView = (key: string) => {
    // Simplified scroll behavior - just scroll down a bit
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })} keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quel type de mesure souhaitez-vous ajouter ?</Text>
      </View>

      <View style={styles.group}><Text style={styles.label}>Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {types.map(t => (
            <TouchableOpacity key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}>
              <Text style={[styles.chipText, type === t && { color: '#fff' }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Date et Heure</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text>{formatDisplayDate(dateObj)}</Text>
        </TouchableOpacity>
        {/* show pickers conditionally */}
        {showDatePicker && (
          <DateTimePicker
            value={dateObj || new Date()}
            mode="date"
            display="default"
            onChange={(e, selected) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selected) {
                setDateObj(selected);
                setShowTimePicker(true);
              }
            }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={dateObj || new Date()}
            mode="time"
            display="default"
            onChange={(e, selected) => {
              onChangeTime(e, selected);
              if (Platform.OS !== 'ios') {
                setShowDatePicker(false);
                setShowTimePicker(false);
              }
            }}
          />
        )}
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Valeur </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            ref={register('value')}
            style={[styles.input, { flex: 1 }, !!valueError && value ? { borderColor: '#DC2626' } : null]} value={value} onChangeText={onChangeValue}
            placeholder={type === 'tension' ? 'Ex: 120/80 mmHg' : type === 'glycemie' ? 'Ex: 90 mg/dL' : type === 'poids' ? 'Ex: 75.5 kg' : type === 'pouls' ? 'Ex: 72 bpm' : 'Ex: 37.2 °C'}
            keyboardType={getKeyboard() as any}
            onFocus={() => scrollIntoView('value')}
          />
          <Text style={styles.unit}>
            {type === 'tension' ? 'mmHg' : type === 'glycemie' ? 'mg/dL' : type === 'poids' ? 'kg' : type === 'pouls' ? 'bpm' : '°C'}
          </Text>
        </View>
        {value && valueError ? (
          <Text style={[styles.help, { color: '#DC2626' }]}>{valueError}</Text>
        ) : (
          <Text style={styles.help}>
            {type === 'tension' ? "Entre 80/50 et 200/130 mmHg" : type === 'glycemie' ? "Entre 40 et 600 mg/dL" : type === 'poids' ? "Entre 1 et 500 kg" : type === 'pouls' ? "Entre 30 et 220 bpm" : "Entre 34 et 43 °C"}
          </Text>
        )}
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Notes (facultatif)</Text>
        <TextInput ref={register('notes')} style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} multiline placeholder="Ajouter une note..." onFocus={() => scrollIntoView('notes')} />
      </View>

      <View style={[styles.group, styles.offlineModeContainer]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name={offlineMode ? "cloud-offline-outline" : "cloud-done-outline"} size={18} color={offlineMode ? "#EF4444" : "#10B981"} />
            <Text style={styles.label}>Mode hors-ligne</Text>
          </View>
          <Switch value={offlineMode} onValueChange={setOfflineMode} />
        </View>
        {offlineMode && (
          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
            📱 Vos mesures seront sauvegardées localement et synchronisées automatiquement quand vous aurez une connexion.
          </Text>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.primaryBtn, (saving || !!valueError) && { opacity: 0.7 }]} disabled={saving || !!valueError} onPress={onSave}>
        <Text style={styles.primaryBtnText}>{saving ? 'Enregistrement…' : 'Sauvegarder'}</Text>
      </TouchableOpacity>

      <Snackbar
        visible={snack.visible}
        message={snack.message}
        type={snack.type}
        onHide={() => setSnack((s) => ({ ...s, visible: false }))}
      />
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, minHeight: "100%" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginVertical: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "transparent",
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#2ccdd2", borderColor: "#2ccdd2" },
  chipText: { color: "#111827", fontSize: 13 },
  group: { marginBottom: 12 },
  label: { fontSize: 13, color: "#374151", marginBottom: 6 },
  offlineModeContainer: { backgroundColor: "#FEF3C7", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#FCD34D" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  unit: { color: "#6B7280", fontSize: 12 },
  primaryBtn: { backgroundColor: "#2ccdd2", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
  primaryBtnText: { color: "#fff", fontSize: 16 },
  error: { color: "#DC2626", marginTop: 8 },
  help: { color: "#6B7280", fontSize: 12, marginTop: 6 },
});
