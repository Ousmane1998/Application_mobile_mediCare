import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getProfile, getMeasuresHistory, getAdvices } from "@/utils/api";

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

// Fonction d'analyse selon les normes
const analyserMesure = (type: string, value: string) => {
  const val = parseFloat(value);
  
  // Gestion des types de mesure
  switch (type.toLowerCase()) {
    case "tension":
      // Format: "systolique/diastolique" ex: "140/90"
      if (value.includes("/")) {
        const [sys, dia] = value.split("/").map(v => parseFloat(v));
        if (sys >= 140 || dia >= 90) return { status: "Tension Artérielle Élevée", severity: "high" };
        if (sys < 90 || dia < 60) return { status: "Tension Basse", severity: "low" };
      } else {
        if (val >= 140) return { status: "Tension Artérielle Élevée", severity: "high" };
        if (val < 90) return { status: "Tension Basse", severity: "low" };
      }
      return { status: "Tension Normale", severity: "normal" };
      
    case "glycemie":
      if (val > 126) return { status: "Glycémie Élevée", severity: "high" };
      if (val < 70) return { status: "Hypoglycémie", severity: "low" };
      return { status: "Glycémie Normale", severity: "normal" };
      
    case "pouls":
      if (val > 100) return { status: "Rythme Cardiaque Élevé", severity: "high" };
      if (val < 50) return { status: "Rythme Cardiaque Bas", severity: "low" };
      return { status: "Rythme Cardiaque Normal", severity: "normal" };
      
    case "temperature":
      if (val >= 39) return { status: "Fièvre Élevée", severity: "high" };
      if (val >= 38) return { status: "Fièvre", severity: "high" };
      if (val < 36) return { status: "Hypothermie", severity: "low" };
      return { status: "Température Normale", severity: "normal" };
      
    case "poids":
      // Pas de seuil d'alerte pour le poids
      return { status: "Poids enregistré", severity: "normal" };
      
    default:
      return { status: "Valeur enregistrée", severity: "normal" };
  }
};

const getIconForMeasure = (type: string, severity: string) => {
  if (severity === "high") return "alert-circle";
  if (severity === "low") return "warning";
  return "checkmark-circle";
};

const getColorForMeasure = (type: string, severity: string) => {
  if (severity === "high") return "#ef4444";
  if (severity === "low") return "#f59e0b";
  return "#10b981";
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
        console.log("📋 Récupération du profil...");
        const { user } = await getProfile();
        console.log("✅ Profil reçu :", user._id);
        setPatientId(user._id);

        // 2️⃣ Récupérer les mesures du patient
        console.log("📊 Récupération des mesures pour :", user._id);
        const mesuresData = await getMeasuresHistory(user._id);
        console.log("✅ Mesures reçues (type):", typeof mesuresData);
        console.log("✅ Mesures reçues (valeur):", mesuresData);
        console.log("✅ Est un array?:", Array.isArray(mesuresData));
        if (mesuresData && mesuresData.measures) {
          console.log("✅ Mesures trouvées dans .measures:", mesuresData.measures);
          setMeasures(mesuresData.measures);
        } else if (mesuresData && mesuresData.history) {
          console.log("✅ Mesures trouvées dans .history:", mesuresData.history);
          setMeasures(mesuresData.history);
        } else {
          setMeasures(Array.isArray(mesuresData) ? mesuresData : []);
        }

        // 3️⃣ Récupérer les conseils associés
        console.log("💬 Récupération des conseils pour :", user._id);
        const advicesData = await getAdvices(user._id);
        console.log("✅ Conseils reçus :", advicesData);
        setAdvices(Array.isArray(advicesData) ? advicesData : []);
      } catch (error: any) {
        console.error("❌ Erreur lors du chargement des données :", error);
        console.error("📌 Message d'erreur :", error?.message);
        console.error("📌 Stack :", error?.stack);
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

  // Séparer les mesures avec alertes des mesures normales
  const alertMeasures = measures.filter(m => {
    const analysis = analyserMesure(m.type, m.value);
    return analysis.severity !== "normal";
  });

  const normalMeasures = measures.filter(m => {
    const analysis = analyserMesure(m.type, m.value);
    return analysis.severity === "normal";
  });

  console.log("📈 Total mesures:", measures.length);
  console.log("🚨 Mesures alertes:", alertMeasures.length);
  console.log("✅ Mesures normales:", normalMeasures.length);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Alertes de Santé</Text>
        <TouchableOpacity>
          <Ionicons name="menu" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* === SECTION ALERTES (Mesures anormales) === */}
      {alertMeasures.length > 0 && (
        <>
          {alertMeasures.map((m, index) => {
            const analysis = analyserMesure(m.type, m.value);
            const color = getColorForMeasure(m.type, analysis.severity);
            const icon = getIconForMeasure(m.type, analysis.severity);

            return (
              <View key={m._id} style={[styles.alertCard, { borderLeftColor: color }]}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertTitleRow}>
                    <Ionicons name={icon} size={20} color={color} />
                    <Text style={[styles.alertTitle, { color }]}>{analysis.status}</Text>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.alertValue}>{m.value} {m.type === "tension" ? "mmHg" : m.type === "glycemie" ? "mg/dL" : m.type === "pouls" ? "bpm" : "°C"}</Text>
                <Text style={styles.alertDate}>{new Date(m.date).toLocaleDateString("fr-FR", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</Text>

                {/* Conseils pour la première alerte */}
                {index === 0 && advices.length > 0 && (
                  <>
                    <Text style={styles.adviceTitle}>Conseils pour vous</Text>
                    <View style={styles.adviceList}>
                      {advices.slice(0, 3).map((advice, idx) => (
                        <Text key={idx} style={styles.adviceItem}>• {advice.message}</Text>
                      ))}
                    </View>

                    <View style={styles.buttonRow}>
                      <TouchableOpacity style={[styles.button, styles.buttonPrimary]}>
                        <Text style={styles.buttonText}>Contacter m...</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.button, styles.buttonSecondary]}>
                        <Text style={styles.buttonTextSecondary}>J'ai suivi les ...</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.infoTitle}>Informations pour le Médecin</Text>
                    <View style={styles.infoList}>
                      <Text style={styles.infoItem}>• Analyse de la tendance sur les dernières 24h.</Text>
                      <Text style={styles.infoItem}>• Recommandation de suivi.</Text>
                    </View>
                  </>
                )}
              </View>
            );
          })}
        </>
      )}

      {/* === SECTION MESURES NORMALES === */}
      {normalMeasures.length > 0 && (
        <>
          {normalMeasures.map((m) => {
            const analysis = analyserMesure(m.type, m.value);
            const color = getColorForMeasure(m.type, analysis.severity);

            return (
              <View key={m._id} style={[styles.normalCard, { borderLeftColor: color }]}>
                <View style={styles.normalHeader}>
                  <View>
                    <Text style={styles.normalTitle}>{analysis.status}</Text>
                    <Text style={styles.normalValue}>{m.value} {m.type === "tension" ? "mmHg" : m.type === "glycemie" ? "mg/dL" : m.type === "pouls" ? "bpm" : "°C"}</Text>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.normalDate}>{new Date(m.date).toLocaleDateString("fr-FR", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</Text>
              </View>
            );
          })}
        </>
      )}

      {/* === SECTION AUCUNE MESURE === */}
      {measures.length === 0 && (
        <View style={styles.noAlertContainer}>
          <View style={styles.checkmarkCircle}>
            <Ionicons name="checkmark" size={50} color="#fff" />
          </View>
          <Text style={styles.noAlertTitle}>Aucune mesure récente</Text>
          <Text style={styles.noAlertSubtitle}>Commencez à enregistrer vos mesures !</Text>
          <TouchableOpacity style={styles.historyButton}>
            <Text style={styles.historyButtonText}>Ajouter une mesure</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* === SECTION AUCUNE ALERTE (quand il y a des mesures normales) === */}
      {alertMeasures.length === 0 && normalMeasures.length > 0 && (
        <View style={styles.successBanner}>
          <View style={styles.checkmarkCircle}>
            <Ionicons name="checkmark" size={50} color="#fff" />
          </View>
          <Text style={styles.noAlertTitle}>Aucune alerte</Text>
          <Text style={styles.noAlertSubtitle}>Continuez votre excellent travail !</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default HealthAlertScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", paddingBottom: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 40,
    marginTop: 32,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },

  // Alert Card
  alertCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  alertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alertTitle: { fontSize: 16, fontWeight: "600" },
  alertValue: { fontSize: 14, fontWeight: "500", color: "#111827", marginTop: 4 },
  alertDate: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },

  // Advice Section
  adviceTitle: { fontSize: 14, fontWeight: "600", color: "#111827", marginTop: 12, marginBottom: 8 },
  adviceList: { marginBottom: 12 },
  adviceItem: { fontSize: 13, color: "#374151", marginBottom: 6, lineHeight: 18 },

  // Buttons
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonPrimary: { backgroundColor: "#14b8a6" },
  buttonText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  buttonSecondary: { backgroundColor: "#d1fae5" },
  buttonTextSecondary: { fontSize: 13, fontWeight: "600", color: "#0f766e" },

  // Info Section
  infoTitle: { fontSize: 13, fontWeight: "600", color: "#111827", marginTop: 12, marginBottom: 8 },
  infoList: { marginBottom: 12 },
  infoItem: { fontSize: 12, color: "#6B7280", marginBottom: 6, lineHeight: 16 },

  // Normal Card
  normalCard: {
    backgroundColor: "#fff",
    padding: 14,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  normalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  normalTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  normalValue: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  normalDate: { fontSize: 11, color: "#9CA3AF", marginTop: 6 },

  // No Alert Container
  noAlertContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 16,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#14b8a6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  noAlertTitle: { fontSize: 18, fontWeight: "600", color: "#111827", marginBottom: 8 },
  noAlertSubtitle: { fontSize: 14, color: "#6B7280", marginBottom: 20 },
  historyButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#d1fae5",
    borderRadius: 8,
  },
  historyButtonText: { fontSize: 13, fontWeight: "600", color: "#0f766e" },

  // Success Banner
  successBanner: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  // Legacy styles (kept for compatibility)
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
