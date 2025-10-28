import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getProfile, getAdvices } from "@/utils/api";
import PageContainer from "../../components/PageContainer";

type Advice = {
  _id: string;
  titre: string;
  contenu: string;
  categorie: string;
  medecinId: {
    nom: string;
    prenom: string;
    email: string;
  };
  createdAt: string;
};

const categoryIcons: Record<string, string> = {
  Nutrition: "nutrition",
  Activité: "fitness",
  Médicaments: "medical",
  Prévention: "shield-checkmark",
  Général: "information-circle",
};

const categoryColors: Record<string, string> = {
  Nutrition: "#10b981",
  Activité: "#3b82f6",
  Médicaments: "#f59e0b",
  Prévention: "#ef4444",
  Général: "#8b5cf6",
};

const AdviceScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [advices, setAdvices] = useState<Advice[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdvices();
  }, []);

  const fetchAdvices = async () => {
    try {
      setError(null);
      const { user } = await getProfile();
      setPatientId(user._id);

      const advicesData = await getAdvices(user._id);
      console.log("✅ Conseils reçus :", advicesData);
      setAdvices(Array.isArray(advicesData) ? advicesData : []);
    } catch (err: any) {
      console.error("❌ Erreur lors du chargement des conseils :", err);
      setError(err?.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdvices();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  return (
    <PageContainer
      scroll
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conseils santé</Text>
        <TouchableOpacity>
          <Ionicons name="person-circle" size={28} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Tous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Nutrition</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Activité</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Médicaments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Prévention</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {advices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="document-text" size={50} color="#d1d5db" />
          </View>
          <Text style={styles.emptyTitle}>Aucun conseil pour le moment</Text>
          <Text style={styles.emptySubtitle}>
            Votre médecin vous enverra des conseils personnalisés ici
          </Text>
        </View>
      ) : (
        <View style={styles.advicesContainer}>
          {advices.map((advice) => {
            const categoryColor =
              categoryColors[advice.categorie] || categoryColors.Général;
            const categoryIcon =
              categoryIcons[advice.categorie] || categoryIcons.Général;

            return (
              <View key={advice._id} style={styles.adviceCard}>
                {/* Category Badge */}
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: categoryColor + "20" },
                  ]}
                >
                  <Ionicons
                    name={categoryIcon as any}
                    size={20}
                    color={categoryColor}
                  />
                  <Text style={[styles.categoryText, { color: categoryColor }]}>
                    {advice.categorie}
                  </Text>
                </View>

                {/* Title */}
                <Text style={styles.adviceTitle}>{advice.titre}</Text>

                {/* Content */}
                <Text style={styles.adviceContent}>{advice.contenu}</Text>

                {/* Doctor Info */}
                <View style={styles.doctorInfo}>
                  <View style={styles.doctorAvatar}>
                    <Text style={styles.doctorInitials}>
                      {advice.medecinId.prenom[0]}
                      {advice.medecinId.nom[0]}
                    </Text>
                  </View>
                  <View style={styles.doctorDetails}>
                    <Text style={styles.doctorName}>
                      Dr. {advice.medecinId.prenom} {advice.medecinId.nom}
                    </Text>
                    <Text style={styles.doctorEmail}>
                      {advice.medecinId.email}
                    </Text>
                  </View>
                </View>

                {/* Date */}
                <Text style={styles.adviceDate}>
                  {new Date(advice.createdAt).toLocaleDateString("fr-FR", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.buttonSecondary}>
                    <Ionicons name="share-social" size={18} color="#14b8a6" />
                    <Text style={styles.buttonTextSecondary}>Partager</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.buttonSecondary}>
                    <Ionicons name="bookmark" size={18} color="#14b8a6" />
                    <Text style={styles.buttonTextSecondary}>Enregistrer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </PageContainer>
  );
};

export default AdviceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },

  // Tabs
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  tabActive: {
    backgroundColor: "#14b8a6",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#fff",
  },

  // Error
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: "#991b1b",
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },

  // Advices Container
  advicesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // Advice Card
  adviceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },

  // Category Badge
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Title
  adviceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },

  // Content
  adviceContent: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 12,
  },

  // Doctor Info
  doctorInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 12,
    gap: 10,
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#14b8a6",
    alignItems: "center",
    justifyContent: "center",
  },
  doctorInitials: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  doctorEmail: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  // Date
  adviceDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 12,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  buttonSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#d1fae5",
    gap: 6,
  },
  buttonTextSecondary: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f766e",
  },
});
