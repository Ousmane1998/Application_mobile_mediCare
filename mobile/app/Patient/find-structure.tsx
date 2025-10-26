import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/header";
import NavPatient from "../../components/navPatient";
import { getNearbyStructures } from "../../utils/api";

type StructureType = "Hopital" | "Pharmacie" | "Poste de santé";

interface Structure {
  _id: string;
  nom: string;
  type: StructureType;
  lat: number;
  lng: number;
  adresse: string;
  tel: string;
  distance: number;
}

export default function FindStructureScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
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

        // Récupérer les structures proches via l'API
        const response = await getNearbyStructures(loc.coords.latitude, loc.coords.longitude, 10);
        
        if (response.structures && Array.isArray(response.structures)) {
          setStructures(response.structures);
        } else {
          setStructures([]);
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement des structures:", err);
        alert("Erreur lors du chargement des structures");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getMarkerColor = (type: StructureType) => {
    switch (type) {
      case "Hopital":
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
                key={s._id}
                coordinate={{ latitude: s.lat, longitude: s.lng }}
                title={s.nom}
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
              <View key={s._id} style={styles.card}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name={
                      s.type === "Hopital"
                        ? "medical-outline"
                        : s.type === "Pharmacie"
                        ? "medkit-outline"
                        : "home-outline"
                    }
                    size={20}
                    color={getMarkerColor(s.type)}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.cardTitle}>{s.nom}</Text>
                </View>
                <Text style={styles.cardSubtitle}>{s.adresse}</Text>
                <Text style={styles.cardSubtitle}>Tel: {s.tel}</Text>
                <Text style={styles.cardSubtitle}>{s.distance.toFixed(1)} km</Text>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`
                      )
                    }
                  >
                    <Ionicons name="navigate-outline" size={18} color="#fff" />
                    <Text style={styles.btnText}>Itinéraire</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() => Linking.openURL(`tel:${s.tel}`)}
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
