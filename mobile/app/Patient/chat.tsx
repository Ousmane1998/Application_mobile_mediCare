import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Snackbar from '../../components/Snackbar';
import { getProfile, sendMessage, type UserProfile } from '../../utils/api';

export default function PatientChatScreen() {
  const [me, setMe] = useState<UserProfile | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'info' });

  useEffect(() => {
    (async () => {
      try { const data = await getProfile(); setMe(data.user); } catch (e: any) { setSnack({ visible: true, message: e?.message || 'Erreur de chargement', type: 'error' }); }
    })();
  }, []);

  const onSend = async () => {
    if (!me?.id) { setSnack({ visible: true, message: 'Profil non chargé.', type: 'error' }); return; }
    if (!doctorId) { setSnack({ visible: true, message: 'Saisir l\'ID du médecin.', type: 'error' }); return; }
    if (!text.trim()) { setSnack({ visible: true, message: 'Saisir un message.', type: 'error' }); return; }
    try {
      setSending(true);
      await sendMessage({ senderId: me.id, receiverId: doctorId, text });
      setText('');
      setSnack({ visible: true, message: 'Message envoyé.', type: 'success' });
    } catch (e: any) {
      setSnack({ visible: true, message: e?.message || 'Erreur lors de l\'envoi', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>Chat avec mon médecin</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nouveau message</Text>
        <View style={{ gap: 10 }}>
          <View>
            <Text style={styles.label}>ID Médecin</Text>
            <TextInput style={styles.input} value={doctorId} onChangeText={setDoctorId} placeholder="6528b5e8b21f4c001f7a12a4" />
          </View>
          <View>
            <Text style={styles.label}>Message</Text>
            <TextInput style={[styles.input, { minHeight: 80 }]} value={text} onChangeText={setText} multiline placeholder="Votre message…" />
          </View>
          <TouchableOpacity style={[styles.primaryBtn, sending && { opacity: 0.7 }]} onPress={onSend} disabled={sending}>
            <Text style={styles.primaryBtnText}>{sending ? 'Envoi…' : 'Envoyer'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Snackbar visible={snack.visible} message={snack.message} type={snack.type} onHide={() => setSnack((s) => ({ ...s, visible: false }))} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, color: '#111827', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, color: '#111827', marginBottom: 6 },
  text: { color: '#374151' },
  label: { fontSize: 13, color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  primaryBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
});
