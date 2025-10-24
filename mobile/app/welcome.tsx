import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen() {
  const router = useRouter();

  const goNext = (target: string) => {
    router.replace(target as any);
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../assets/images/logo_MediCare.png')} style={{width: 350, height: 350}} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Reprenez le contrôle de votre santé.</Text>
        <Text style={styles.subtitle}>
          MediCare vous aide à suivre votre santé et à collaborer avec votre médecin pour
          gérer les maladies chroniques comme le diabète et l'hypertension.
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => goNext('/welcome2')}
        >
          <Text style={styles.primaryBtnText}>Suivant</Text>
        </TouchableOpacity>

      </View>
      
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    color: '#2E2E2E',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    marginBottom: 20,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#2ccdd2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#2ccdd2',
    fontSize: 14,
  },
  dots: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    backgroundColor: '#2ccdd2',
  },
});
