import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getProfile, getMeasures, getAdvices } from "@/utils/api"; // adapte le chemin

type Measure = {
  _id: string;
  type: string;
  value: string;
  date: string;
};

type Advice = {
  _id: string;
  patientId: string;
  message: string;
  createdAt: string;
};

// Fonction d’analyse selon les normes
const analyserMesure = (type: string, value: string) => {
  const val = parseFloat(value);
  switch (type) {
    case "tension":
      if (val >= 140) return "Tension élevée ⚠️";
      if (val < 90) return "Tension basse ⚠️";
      return "Tension normale ✅";
    case "glycemie":
      if (val > 1.26) return "Hyperglycémie ⚠️";
      if (val < 0.7) return "Hypoglycémie ⚠️";
      return "Glycémie normale ✅";
    case "pouls":
      if (val > 100) return "Tachycardie ⚠️";
      if (val < 50) return "Bradycardie ⚠️";
      return "Pouls normal ✅";
    case "temperature":
      if (val >= 39) return "Fièvre élevée 🔥";
      if (val >= 38) return "Fièvre ⚠️";
      if (val < 36) return "Hypothermie ⚠️";
      return "Température normale ✅";
    default:
      return "Valeur enregistrée";
  }
};

const HealthAlertScreen = () => {
  const [loading, setLoading] = useState(true);
  const [measures, setMeasures] = useState<Measure[]>([]);
  const [advices, setAdvices] = useState<Advice[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1️⃣ Récupérer le profil pour obtenir l'ID du patient
        const { user } = await getProfile();
        setPatientId(user._id);

        // 2️⃣ Récupérer les mesures du patient
        const mesuresData = await getMeasures(user._id);
        setMeasures(mesuresData);

        // 3️⃣ Récupérer les conseils associés
        const advicesData = await getAdvices(user._id);
        setAdvices(advicesData);
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ccdd2" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🩺 Mesures et alertes récentes</Text>

      {/* === SECTION MESURES === */}
      {measures.length > 0 ? (
        measures.map((m) => (
          <View key={m._id} style={styles.card}>
            <Text style={styles.type}>{m.type.toUpperCase()}</Text>
            <Text style={styles.value}>Valeur : {m.value}</Text>
            <Text style={styles.status}>{analyserMesure(m.type, m.value)}</Text>
            <Text style={styles.date}>{new Date(m.date).toLocaleString()}</Text>
          </View>
        ))
      ) : (
        <View style={styles.noData}>
          <Ionicons name="notifications-off" size={40} color="#9CA3AF" />
          <Text style={styles.noText}>Aucune mesure disponible</Text>
        </View>
      )}

      {/* === SECTION CONSEILS === */}
      <Text style={[styles.title, { marginTop: 20 }]}>💬 Conseils du médecin</Text>

      {advices.length > 0 ? (
        advices.map((a) => (
          <View key={a._id} style={[styles.card, { borderLeftColor: "#16a34a" }]}>
            <Text style={styles.value}>{a.message}</Text>
            <Text style={styles.date}>{new Date(a.createdAt).toLocaleString()}</Text>
          </View>
        ))
      ) : (
        <View style={styles.noData}>
          <Ionicons name="chatbubbles-outline" size={40} color="#9CA3AF" />
          <Text style={styles.noText}>Aucun conseil récent</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default HealthAlertScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "600", color: "#111827", marginBottom: 10 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#2ccdd2",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  type: { fontSize: 16, fontWeight: "bold", color: "#2ccdd2" },
  value: { fontSize: 15, marginTop: 4 },
  status: { fontSize: 15, fontWeight: "500", marginTop: 4 },
  date: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  noData: { alignItems: "center", marginTop: 40 },
  noText: { color: "#6B7280", marginTop: 8 },
});
