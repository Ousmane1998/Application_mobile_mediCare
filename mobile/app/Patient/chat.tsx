import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function PatientChatScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>Chat</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Conversations</Text>
        <Text style={styles.text}>Aucune conversation récente. Démarrez un nouveau chat depuis un rendez-vous ou une alerte.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, color: '#111827', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, color: '#111827', marginBottom: 6 },
  text: { color: '#374151' },
});
