import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/header";
import NavPatient from "../../components/navPatient";

type StructureType = "Hôpital" | "Pharmacie" | "Poste de santé";

interface Structure {
  id: number;
  name: string;
  type: StructureType;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  distance: string;
}

export default function FindStructureScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission de localisation refusée");
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      // 🏥 Données fictives (tu peux les récupérer via ton API plus tard)
      const data: Structure[] = [
        {
          id: 1,
          name: "Hôpital Principal de Dakar",
          type: "Hôpital",
          latitude: loc.coords.latitude + 0.001,
          longitude: loc.coords.longitude + 0.001,
          address: "Avenue Faidherbe, Dakar",
          phone: "+221338234545",
          distance: "0.0 km",
        },
        {
          id: 2,
          name: "Pharmacie de la Gare",
          type: "Pharmacie",
          latitude: loc.coords.latitude + 0.002,
          longitude: loc.coords.longitude - 0.001,
          address: "Gare routière, Dakar",
          phone: "+221338223344",
          distance: "0.5 km",
        },
        {
          id: 3,
          name: "Poste de Santé Médina",
          type: "Poste de santé",
          latitude: loc.coords.latitude - 0.001,
          longitude: loc.coords.longitude - 0.001,
          address: "Rue 22 Médina, Dakar",
          phone: "+221338245678",
          distance: "1.2 km",
        },
      ];

      setStructures(data);
      setLoading(false);
    })();
  }, []);

  const getMarkerColor = (type: StructureType) => {
    switch (type) {
      case "Hôpital":
        return "red";
      case "Pharmacie":
        return "green";
      case "Poste de santé":
        return "blue";
      default:
        return "gray";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ccdd2" />
        <Text>Chargement de votre position...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      {location ? (
        <>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={location}
              title="Vous êtes ici"
              pinColor="#2ccdd2"
            />
            {structures.map((s) => (
              <Marker
                key={s.id}
                coordinate={{ latitude: s.latitude, longitude: s.longitude }}
                title={s.name}
                description={s.type}
                pinColor={getMarkerColor(s.type)}
              />
            ))}
          </MapView>

          <ScrollView style={styles.list}>
            <Text style={styles.listTitle}>
              {structures.length} structure(s) à moins de 10 km
            </Text>
            {structures.map((s) => (
              <View key={s.id} style={styles.card}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name={
                      s.type === "Hôpital"
                        ? "medical-outline"
                        : s.type === "Pharmacie"
                        ? "medkit-outline"
                        : "home-outline"
                    }
                    size={20}
                    color={getMarkerColor(s.type)}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.cardTitle}>{s.name}</Text>
                </View>
                <Text style={styles.cardSubtitle}>{s.address}</Text>
                <Text style={styles.cardSubtitle}>{s.distance}</Text>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`
                      )
                    }
                  >
                    <Ionicons name="navigate-outline" size={18} color="#fff" />
                    <Text style={styles.btnText}>Itinéraire</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() => Linking.openURL(`tel:${s.phone}`)}
                  >
                    <Ionicons name="call-outline" size={18} color="#fff" />
                    <Text style={styles.btnText}>Appeler</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      ) : (
        <Text style={{ textAlign: "center", marginTop: 40 }}>
          Impossible de récupérer votre position.
        </Text>
      )}
      <NavPatient />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { width: "100%", height: 250 },
  list: { paddingHorizontal: 16, marginTop: 8 },
  listTitle: { fontSize: 16, color: "#111827", marginBottom: 8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  cardSubtitle: { color: "#6B7280", fontSize: 13 },
  btnRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2ccdd2",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnText: { color: "#fff", marginLeft: 4 },
});
