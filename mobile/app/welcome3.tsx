//@ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Welcome3Screen() {
  const router = useRouter();

  const onSkip = async () => {
    try { await AsyncStorage.setItem('hasSeenOnboarding', 'true'); } catch {}
    router.replace('/login');
  };

  const onStart = async () => {
    try { await AsyncStorage.setItem('hasSeenOnboarding', 'true'); } catch {}
    router.replace('/login');
  };

  return (
    <View style={styles.container}>

      <View style={styles.illustration}>
        <Image source={require('../assets/images/graphe.png')} style={{ width: 250, height: 250 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Suivez vos paramètres de santé</Text>
        <Text style={styles.subtitle}>Enregistrez et surveillez vos mesures quotidiennes</Text>
      </View>

      <View style={styles.dots}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onStart}>
        <Text style={styles.primaryBtnText}>Commencer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  illustration: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
    color: '#2E2E2E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
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
  primaryBtn: {
    width: '100%',
    backgroundColor: '#2ccdd2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
  },
});
