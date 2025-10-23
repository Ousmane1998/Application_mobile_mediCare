import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Type d'une alerte
interface HealthAlert {
  id: string;
  title: string;
  value: string;
  time: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: "info" | "warning" | "danger";
}

export default function HealthAlertsScreen() {
  const alerts: HealthAlert[] = [
    {
      id: "1",
      title: "Tension Artérielle Élevée",
      value: "150/95 mmHg",
      time: "Aujourd'hui, 09:15",
      color: "#e74c3c",
      icon: "alert-circle-outline",
      type: "danger",
    },
    {
      id: "2",
      title: "Glycémie Élevée",
      value: "180 mg/dL",
      time: "Hier, 18:30",
      color: "#f39c12",
      icon: "warning-outline",
      type: "warning",
    },
    {
      id: "3",
      title: "Rythme Cardiaque Élevé",
      value: "105 bpm",
      time: "Hier, 08:20",
      color: "#f1c40f",
      icon: "heart-outline",
      type: "warning",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#333" />
        <Text style={styles.headerTitle}>Mes Alertes de Santé</Text>
        <Ionicons name="menu" size={24} color="#333" />
      </View>

      {/* Alerte principale */}
      <View style={[styles.alertCard, { borderLeftColor: alerts[0].color }]}>
        <View style={styles.alertHeader}>
          <Ionicons name={alerts[0].icon} size={22} color={alerts[0].color} />
          <Text style={styles.alertTitle}>{alerts[0].title}</Text>
        </View>
        <Text style={[styles.alertValue, { color: alerts[0].color }]}>{alerts[0].value}</Text>
        <Text style={styles.alertTime}>{alerts[0].time}</Text>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Conseils pour vous</Text>
          <Text style={styles.bullet}>• Votre tension est plus élevée que la normale.</Text>
          <Text style={styles.bullet}>• Asseyez-vous et détendez-vous pendant 15 minutes.</Text>
          <Text style={styles.bullet}>• Évitez toute activité physique intense.</Text>
          <Text style={styles.bullet}>• Prenez une nouvelle mesure dans 30 minutes.</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.buttonOutline}>
              <Text style={styles.buttonOutlineText}>Contacter médecin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonFilled}>
              <Text style={styles.buttonFilledText}>J’ai suivi les conseils</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Informations pour le Médecin</Text>
          <Text style={styles.bullet}>• Analyse de la tendance sur les dernières 24h.</Text>
          <Text style={styles.bullet}>• Recommandation de suivi.</Text>
        </View>
      </View>

      {/* Autres alertes */}
      {alerts.slice(1).map((alert) => (
        <TouchableOpacity
          key={alert.id}
          style={[styles.alertCard, { borderLeftColor: alert.color }]}
        >
          <View style={styles.alertHeader}>
            <Ionicons name={alert.icon} size={22} color={alert.color} />
            <Text style={styles.alertTitle}>{alert.title}</Text>
          </View>
          <Text style={styles.alertValue}>{alert.value}</Text>
          <Text style={styles.alertTime}>{alert.time}</Text>
        </TouchableOpacity>
      ))}

      {/* Section finale */}
      <View style={styles.noAlertSection}>
        <Ionicons name="checkmark-circle" size={64} color="#2ccdd2" />
        <Text style={styles.noAlertText}>Aucune alerte récente</Text>
        <Text style={styles.subtitle}>Continuez votre excellent travail !</Text>
        <TouchableOpacity style={styles.historyButton}>
          <Text style={styles.historyButtonText}>Voir l’historique</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  alertCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
    color: "#333",
  },
  alertValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  alertTime: {
    fontSize: 13,
    color: "#777",
    marginBottom: 8,
  },
  sectionBox: {
    backgroundColor: "#f4f5f7",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  bullet: {
    fontSize: 13,
    color: "#555",
    marginBottom: 3,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: "#2ccdd2",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flex: 1,
    marginRight: 6,
  },
  buttonOutlineText: {
    color: "#2ccdd2",
    textAlign: "center",
    fontWeight: "600",
  },
  buttonFilled: {
    backgroundColor: "#2ccdd2",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flex: 1,
    marginLeft: 6,
  },
  buttonFilledText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  noAlertSection: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  noAlertText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2ccdd2",
    marginTop: 8,
  },
  subtitle: {
    color: "#555",
    marginBottom: 14,
  },
  historyButton: {
    backgroundColor: "#2ccdd2",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  historyButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
