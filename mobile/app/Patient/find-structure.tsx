import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import PageContainer from "../../components/PageContainer";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/header";
import NavPatient from "../../components/navPatient";
import { getNearbyStructures } from "../../utils/api";
import {router} from "expo-router";
import { useAppTheme } from "../../theme/ThemeContext";

const { theme } = useAppTheme();

type StructureType = "Hopital" | "Pharmacie" | "Clinique";

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
  const [radius, setRadius] = useState<number>(10);

  const loadStructures = async (lat: number, lng: number, rad: number) => {
    try {
      console.log(`📍 Chargement structures: lat=${lat}, lng=${lng}, radius=${rad}km`);
      const response = await getNearbyStructures(lat, lng, rad);
      console.log(`📊 Réponse API:`, response);
      if (response.structures && Array.isArray(response.structures)) {
        console.log(`✅ ${response.structures.length} structures reçues`);
        response.structures.forEach((s: Structure) => {
          console.log(`  - ${s.nom}: ${s.distance?.toFixed(2) || '?'} km`);
        });
        setStructures(response.structures);
      } else {
        setStructures([]);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des structures:", err);
      alert("Erreur lors du chargement des structures");
    }
  };

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
        await loadStructures(loc.coords.latitude, loc.coords.longitude, radius);
      } catch (err: any) {
        console.error("Erreur lors du chargement des structures:", err);
        alert("Erreur lors du chargement des structures");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Recharger quand le rayon change
  useEffect(() => {
    if (location) {
      loadStructures(location.latitude, location.longitude, radius);
    }
  }, [radius]);

  const getMarkerColor = (type: StructureType) => {
    switch (type) {
      case "Hopital":
        return "red";
      case "Pharmacie":
        return "green";
      case "Clinique":
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
    <PageContainer style={styles.container}>
      <Header />
      <View>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
        </TouchableOpacity>
        <Text style={styles.title}>Trouver une structure</Text>
      </View>
      {location ? (
        <>
          <View style={styles.radiusSelector}>
            <Text style={styles.radiusLabel}>Rayon de recherche:</Text>
            <View style={styles.radiusButtons}>
              {[1, 2, 5, 10].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
                  onPress={() => setRadius(r)}
                >
                  <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>
                    {r} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 16, color: "#111827", marginBottom: 8 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  radiusSelector: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  radiusLabel: { fontSize: 14, color: "#111827", marginBottom: 8 },
  radiusButtons: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  radiusBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#D1D5DB", alignItems: "center" },
  radiusBtnActive: { backgroundColor: "#2ccdd2", borderColor: "#2ccdd2" },
  radiusBtnText: { fontSize: 12, color: "#6B7280" },
  radiusBtnTextActive: { color: "#fff" },
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
