import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PatientHealthRecordScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Antécédents médicaux */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="medkit-outline" size={18} color="#10B981" />
            </View>
            <Text style={styles.cardTitle}>Antécédents Médicaux</Text>
          </View>
          <TouchableOpacity><Text style={styles.link}>Voir tout</Text></TouchableOpacity>
        </View>
        <View style={styles.itemRow}>
          <Ionicons name="alert-circle-outline" size={16} color="#6B7280" />
          <Text style={styles.itemText}><Text style={styles.itemLabel}>Allergies</Text> : Penicilline</Text>
        </View>
        <View style={styles.itemRow}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.itemText}><Text style={styles.itemLabel}>Maladies Chroniques</Text> : Diabète de type 2, Hypertension</Text>
        </View>
        <View style={styles.itemRow}>
          <Ionicons name="cut-outline" size={16} color="#6B7280" />
          <Text style={styles.itemText}><Text style={styles.itemLabel}>Chirurgies</Text> : Appendicectomie (2010)</Text>
        </View>
      </View>

      {/* Traitements actuels */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="bandage-outline" size={18} color="#2563EB" />
            </View>
            <Text style={styles.cardTitle}>Traitements Actuels</Text>
          </View>
          <TouchableOpacity><Text style={styles.link}>Voir tout</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.listItem}>
          <View>
            <Text style={styles.listItemTitle}>Metformine</Text>
            <Text style={styles.listItemSub}>500mg, 2 fois par jour</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.listItem}>
          <View>
            <Text style={styles.listItemTitle}>Lisinopril</Text>
            <Text style={styles.listItemSub}>10mg, 1 fois par jour</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Rendez-vous à venir */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="calendar-outline" size={18} color="#059669" />
            </View>
            <Text style={styles.cardTitle}>Rendez-vous à Venir</Text>
          </View>
          <TouchableOpacity><Text style={styles.link}>Voir tout</Text></TouchableOpacity>
        </View>

        <View style={styles.appointmentRow}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateDay}>LUN</Text>
            <Text style={styles.dateNum}>28</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle}>Dr. Dubois (Cardiologue)</Text>
            <Text style={styles.appSub}>10:30 — Suivi annuel{"\n"}Hôpital Central</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, color: '#111827', fontWeight: '600' },
  link: { color: '#10B981', fontWeight: '600' },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  itemLabel: { fontWeight: '600', color: '#111827' },
  itemText: { color: '#374151', flex: 1, flexWrap: 'wrap' },

  listItem: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listItemTitle: { color: '#111827', fontWeight: '600' },
  listItemSub: { color: '#6B7280', marginTop: 2 },

  appointmentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  dateBadge: { width: 44, borderRadius: 12, backgroundColor: '#ECFDF5', alignItems: 'center', paddingVertical: 6 },
  dateDay: { color: '#059669', fontSize: 12, fontWeight: '700' },
  dateNum: { color: '#059669', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  appTitle: { color: '#111827', fontWeight: '600' },
  appSub: { color: '#6B7280', marginTop: 2 },
});
