import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getProfile } from "../../utils/api";

type RootStackParamList = {
  Messages: undefined;
  Chat: { patientId: string; patientName: string };
};

type MessagesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Messages">;

type Props = {
  navigation: MessagesScreenNavigationProp;
};

type Patient = {
  _id: string;
  nom: string;
  prenom: string;
  email?: string;
  photo?: string;
  pathologie?: string;
};

const MessagesScreen: React.FC<Props> = ({ navigation }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Récupérer le profil du médecin
        const { user } = await getProfile();
        setDoctor(user);
        console.log("👨‍⚕️ Médecin :", user._id);

        // TODO: Créer un endpoint pour récupérer les patients du médecin
        // Pour maintenant, on va afficher un message
        console.log("📋 Patients du médecin :", user._id);
        
        // Exemple de patients (à remplacer par un appel API)
        setPatients([]);
      } catch (err: any) {
        console.error("❌ Erreur chargement :", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const renderPatient = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => navigation.navigate("Chat", { patientId: item._id, patientName: `${item.prenom} ${item.nom}` })}
    >
      <Image
        source={{ uri: item.photo || "https://cdn-icons-png.flaticon.com/512/921/921071.png" }}
        style={styles.avatar}
      />
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.prenom} {item.nom}</Text>
        <Text style={styles.patientEmail}>{item.email}</Text>
        {item.pathologie && <Text style={styles.patientPathologie}>{item.pathologie}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#2ccdd2" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#2ccdd2" />
          <Text style={{ marginTop: 12, color: "#6B7280" }}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Vos patients</Text>
      </View>

      {patients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Aucun patient pour le moment</Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item._id}
          renderItem={renderPatient}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default MessagesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    backgroundColor: "#2ccdd2",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: { fontSize: 24, fontWeight: "700", color: "#fff" },
  subtitle: { fontSize: 14, color: "#D1FAE5", marginTop: 4 },
  listContainer: { paddingHorizontal: 12, paddingVertical: 12 },
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  patientEmail: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  patientPathologie: { fontSize: 12, color: "#2ccdd2", marginTop: 4, fontWeight: "500" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { fontSize: 16, color: "#9CA3AF", marginTop: 12 },
});
