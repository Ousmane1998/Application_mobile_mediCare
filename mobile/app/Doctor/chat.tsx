import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Platform,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons, Entypo } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { getProfile, getMessages, sendMessage, setTypingStatus, markMessageAsRead, deleteViewOnceMessage } from "../../utils/api";
import { useAppTheme } from "../../theme/ThemeContext";
import { useLocalSearchParams } from "expo-router";
import { Audio } from 'expo-av';

type RootStackParamList = {
  Chat: { patientId: string; patientName: string };
};

type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Chat">;
type ChatScreenRouteProp = RouteProp<RootStackParamList, "Chat">;

type Props = {
  navigation: ChatScreenNavigationProp;
  route: ChatScreenRouteProp;
};

type Message = {
  _id?: string;
  id?: string;
  text: string;
  senderId: string;
  receiverId: string;
  sender: "user" | "patient";
  createdAt: string;
};

const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = useAppTheme();
  const searchParams = useLocalSearchParams();
  const patientId = (searchParams?.patientId as string) || (route?.params?.patientId as string) || "";
  const patientName = (searchParams?.patientName as string) || (route?.params?.patientName as string) || "Patient";
  
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [playingProgress, setPlayingProgress] = useState(0);
  const listRef = useRef<FlatList<Message> | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const recordingIntervalRef = useRef<any>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Validation helpers for message input
  const sanitize = (s: string) => String(s || '').replace(/[\t\n\r]+/g, ' ').trim();
  const hasDanger = (s: string) => /[<>]/.test(String(s || ''));
  const isValidMsg = (s: string) => {
    const t = sanitize(s);
    return !!t && !hasDanger(t) && t.length <= 1000;
  };
  const inputInvalid = (() => {
    const t = sanitize(messageText);
    if (t.length === 0) return false;
    return hasDanger(t) || t.length > 1000;
  })();

  // Charger le profil du médecin et les messages
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Récupérer le profil du médecin
        const { user } = await getProfile();
        setDoctor(user);
        console.log("👨‍⚕️ Médecin :", user._id);
        console.log("👤 Patient :", patientId);

        // Charger les messages
        const msgs = await getMessages(user._id, patientId);
        console.log("💬 Messages chargés :", msgs.length);

        // Mapper les messages
        const mappedMessages = msgs.map((msg: any) => ({
          ...msg,
          sender: msg.senderId === user._id ? "user" : "patient",
        }));
        
        // Log pour déboguer les messages vocaux
        const voiceMessages = mappedMessages.filter((m: any) => m.type === 'voice');
        if (voiceMessages.length > 0) {
          console.log('🎵 Messages vocaux reçus:', voiceMessages.length);
          voiceMessages.forEach((m: any) => {
            console.log(`  - ID: ${m._id}, voiceUrl: ${m.voiceUrl}, duration: ${m.voiceDuration}`);
          });
        }
        
        setMessages(mappedMessages);
      } catch (err: any) {
        console.error("❌ Erreur chargement :", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [patientId]);

  // scroll to end when messages change
  useEffect(() => {
    const t = setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollToEnd({ animated: true });
      }
    }, 80);
    return () => clearTimeout(t);
  }, [messages]);

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const handleSend = async () => {
    if (!doctor) return;
    const text = sanitize(messageText);
    if (!isValidMsg(text)) { setInputError('Message invalide.'); return; }

    setSending(true);
    try {
      // Notifier que l'utilisateur a arrêté d'écrire
      await setTypingStatus(patientId, false).catch(() => {});

      // Envoyer le message
      const newMsg = await sendMessage({
        senderId: doctor._id,
        receiverId: patientId,
        text,
        isViewOnce,
      });

      console.log("✅ Message envoyé :", newMsg._id);

      // Ajouter le message à la liste
      const msgToAdd: Message = {
        _id: newMsg._id,
        text: newMsg.text,
        senderId: newMsg.senderId,
        receiverId: newMsg.receiverId,
        sender: "user",
        createdAt: newMsg.createdAt,
        ...(newMsg as any),
      };

      setMessages((prev) => [...prev, msgToAdd]);
      setMessageText("");
      setInputError(null);
      setIsViewOnce(false);
    } catch (err: any) {
      console.error("❌ Erreur envoi :", err.message);
    } finally {
      setSending(false);
    }
  };

  // Envoyer un message vocal
  const handleSendVoice = async (voiceUrl: string, duration: number) => {
    if (!doctor) return;

    setSending(true);
    try {
      // Convertir le fichier audio en base64 pour l'envoyer
      let audioData = voiceUrl;
      if (voiceUrl && voiceUrl.startsWith('file://')) {
        try {
          const base64 = await (FileSystem as any).readAsStringAsync(voiceUrl, {
            encoding: (FileSystem as any).EncodingType.Base64,
          });
          audioData = `data:audio/m4a;base64,${base64}`;
          console.log('✅ Fichier audio converti en base64');
        } catch (err: any) {
          console.error('⚠️ Erreur conversion base64:', err.message);
          // Continuer avec l'URL originale si la conversion échoue
        }
      }

      const newMsg = await sendMessage({
        senderId: doctor._id,
        receiverId: patientId,
        type: 'voice',
        voiceUrl: audioData,
        voiceDuration: duration,
        isViewOnce,
      });

      console.log("✅ Message vocal envoyé :", newMsg._id);

      const msgToAdd: Message = {
        _id: newMsg._id,
        text: '',
        senderId: newMsg.senderId,
        receiverId: newMsg.receiverId,
        sender: "user",
        createdAt: newMsg.createdAt,
        ...(newMsg as any),
      };

      setMessages((prev) => [...prev, msgToAdd]);
      setIsViewOnce(false);
      setShowVoiceModal(false);
    } catch (err: any) {
      console.error("❌ Erreur envoi vocal :", err.message);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message vocal');
    } finally {
      setSending(false);
    }
  };

  // Démarrer l'enregistrement
  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  // Arrêter l'enregistrement
  const stopRecording = () => {
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  // Jouer un message vocal
  const playVoiceMessage = async (messageId: string, voiceUrl: string, message?: any) => {
    try {
      if (playingMessageId === messageId) {
        // Arrêter la lecture
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        setPlayingMessageId(null);
        setPlayingProgress(0);
        return;
      }

      // Arrêter la lecture précédente
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }

      // Charger et jouer le nouveau message
      if (!voiceUrl || voiceUrl.trim() === '') {
        console.error('❌ URL du message vocal invalide:', voiceUrl);
        console.error('📋 Message complet:', message);
        throw new Error('URL du message vocal invalide');
      }
      console.log('🎵 Lecture du message vocal:', voiceUrl);
      const { sound } = await Audio.Sound.createAsync(
        { uri: voiceUrl },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlayingMessageId(messageId);

      // Marquer le message comme lu (optionnel, ne pas bloquer la lecture)
      if (message && !message.isRead) {
        try {
          await markMessageAsRead(messageId);
          console.log('✅ Message marqué comme lu:', messageId);
          setMessages(prev => prev.map(m => 
            m._id === messageId ? { ...m, isRead: true, readAt: new Date().toISOString() } : m
          ));
          if (message.isViewOnce) {
            try {
              await deleteViewOnceMessage(messageId);
              console.log('🗑️ Message vu unique supprimé:', messageId);
              setMessages(prev => prev.filter(m => m._id !== messageId));
              Alert.alert('Message supprimé', 'Ce message n\'était visible qu\'une fois.');
            } catch (err: any) {
              console.error('⚠️ Erreur suppression vu unique:', err.message);
            }
          }
        } catch (err: any) {
          console.error('⚠️ Erreur marquage lecture (non bloquant):', err.message);
        }
      }

      // Mettre à jour la progression
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          const progress = status.position / status.durationMillis;
          setPlayingProgress(progress);
          
          if (status.didJustFinish) {
            setPlayingMessageId(null);
            setPlayingProgress(0);
          }
        }
      });
    } catch (err: any) {
      console.error('❌ Erreur lecture vocal:', err);
      Alert.alert('Erreur', 'Impossible de lire le message vocal');
    }
  };

  const onSubmitEditing = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    handleSend();
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";
    const isVoice = (item as any).type === 'voice';
    const isViewOnce = (item as any).isViewOnce;
    const isRead = (item as any).isRead;
    const isPlaying = playingMessageId === item._id;
    
    return (
      <View style={styles.messageRow}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.patientBubble]}>
          {isVoice ? (
            <View style={styles.voiceMessageContainer}>
              <TouchableOpacity 
                style={styles.voicePlayButton}
                onPress={() => playVoiceMessage(item._id, (item as any).voiceUrl, item)}
              >
                <Ionicons 
                  name={isPlaying ? "pause-circle" : "play-circle"} 
                  size={32} 
                  color={isUser ? "#fff" : "#2ccdd2"} 
                />
              </TouchableOpacity>
              <View style={styles.voiceProgressContainer}>
                <View style={[styles.voiceProgressBar, { width: `${playingProgress * 100}%` }]} />
              </View>
              <Text style={[styles.messageText, isUser ? styles.userText : styles.patientText]}>
                {(item as any).voiceDuration || 0}s
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.messageText, isUser ? styles.userText : styles.patientText]}>
                {item.text}
              </Text>
              {isViewOnce && (
                <View style={styles.viewOnceBadge}>
                  <Ionicons name="eye" size={12} color={isUser ? "#fff" : "#111827"} />
                  <Text style={[styles.viewOnceText, isUser ? { color: "#fff" } : { color: "#111827" }]}>
                    Vu unique
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
        <View style={[styles.timeRow, isUser ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]}>
          <View style={styles.statusContainer}>
            {isUser && isRead && (
              <Ionicons name="checkmark-done" size={12} color="#2ccdd2" />
            )}
            <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Si pas de patientId, afficher une erreur
  if (!patientId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 16, color: "#EF4444" }}>Erreur: Patient non sélectionné</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/921/921071.png" }}
            style={styles.avatar}
          />
          <View style={{ justifyContent: "center" }}>
            <Text style={styles.patientName}>{patientName}</Text>
            <Text style={styles.onlineStatus}>En ligne</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.iconPhoto}>
          <MaterialIcons name="photo-camera" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* MESSAGES */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 12, color: theme.colors.muted }}>Chargement des messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* VU UNIQUE TOGGLE */}
      <View style={styles.viewOnceContainer}>
        <TouchableOpacity 
          style={[styles.viewOnceToggle, isViewOnce && styles.viewOnceActive]}
          onPress={() => setIsViewOnce(!isViewOnce)}
        >
          <Ionicons 
            name={isViewOnce ? "eye" : "eye-off"} 
            size={16} 
            color={isViewOnce ? "#fff" : "#6B7280"} 
          />
          <Text style={[styles.viewOnceLabel, isViewOnce && styles.viewOnceLabelActive]}>
            Vu unique
          </Text>
        </TouchableOpacity>
      </View>

      {/* INPUT */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.iconAttach} onPress={() => setShowVoiceModal(true)}>
          <Ionicons name="mic" size={22} color="#2ccdd2" />
        </TouchableOpacity>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.mode === 'dark' ? '#0f172a' : '#F3F4F6',
              color: theme.colors.text,
              borderWidth: inputInvalid ? 1 : 0,
              borderColor: inputInvalid ? '#DC2626' : 'transparent',
            },
          ]}
          placeholder="Écris ton message..."
          placeholderTextColor={theme.colors.muted}
          value={messageText}
          onChangeText={(t) => { setMessageText(t); if (inputError) setInputError(null); }}
          multiline
          onSubmitEditing={onSubmitEditing}
          returnKeyType="send"
          selectionColor={theme.colors.primary}
          maxLength={1000}
        />

        <TouchableOpacity onPress={handleSend} style={[styles.sendButton, { backgroundColor: theme.colors.primary }, (!isValidMsg(messageText) || sending) && { opacity: 0.7 }]} disabled={sending || !isValidMsg(messageText)}>
          <Ionicons name={sending ? "hourglass" : "send"} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* character counter */}
      <View style={{ paddingHorizontal: 12, paddingTop: 4 }}>
        <Text style={{ alignSelf: 'flex-end', color: inputInvalid ? '#DC2626' : theme.colors.muted, fontSize: 11 }}>
          {sanitize(messageText).length}/1000
        </Text>
      </View>

      {/* VOICE RECORDING MODAL */}
      <Modal visible={showVoiceModal} transparent animationType="fade">
        <View style={styles.voiceModalOverlay}>
          <View style={[styles.voiceModalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.voiceModalTitle, { color: theme.colors.text }]}>
              Enregistrement vocal
            </Text>
            
            <View style={styles.recordingDisplay}>
              <Ionicons 
                name={isRecording ? "mic-circle" : "mic-circle-outline"} 
                size={60} 
                color={isRecording ? "#DC2626" : "#2ccdd2"} 
              />
              <Text style={[styles.recordingTime, { color: theme.colors.text }]}>
                {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
              </Text>
            </View>

            <View style={styles.voiceButtonsContainer}>
              <TouchableOpacity 
                style={[styles.voiceButton, { backgroundColor: isRecording ? "#DC2626" : "#2ccdd2" }]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Ionicons 
                  name={isRecording ? "stop" : "play"} 
                  size={24} 
                  color="#fff" 
                />
                <Text style={styles.voiceButtonText}>
                  {isRecording ? "Arrêter" : "Enregistrer"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.voiceButton, { backgroundColor: "#10B981" }]}
                onPress={() => handleSendVoice(`voice_${Date.now()}.m4a`, recordingTime)}
                disabled={recordingTime === 0}
              >
                <Ionicons name="send" size={24} color="#fff" />
                <Text style={styles.voiceButtonText}>Envoyer</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.voiceButton, { backgroundColor: "#6B7280" }]}
                onPress={() => {
                  setShowVoiceModal(false);
                  setIsRecording(false);
                  setRecordingTime(0);
                  if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
                }}
              >
                <Ionicons name="close" size={24} color="#fff" />
                <Text style={styles.voiceButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", marginBottom: 40, marginTop: 32 },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2ccdd2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "space-between",
  },
  iconBack: { paddingRight: 6 },
  headerInfo: { flexDirection: "row", alignItems: "center", flex: 1, marginLeft: 6 },
  avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  patientName: { color: "#fff", fontSize: 16 },
  onlineStatus: { color: "#D1FAE5", fontSize: 12 },

  iconPhoto: { paddingLeft: 6 },

  /* MESSAGES LIST */
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  messageRow: {
    marginVertical: 6,
    maxWidth: "100%",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 14,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#2ccdd2",
    borderBottomRightRadius: 4,
  },
  patientBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E7EB",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: { color: "#fff" },
  patientText: { color: "#111827" },

  timeRow: {
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: "#6B7280",
  },

  /* INPUT */
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  iconAttach: {
    padding: 8,
    alignSelf: "center",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
  },
  sendButton: {
    backgroundColor: "#2ccdd2",
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
    alignSelf: "flex-end",
  },

  /* VOICE & SPECIAL MESSAGES */
  voiceMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  voicePlayButton: {
    padding: 4,
  },
  voiceProgressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  voiceProgressBar: {
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 2,
  },
  viewOnceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.3)",
  },
  viewOnceText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  /* VU UNIQUE */
  viewOnceContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
  },
  viewOnceToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  viewOnceActive: {
    backgroundColor: "#2ccdd2",
    borderColor: "#2ccdd2",
  },
  viewOnceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  viewOnceLabelActive: {
    color: "#fff",
  },

  /* VOICE MODAL */
  voiceModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  voiceModalContent: {
    width: "85%",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  voiceModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 24,
  },
  recordingDisplay: {
    alignItems: "center",
    marginBottom: 24,
  },
  recordingTime: {
    fontSize: 32,
    fontWeight: "700",
    marginTop: 12,
    fontFamily: "monospace",
  },
  voiceButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  voiceButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  voiceButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
});
