import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
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
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: "success" | "error" | "info" }>({
    visible: false,
    message: "",
    type: "info",
  });
  const [me, setMe] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState('');
  // pickers already declared above; remove duplicates

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
      await addMeasure({ patientId: me.id, type, value: value.trim().replace(',', '.'), heure: dateISO, notes: notes.trim() || undefined });
      setSnack({ visible: true, message: 'Mesure ajoutée.', type: 'success' });
      setTimeout(() => router.back(), 800);
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'ajout");
      setSnack({ visible: true, message: e?.message || "Erreur lors de l'ajout", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>Quel type de mesure souhaitez-vous ajouter ?</Text>

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
        <Text style={styles.label}>Valeur</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]} value={value} onChangeText={setValue}
            placeholder={type === 'tension' ? 'mmHg' : type === 'glycemie' ? 'mg/dL' : type === 'poids' ? 'kg' : type === 'pouls' ? 'bpm' : '°C'}
          />
          <Text style={styles.unit}>
            {type === 'tension' ? 'mmHg' : type === 'glycemie' ? 'mg/dL' : type === 'poids' ? 'kg' : type === 'pouls' ? 'bpm' : '°C'}
          </Text>
        </View>
        <Text style={styles.help}>
          {type === 'tension' ? "Ex: 120/80 mmHg" : type === 'glycemie' ? "Ex: 90 mg/dL" : type === 'poids' ? "Ex: 75.5 kg" : type === 'pouls' ? "Ex: 72 bpm" : "Ex: 37.2 °C"}
        </Text>
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Notes (facultatif)</Text>
        <TextInput style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} multiline placeholder="Ajouter une note..." />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={onSave}>
        <Text style={styles.primaryBtnText}>{saving ? 'Enregistrement…' : 'Sauvegarder'}</Text>
      </TouchableOpacity>

      <Snackbar
        visible={snack.visible}
        message={snack.message}
        type={snack.type}
        onHide={() => setSnack((s) => ({ ...s, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#F8FAFC", minHeight: "100%", marginBottom: 40, marginTop: 32 },
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
