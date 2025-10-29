// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert, Share, Platform } from 'react-native';
import PageContainer from '../../components/PageContainer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getMyHealthRecord, getMedecins, type HealthRecord, type AppUser, createNotification, getProfile, ORG_NAME, ORG_LOGO, SECURE_FICHE_BASE, createFicheShareToken, SOCKET_URL, getMeasuresHistory, getOrdonnances } from '../../utils/api';
import * as Print from 'expo-print';
import { useAppTheme } from '../../theme/ThemeContext';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function PatientHealthRecordScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rec, setRec] = useState<HealthRecord | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [measures, setMeasures] = useState<any[]>([]);
  const [ordonnances, setOrdonnances] = useState<any[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [doctors, setDoctors] = useState<AppUser[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        // Charger le profil patient
        const prof = await getProfile();
        setProfile(prof.user);
        
        // Charger la fiche de santé
        const r = await getMyHealthRecord();
        setRec(r);
        
        // Charger les dernières mesures
        if (prof.user._id) {
          try {
            const hist = await getMeasuresHistory(prof.user._id);
            setMeasures(Array.isArray(hist) ? hist.slice(0, 4) : []);
          } catch {}
        }
        
        // Charger les ordonnances
        try {
          const ord = await getOrdonnances();
          console.log('📋 [health-record] Ordonnances reçues:', ord);
          setOrdonnances(Array.isArray(ord) ? ord : []);
        } catch (e: any) {
          console.error('❌ [health-record] Erreur ordonnances:', e?.message);
          // Si l'endpoint n'existe pas, on affiche un message mais on continue
          if (e?.status === 404) {
            console.log('ℹ️ Endpoint ordonnances non disponible');
          }
          setOrdonnances([]);
        }

      } catch (e: any) {
        setError(e?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const list = await getMedecins();
        setDoctors(Array.isArray(list) ? list : []);
      } catch {}
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 8, color: theme.colors.muted }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <PageContainer scroll style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fiche de patient</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Ionicons name="person-circle-outline" size={32} color="#2ccdd2" />
        </View>
      </View>

      {/* Informations Patient */}
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Informations patient</Text>
          <Text style={styles.idBadge}>ID: {profile?._id?.slice(-3) || '123'}</Text>
        </View>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Nom complet</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{profile?.prenom} {profile?.nom}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Âge</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {profile?.dateNaissance ? Math.floor((new Date().getTime() - new Date(profile.dateNaissance).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : '—'} ans
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Téléphone</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{profile?.telephone || '—'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Sexe</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{profile?.sexe || '—'}</Text>
          </View>
        </View>

        {profile?.pathologie && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.infoLabel}>Conditions médicales</Text>
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{profile.pathologie}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Dernières Mesures */}
      {measures.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Dernières mesures</Text>
          {measures.map((m, i) => (
            <View key={i} style={styles.measureRow}>
              <View>
                <Text style={[styles.measureType, { color: theme.colors.text }]}>{m.type || 'Mesure'}</Text>
                <Text style={styles.measureDate}>{m._ts ? new Date(m._ts).toLocaleDateString() : '—'}</Text>
              </View>
              <Text style={styles.measureValue}>{m.value || '—'}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Traitement Actuel - Ordonnances */}
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Traitement actuel</Text>
        {ordonnances && ordonnances.length > 0 ? (
          ordonnances.map((ord, i) => (
            <View key={i} style={styles.treatmentItem}>
              {ord.medicaments && Array.isArray(ord.medicaments) ? (
                ord.medicaments.map((med: any, j: number) => (
                  <View key={j} style={{ marginBottom: j < ord.medicaments.length - 1 ? 8 : 0 }}>
                    <Text style={[styles.treatmentName, { color: theme.colors.text }]}>
                      {med.nom || med.medicament || 'Médicament'}
                    </Text>
                    <Text style={styles.treatmentDose}>
                      {med.dosage ? `${med.dosage} - ` : ''}{med.frequence || 'À déterminer'}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.treatmentName, { color: theme.colors.text }]}>Ordonnance du {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : '—'}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={[styles.treatmentName, { color: theme.colors.muted }]}>Aucune ordonnance</Text>
        )}
      </View>

      {/* Antécédents Médicaux */}
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Antécédents médicaux</Text>
        {rec?.antecedents && rec.antecedents.length > 0 ? (
          rec.antecedents.map((a, i) => (
            <View key={i} style={styles.antecedentItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={[styles.antecedentText, { color: theme.colors.text }]}>{a}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.antecedentText, { color: theme.colors.muted }]}>Aucun antécédent renseigné</Text>
        )}
      </View>

      {error ? <Text style={{ color: '#DC2626' }}>{error}</Text> : null}

      {/* Boutons d'action */}
      <View style={{ height: 12 }} />
      <TouchableOpacity style={styles.qrBtn} onPress={() => setShareOpen(true)}>
        <Ionicons name="qr-code-outline" size={20} color="#111827" />
        <Text style={styles.qrBtnText}>Générer QR Code</Text>
      </TouchableOpacity>

      <View style={{ height: 8 }} />
      <TouchableOpacity disabled={exporting} style={[styles.exportBtn, { opacity: exporting ? 0.7 : 1 }]} onPress={async () => {
        try {
          setExporting(true);
          const prof = await getProfile();
          const fullName = `${prof.user.prenom || ''} ${prof.user.nom || ''}`.trim();
          const patientId = (prof.user as any)._id || (prof.user as any).id;
          const now = new Date();
          let shareUrl = '';
          try {
            const tok = await createFicheShareToken();
            shareUrl = `${SOCKET_URL.replace(/\/$/, '')}/public/fiche?token=${encodeURIComponent(tok.token)}`;
          } catch {}
          const fallbackUrl = SECURE_FICHE_BASE ? `${SECURE_FICHE_BASE.replace(/\/$/, '')}/fiches/${encodeURIComponent(patientId)}` : '';
          const finalUrl = shareUrl || fallbackUrl;
          const qrImg = finalUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(finalUrl)}` : '';
          const h = `<html><head><meta charset="utf-8" /><style>@page { margin: 24px; } body { font-family: Arial, sans-serif; padding: 0; } h1 { font-size: 20px; margin: 16px 0; } .label { color: #374151; font-weight: bold; margin-top: 8px; } ul { margin: 6px 0 0 18px; }</style></head><body><h1>Fiche de santé — ${fullName}</h1><div class="label">Groupe sanguin</div><div>${rec?.groupeSanguin || '—'}</div></body></html>`;
          const { uri } = await Print.printToFileAsync({ html: h });
          const safeName = fullName.replace(/[^a-z0-9 _-]/gi, '_') || 'Patient';
          const fileName = `Fiche_${safeName}_${now.toISOString().replace(/[:.]/g, '-')}.pdf`;
          const dest = `${FileSystem.cacheDirectory}${fileName}`;
          try { await FileSystem.copyAsync({ from: uri, to: dest }); } catch {}
          const shareUri = (await FileSystem.getInfoAsync(dest)).exists ? dest : uri;
          if (Platform.OS === 'ios') {
            await Share.share({ url: shareUri, title: fileName });
          } else {
            const avail = await Sharing.isAvailableAsync();
            if (avail) await Sharing.shareAsync(shareUri, { mimeType: 'application/pdf', dialogTitle: fileName });
            else await Share.share({ message: shareUri, title: fileName });
          }
        } catch (e: any) {
          Alert.alert('Erreur', e?.message || 'Export impossible');
        } finally {
          setExporting(false);
        }
      }}>
        <Ionicons name="document-outline" size={20} color="#fff" />
        <Text style={styles.exportText}>{exporting ? 'Génération…' : 'Exporter en PDF'}</Text>
      </TouchableOpacity>

      <View style={{ height: 8 }} />
      <TouchableOpacity style={styles.shareBtn} onPress={() => setShareOpen(true)}>
        <Ionicons name="share-social-outline" size={20} color="#fff" />
        <Text style={styles.shareText}>Partager</Text>
      </TouchableOpacity>
    </PageContainer>
    
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 20, color: '#111827', fontWeight: '700' },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E0F7F6', alignItems: 'center', justifyContent: 'center' },
  
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 16, color: '#111827', fontWeight: '600' },
  idBadge: { fontSize: 12, color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  
  infoGrid: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginBottom: 4 },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600' },
  
  conditionBadge: { backgroundColor: '#1F2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginTop: 8 },
  conditionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  
  measureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  measureType: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  measureDate: { fontSize: 12, color: '#6B7280' },
  measureValue: { fontSize: 16, color: '#2ccdd2', fontWeight: '700' },
  
  treatmentItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  treatmentName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  treatmentDose: { fontSize: 12, color: '#6B7280' },
  
  antecedentItem: { flexDirection: 'row', gap: 8, paddingVertical: 8 },
  bulletPoint: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  antecedentText: { fontSize: 14, flex: 1, flexWrap: 'wrap' },
  
  qrBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  qrBtnText: { color: '#111827', fontWeight: '600', fontSize: 14 },
  
  exportBtn: { backgroundColor: '#2ccdd2', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  exportText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  
  shareBtn: { backgroundColor: '#2ccdd2', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
