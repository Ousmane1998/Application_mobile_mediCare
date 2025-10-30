// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getMyHealthRecord, getMedecins, type HealthRecord, type AppUser, createNotification, getProfile, ORG_NAME, ORG_LOGO, SECURE_FICHE_BASE, createFicheShareToken, SOCKET_URL } from '../../utils/api';
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

  useEffect(() => {
    (async () => {
      try {
        setError(null);
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
        <View style={styles.itemRow}>
          <Ionicons name="rainy-outline" size={16} color="#6B7280" />
          <Text style={[styles.itemText, { color: theme.colors.text }]}><Text style={[styles.itemLabel, { color: theme.colors.text }]}>Groupe sanguin</Text> : {rec?.groupeSanguin || '—'}</Text>
        </View>
        <View style={styles.itemRow}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={[styles.itemText, { color: theme.colors.text }]}><Text style={[styles.itemLabel, { color: theme.colors.text }]}>Dernière mise à jour</Text> : {rec?.derniereMiseAJour ? new Date(rec.derniereMiseAJour).toLocaleString() : '—'}</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="warning-outline" size={18} color="#059669" />
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Allergies</Text>
          </View>
        </View>
        {(rec?.allergies && rec.allergies.length > 0) ? (
          rec.allergies.map((a, i) => (
            <View key={`${a}_${i}`} style={styles.itemRow}>
              <Ionicons name="alert-circle-outline" size={16} color="#6B7280" />
              <Text style={[styles.itemText, { color: theme.colors.text }]}>{a}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.itemText, { color: theme.colors.text }]}>Aucune allergie renseignée</Text>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="medkit-outline" size={18} color="#2563EB" />
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Maladies</Text>
          </View>
        </View>
        {(rec?.maladies && rec.maladies.length > 0) ? (
          rec.maladies.map((m, i) => (
            <View key={`${m}_${i}`} style={styles.itemRow}>
              <Ionicons name="pulse-outline" size={16} color="#6B7280" />
              <Text style={[styles.itemText, { color: theme.colors.text }]}>{m}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.itemText, { color: theme.colors.text }]}>Aucune maladie renseignée</Text>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="bandage-outline" size={18} color="#4F46E5" />
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Traitements</Text>
          </View>
        </View>
        {(rec?.traitements && rec.traitements.length > 0) ? (
          rec.traitements.map((t, i) => (
            <View key={`${t}_${i}`} style={[styles.listItem, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }] }>
              <View>
                <Text style={[styles.listItemTitle, { color: theme.colors.text }]}>{t}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </View>
          ))
        ) : (
          <Text style={[styles.itemText, { color: theme.colors.text }]}>Aucun traitement renseigné</Text>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#FDE68A' }]}>
              <Ionicons name="book-outline" size={18} color="#CA8A04" />
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Antécédents</Text>
          </View>
        </View>
        {(rec?.antecedents && rec.antecedents.length > 0) ? (
          rec.antecedents.map((t, i) => (
            <View key={`${t}_${i}`} style={styles.itemRow}>
              <Ionicons name="document-text-outline" size={16} color="#6B7280" />
              <Text style={[styles.itemText, { color: theme.colors.text }]}>{t}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.itemText, { color: theme.colors.text }]}>Aucun antécédent renseigné</Text>
        )}
      </View>

      {error ? <Text style={{ color: '#DC2626' }}>{error}</Text> : null}

      <View style={{ height: 12 }} />
      <TouchableOpacity style={[styles.shareBtn, { backgroundColor: theme.colors.primary }]} onPress={() => setShareOpen(true)}>
        <Ionicons name="share-social-outline" size={20} color="#fff" />
        <Text style={[styles.shareText, { color: theme.colors.primaryText }]}>Partager ma fiche avec un médecin</Text>
      </TouchableOpacity>

      <View style={{ height: 8 }} />
      <TouchableOpacity disabled={exporting} style={[styles.exportBtn, { backgroundColor: theme.colors.primary }, exporting && { opacity: 0.7 }]} onPress={async () => {
        try {
          setExporting(true);
          const prof = await getProfile();
          const fullName = `${prof.user.prenom || ''} ${prof.user.nom || ''}`.trim();
          const patientId = (prof.user as any)._id || (prof.user as any).id;
          const now = new Date();
          // Générer un token de partage 24h et construire l’URL publique
          let shareUrl = '';
          try {
            const tok = await createFicheShareToken();
            shareUrl = `${SOCKET_URL.replace(/\/$/, '')}/public/fiche?token=${encodeURIComponent(tok.token)}`;
          } catch {}
          const fallbackUrl = SECURE_FICHE_BASE ? `${SECURE_FICHE_BASE.replace(/\/$/, '')}/fiches/${encodeURIComponent(patientId)}` : '';
          const finalUrl = shareUrl || fallbackUrl;
          const qrImg = finalUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(finalUrl)}` : '';
          const h = `
            <html>
              <head>
                <meta charset="utf-8" />
                <style>
                  @page { margin: 24px; }
                  body { font-family: Arial, sans-serif; padding: 0; position: relative; }
                  header { display: flex; justify-content: space-between; align-items: center; padding: 8px 0 12px; border-bottom: 1px solid #e5e7eb; }
                  .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; color: #0ea5e9; font-size: 14px; }
                  .brand img { height: 24px; }
                  .meta { color: #6b7280; font-size: 12px; }
                  h1 { font-size: 20px; margin: 16px 0 0; }
                  .sec { margin-top: 16px; }
                  .label { color: #374151; font-weight: bold; margin-top: 8px; }
                  ul { margin: 6px 0 0 18px; }
                  .watermark {
                    position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(-30deg);
                    color: rgba(0,0,0,0.06); font-size: 64px; font-weight: 700; pointer-events: none; z-index: 0;
                  }
                  .content { position: relative; z-index: 1; }
                  .qr { margin-top: 16px; display: flex; align-items: center; gap: 12px; }
                  .muted { color: #6b7280; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="watermark">${ORG_NAME || 'MediCare'}</div>
                <header>
                  <div class="brand">
                    ${ORG_LOGO ? `<img src="${ORG_LOGO}" />` : ''}
                    <span>${ORG_NAME || 'MediCare'}</span>
                  </div>
                  <div class="meta">Généré le ${now.toLocaleDateString()} ${now.toLocaleTimeString()}</div>
                </header>
                <div class="content">
                  <h1>Fiche de santé — ${fullName || 'Patient'}</h1>
                  <div class="sec">
                    <div class="label">Groupe sanguin</div>
                    <div>${rec?.groupeSanguin || '—'}</div>
                    <div class="label">Dernière mise à jour</div>
                    <div>${rec?.derniereMiseAJour ? new Date(rec.derniereMiseAJour).toLocaleString() : '—'}</div>
                  </div>
                  <div class="sec">
                    <div class="label">Allergies</div>
                    <ul>
                      ${(rec?.allergies || []).map((a) => `<li>${a}</li>`).join('') || '<li>Aucune</li>'}
                    </ul>
                  </div>
                  <div class="sec">
                    <div class="label">Maladies</div>
                    <ul>
                      ${(rec?.maladies || []).map((m) => `<li>${m}</li>`).join('') || '<li>Aucune</li>'}
                    </ul>
                  </div>
                  <div class="sec">
                    <div class="label">Traitements</div>
                    <ul>
                      ${(rec?.traitements || []).map((t) => `<li>${t}</li>`).join('') || '<li>Aucun</li>'}
                    </ul>
                  </div>
                  <div class="sec">
                    <div class="label">Antécédents</div>
                    <ul>
                      ${(rec?.antecedents || []).map((t) => `<li>${t}</li>`).join('') || '<li>Aucun</li>'}
                    </ul>
                  </div>
                  ${qrImg ? `<div class="sec"><div class="label">Accès sécurisé</div><div class="qr"><img src="${qrImg}" /><div class="muted">Scannez pour accéder à la fiche sécurisée</div></div></div>` : ''}
                </div>
              </body>
            </html>
          `;
          const { uri } = await Print.printToFileAsync({ html: h });
          // Renommer le fichier avec un nom parlant (cela n’ajoute pas de métadonnées PDF, mais aide au partage)
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
        <Text style={[styles.exportText, { color: theme.colors.primaryText }]}>{exporting ? 'Génération…' : 'Exporter en PDF'}</Text>
      </TouchableOpacity>
    </ScrollView>
    
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16 },
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
  shareBtn: { backgroundColor: '#2563EB', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, color: '#111827', marginBottom: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  optionText: { color: '#111827' },
});
