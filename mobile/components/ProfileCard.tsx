import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileRowProps {
  icon: ReactNode;
  label: string;
  value?: string;
}

function ProfileRow({ icon, label, value }: ProfileRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!value && <Text style={styles.rowValue}>{value}</Text>}
      </View>
    </View>
  );
}

interface ProfileCardProps {
  title: string;
  onEdit?: () => void;
  children: ReactNode;
  containerStyle?: ViewStyle;
}

export default function ProfileCard({ title, onEdit, children, containerStyle }: ProfileCardProps) {
  return (
    <View style={[styles.card, containerStyle]}> 
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {onEdit ? (
          <TouchableOpacity onPress={onEdit}>
            <Text style={styles.editText}>Modifier</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View>{children}</View>
    </View>
  );
}

export { ProfileRow };

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, color: '#111827', fontWeight: '600' },
  editText: { color: '#10B981', fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowLeft: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 12, color: '#6B7280' },
  rowValue: { fontSize: 14, color: '#111827', marginTop: 2 },
});
