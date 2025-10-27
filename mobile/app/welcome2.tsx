import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import PageContainer from '../components/PageContainer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Welcome2Screen() {
  const router = useRouter();

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch {}
    router.replace('/login');
  };

  return (
    <PageContainer style={styles.container}>
      <View style={styles.illustration}>
        <Image source={require('../assets/images/medicare chat.png')} style={{width: 250, height: 250}} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Communiquez directement avec votre médecin</Text>
        <Text style={styles.subtitle}>
          Obtenez des réponses rapides, planifiez facilement des rendez-vous et partagez vos données en toute sécurité.
        </Text>

        <View style={styles.bullet}>
          <Ionicons name="calendar-outline" size={18} color="#2ccdd2" />
          <View style={styles.bulletTextWrap}>
            <Text style={styles.bulletTitle}>Planifiez des rendez-vous facilement</Text>
            <Text style={styles.bulletText}>Consultez les disponibilités de votre médecin et prenez rendez-vous en quelques clics.</Text>
          </View>
        </View>

        <View style={styles.bullet}>
          <Ionicons name="lock-closed-outline" size={18} color="#2ccdd2" />
          <View style={styles.bulletTextWrap}>
            <Text style={styles.bulletTitle}>Partagez vos données en toute sécurité</Text>
            <Text style={styles.bulletText}>Vos informations de santé sont chiffrées et protégées.</Text>
          </View>
        </View>
      </View>

        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
    </PageContainer>
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
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  bulletIcon: {
    fontSize: 18,
    color: '#2ccdd2',
    marginTop: 2,
  },
  bulletTextWrap: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 2,
  },
  bulletText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  dots: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
