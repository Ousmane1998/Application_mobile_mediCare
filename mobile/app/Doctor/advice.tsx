import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getProfile, listMyPatients, authFetch, type Patient } from "@/utils/api";

type Advice = {
  _id: string;
  titre: string;
  contenu: string;
  categorie: string;
  patientId: {
    nom: string;
    prenom: string;
    email: string;
  };
  createdAt: string;
};

const categories = ["Nutrition", "Activité", "Médicaments", "Prévention", "Général"];

const categoryColors: Record<string, string> = {
  Nutrition: "#10b981",
  Activité: "#3b82f6",
  Médicaments: "#f59e0b",
  Prévention: "#ef4444",
  Général: "#8b5cf6",
};

const AdviceDoctorScreen = () => {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medecinId, setMedecinId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Général");
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { user } = await getProfile();
      setMedecinId(user._id);

      const patientsData = await listMyPatients();
      console.log("✅ Patients reçus :", patientsData);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (err: any) {
      console.error("❌ Erreur lors du chargement :", err);
      Alert.alert("Erreur", "Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdvice = async () => {
    if (!selectedPatient || !titre.trim() || !contenu.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        medecinId,
        patientId: selectedPatient._id,
        titre: titre.trim(),
        contenu: contenu.trim(),
        categorie: selectedCategory,
      };

      console.log("📤 Envoi du conseil :", payload);
      const response = await authFetch("/advices", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      console.log("✅ Conseil créé :", response);
      Alert.alert("Succès", "Conseil créé avec succès");

      // Reset form
      setTitre("");
      setContenu("");
      setSelectedCategory("Général");
      setSelectedPatient(null);
      setShowModal(false);

      // Refresh patients list
      await fetchData();
    } catch (err: any) {
      console.error("❌ Erreur lors de la création :", err);
      Alert.alert("Erreur", err?.message || "Impossible de créer le conseil");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Créer un conseil</Text>
          <TouchableOpacity>
            <Ionicons name="person-circle" size={28} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Section: Sélectionner un patient */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sélectionner un patient</Text>

            {selectedPatient ? (
              <View style={styles.selectedPatientCard}>
                <View style={styles.patientAvatar}>
                  <Text style={styles.patientInitials}>
                    {selectedPatient.prenom[0]}
                    {selectedPatient.nom[0]}
                  </Text>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>
                    {selectedPatient.prenom} {selectedPatient.nom}
                  </Text>
                  <Text style={styles.patientEmail}>{selectedPatient.email}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedPatient(null)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectPatientButton}
                onPress={() => setShowModal(true)}
              >
                <Ionicons name="add-circle" size={24} color="#14b8a6" />
                <Text style={styles.selectPatientText}>Choisir un patient</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Section: Catégorie */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Catégorie</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat && styles.categoryButtonActive,
                    {
                      borderColor:
                        selectedCategory === cat
                          ? categoryColors[cat]
                          : "#E5E7EB",
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategory === cat && {
                        color: categoryColors[cat],
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Section: Titre */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Titre du conseil</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Réduisez votre consommation de sel"
              placeholderTextColor="#9CA3AF"
              value={titre}
              onChangeText={setTitre}
              maxLength={100}
            />
            <Text style={styles.charCount}>{titre.length}/100</Text>
          </View>

          {/* Section: Contenu */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contenu du conseil</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez le conseil en détail..."
              placeholderTextColor="#9CA3AF"
              value={contenu}
              onChangeText={setContenu}
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{contenu.length}/1000</Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setTitre("");
                setContenu("");
                setSelectedCategory("Général");
                setSelectedPatient(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedPatient || !titre.trim() || !contenu.trim()) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleCreateAdvice}
              disabled={
                submitting ||
                !selectedPatient ||
                !titre.trim() ||
                !contenu.trim()
              }
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.submitButtonText}>Envoyer le conseil</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal: Sélectionner un patient */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mes patients</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Patients List */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {patients.length === 0 ? (
                <View style={styles.emptyPatients}>
                  <Ionicons name="people" size={50} color="#d1d5db" />
                  <Text style={styles.emptyPatientsText}>
                    Aucun patient trouvé
                  </Text>
                </View>
              ) : (
                patients.map((patient) => (
                  <TouchableOpacity
                    key={patient._id}
                    style={styles.patientListItem}
                    onPress={() => {
                      setSelectedPatient(patient);
                      setShowModal(false);
                    }}
                  >
                    <View style={styles.patientListAvatar}>
                      <Text style={styles.patientListInitials}>
                        {patient.prenom[0]}
                        {patient.nom[0]}
                      </Text>
                    </View>
                    <View style={styles.patientListInfo}>
                      <Text style={styles.patientListName}>
                        {patient.prenom} {patient.nom}
                      </Text>
                      <Text style={styles.patientListEmail}>
                        {patient.email}
                      </Text>
                      {patient.pathologie && (
                        <Text style={styles.patientListPathologie}>
                          {patient.pathologie}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default AdviceDoctorScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
    color: "#111827",
  },

  // Content
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 12,
  },

  // Select Patient
  selectPatientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#14b8a6",
    borderStyle: "dashed",
    gap: 8,
  },
  selectPatientText: {
    fontSize: 14,
    color: "#14b8a6",
  },

  // Selected Patient Card
  selectedPatientCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#d1fae5",
    borderRadius: 12,
    gap: 12,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#14b8a6",
    alignItems: "center",
    justifyContent: "center",
  },
  patientInitials: {
    fontSize: 14,
    color: "#fff",
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 13,
    color: "#0f766e",
  },
  patientEmail: {
    fontSize: 12,
    color: "#0f766e",
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },

  // Categories
  categoriesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  categoryButtonActive: {
    backgroundColor: "#d1fae5",
  },
  categoryButtonText: {
    fontSize: 13,
    color: "#6B7280",
  },

  // Input
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  textArea: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    height: 120,
  },
  charCount: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "right",
  },

  // Buttons
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    color: "#6B7280",
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#14b8a6",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  submitButtonText: {
    fontSize: 14,
    color: "#fff",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 16,
    color: "#111827",
  },

  // Patient List
  emptyPatients: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyPatientsText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
  },
  patientListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  patientListAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#14b8a6",
    alignItems: "center",
    justifyContent: "center",
  },
  patientListInitials: {
    fontSize: 14,
    color: "#fff",
  },
  patientListInfo: {
    flex: 1,
  },
  patientListName: {
    fontSize: 14,
    color: "#111827",
  },
  patientListEmail: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  patientListPathologie: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
});
