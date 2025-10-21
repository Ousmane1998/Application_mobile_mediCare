import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function PatientMeasurementsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>Mesures</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dernières valeurs</Text>
        <Text style={styles.text}>Glycémie: 120 mg/dL</Text>
        <Text style={styles.text}>Pression: 130/85 mmHg</Text>
        <TouchableOpacity style={styles.btn}><Text style={styles.btnText}>Ajouter une mesure</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, color: '#111827', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, color: '#111827', marginBottom: 6 },
  text: { color: '#374151', marginBottom: 4 },
  btn: { marginTop: 8, backgroundColor: '#2ccdd2', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff' },
});
