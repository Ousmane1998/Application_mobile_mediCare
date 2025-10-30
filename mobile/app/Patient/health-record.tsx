// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert, Share, Platform } from 'react-native';
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
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [doctors, setDoctors] = useState<AppUser[]>([]);
  const [exporting, setExporting] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

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
        try {
          const p = await getProfile();
          setProfile(p?.user || null);
        } catch {}
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Ma fiche de santé</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}> 
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#E0F2FE' }]}> 
              <Ionicons name="person-outline" size={18} color="#0284C7" />
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Informations médicales</Text>
          </View>
        </View>
        <View style={styles.itemRow}>
          <Ionicons name="male-female-outline" size={16} color="#6B7280" />
          <Text style={[styles.itemText, { color: theme.colors.text }]}>
            <Text style={[styles.itemLabel, { color: theme.colors.text }]}>Sexe</Text> : {profile?.sexe || '—'}
          </Text>
        </View>
        <View style={styles.itemRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={[styles.itemText, { color: theme.colors.text }]}>
            <Text style={[styles.itemLabel, { color: theme.colors.text }]}>Date de naissance</Text> : {profile?.dateNaissance ? new Date(profile.dateNaissance as any).toLocaleDateString() : '—'}
          </Text>
        </View>
        <View style={styles.itemRow}>
          <Ionicons name="fitness-outline" size={16} color="#6B7280" />
          <Text style={[styles.itemText, { color: theme.colors.text }]}>
            <Text style={[styles.itemLabel, { color: theme.colors.text }]}>Poids</Text> : {profile?.poids ? `${profile.poids} kg` : '—'}
          </Text>
        </View>
        <View style={styles.itemRow}>
          <Ionicons name="body-outline" size={16} color="#6B7280" />
          <Text style={[styles.itemText, { color: theme.colors.text }]}>
            <Text style={[styles.itemLabel, { color: theme.colors.text }]}>Taille</Text> : {profile?.taille ? `${profile.taille} cm` : '—'}
          </Text>
        </View>
        <View style={styles.itemRow}>
          <Ionicons name="analytics-outline" size={16} color="#6B7280" />
          <Text style={[styles.itemText, { color: theme.colors.text }]}>
            <Text style={[styles.itemLabel, { color: theme.colors.text }]}>IMC</Text> : {(() => {
              const p = Number(profile?.poids);
              const t = Number(profile?.taille);
              if (!p || !t) return '—';
              const imc = p / Math.pow(t/100, 2);
              return `${imc.toFixed(1)}`;
            })()}
          </Text>
        </View>
        <View style={styles.itemRow}>
          <Ionicons name="medkit-outline" size={16} color="#6B7280" />
          <Text style={[styles.itemText, { color: theme.colors.text }]}>
            <Text style={[styles.itemLabel, { color: theme.colors.text }]}>Pathologie principale</Text> : {profile?.pathologie || '—'}
          </Text>
        </View>
        <View style={styles.itemRow}>
          <Ionicons name="call-outline" size={16} color="#6B7280" />
          <Text style={[styles.itemText, { color: theme.colors.text }]}>
            <Text style={[styles.itemLabel, { color: theme.colors.text }]}>Téléphone</Text> : {profile?.telephone || '—'}
          </Text>
        </View>
        <View style={styles.itemRow}>
          <Ionicons name="mail-outline" size={16} color="#6B7280" />
          <Text style={[styles.itemText, { color: theme.colors.text }]}>
            <Text style={[styles.itemLabel, { color: theme.colors.text }]}>Email</Text> : {profile?.email || '—'}
          </Text>
        </View>
        <View style={styles.itemRow}>
          <Ionicons name="home-outline" size={16} color="#6B7280" />
          <Text style={[styles.itemText, { color: theme.colors.text }]}>
            <Text style={[styles.itemLabel, { color: theme.colors.text }]}>Adresse</Text> : {profile?.adresse || '—'}
          </Text>
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#FEF9C3' }]}>
              <Ionicons name="water-outline" size={18} color="#CA8A04" />
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Profil sanguin</Text>
          </View>
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
      <TouchableOpacity style={styles.qrBtn} onPress={async () => {
        try {
          const prof = await getProfile();
          const patientId = (prof.user as any)._id || (prof.user as any).id;
          
          console.log('🔄 Génération du QR Code pour patient:', patientId);
          
          // Générer l'URL de partage
          let shareUrl = '';
          try {
            const tok = await createFicheShareToken(patientId);
            shareUrl = `${SOCKET_URL.replace(/\/$/, '')}/public/fiche?token=${encodeURIComponent(tok.token)}`;
            console.log('✅ URL de partage générée:', shareUrl);
          } catch (e: any) {
            console.warn('⚠️ Erreur création token:', e?.message);
          }
          
          // Fallback URL
          const fallbackUrl = SECURE_FICHE_BASE ? `${SECURE_FICHE_BASE.replace(/\/$/, '')}/fiches/${encodeURIComponent(patientId)}` : '';
          const finalUrl = shareUrl || fallbackUrl || `${SOCKET_URL}/patient/${patientId}/fiche`;
          
          console.log('📱 URL finale pour QR Code:', finalUrl);
          
          // Générer le QR Code
          const qrUrl = finalUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(finalUrl)}` : '';
          console.log('🔲 QR Code URL:', qrUrl);
          
          setQrCodeUrl(qrUrl);
          setShareOpen(true);
        } catch (e: any) {
          console.error('❌ Erreur QR Code:', e);
          Alert.alert('Erreur', e?.message || 'Impossible de générer le QR Code');
        }
      }}>
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
          const h = `<html><head><meta charset="utf-8" /><style>@page { margin: 24px; } body { font-family: Arial, sans-serif; padding: 0; } h1 { font-size: 20px; margin: 16px 0; } .label { color: #374151; font-weight: bold; margin-top: 8px; } ul { margin: 6px 0 0 18px; }</style></head><body><h1>Fiche de santé — ${fullName}</h1><div class="label">Groupe sanguin</div><div>${rec?.groupeSanguin || '—'}</div><div class="label">Informations patient</div><div>Nom: ${fullName}</div><div>Âge: ${profile?.dateNaissance ? Math.floor((new Date().getTime() - new Date(profile.dateNaissance).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : '—'} ans</div><div>Téléphone: ${profile?.telephone || '—'}</div><div class="label">QR Code</div><img src="${qrImg}" style="width: 140px; height: 140px;" /></body></html>`;
          const { uri } = await Print.printToFileAsync({ html: h });
          const safeName = fullName.replace(/[^a-z0-9 _-]/gi, '_') || 'Patient';
          const fileName = `Fiche_${safeName}_${now.toISOString().replace(/[:.]/g, '-')}.pdf`;
          
          // Utiliser directement l'URI généré par Print
          if (Platform.OS === 'ios') {
            await Share.share({ url: uri, title: fileName });
          } else {
            const avail = await Sharing.isAvailableAsync();
            if (avail) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: fileName });
            else await Share.share({ message: uri, title: fileName });
          }
          Alert.alert('Succès', 'PDF généré et prêt à partager');
        } catch (e: any) {
          console.error('❌ Erreur export:', e);
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
    </ScrollView>
    
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 20, color: '#111827', fontWeight: '700',marginTop:40 },
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

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  qrSection: { alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  qrTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  qrContainer: { alignItems: 'center', marginBottom: 12 },
  qrBox: { width: 140, height: 140, backgroundColor: '#F0FFFE', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#2ccdd2' },
  qrSubtitle: { fontSize: 12, color: '#6B7280', textAlign: 'center' },

  shareSection: { marginBottom: 20 },
  shareTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  doctorsList: { maxHeight: 200 },
  doctorItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 12 },
  doctorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2ccdd2', alignItems: 'center', justifyContent: 'center' },
  doctorInitials: { color: '#fff', fontWeight: '700', fontSize: 14 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  doctorEmail: { fontSize: 12, color: '#6B7280' },

  closeBtn: { backgroundColor: '#2ccdd2', borderRadius: 12, padding: 14, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
