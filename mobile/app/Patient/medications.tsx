import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import PageContainer from '../../components/PageContainer';

export default function PatientMedicationsScreen() {
  return (
    <PageContainer scroll style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>Médicaments</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Traitements en cours</Text>
        <Text style={styles.text}>Insuline — Matin 8h00</Text>
        <Text style={styles.text}>Lisinopril — Matin 9h00</Text>
        <TouchableOpacity style={styles.btn}><Text style={styles.btnText}>Ajouter un médicament</Text></TouchableOpacity>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, color: '#111827', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, color: '#111827', marginBottom: 6 },
  text: { color: '#374151', marginBottom: 4 },
  btn: { marginTop: 8, backgroundColor: '#2ccdd2', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff' },
});
