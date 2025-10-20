import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";

interface ApiResponse {
  message: string;
}


export default function HomeScreen() {
 const [data, setData] = useState<ApiResponse | null>(null);

  useEffect(() => {
    fetch("http://192.168.1.42:3000/api/test") // ⚠️ remplace par ton IP locale
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.log("Erreur de connexion :", err));
  }, []);

  if (!data) return <ActivityIndicator size="large" color="blue" />;

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 18 }}>{data.message}</Text>
    </View>
  );
}
