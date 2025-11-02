// @ts-nocheck
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
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getProfile, authFetch, sendMessage, markMessageAsRead, deleteViewOnceMessage } from "../../utils/api";
import { useAppTheme } from "../../theme/ThemeContext";
import { Audio } from 'expo-av';

type Message = {
  _id?: string;
  id?: string;
  text: string;
  senderId: string;
  receiverId: string;
  sender: "user" | "patient";
  createdAt: string;
};

export default function ChatDetailScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { patientId, patientName } = useLocalSearchParams();
  
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [playingProgress, setPlayingProgress] = useState(0);
  const listRef = useRef<FlatList<Message> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Validation helpers
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


  // Charger les messages
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Récupérer le profil du médecin
        const { user } = await getProfile();
        setDoctor(user);
        console.log("👨‍⚕️ Médecin :", user._id);
        console.log("👤 Patient ID :", patientId);

        // Charger les messages avec le patient
        const msgs = await authFetch(`/messages?user1=${user._id}&user2=${patientId}`);
        const msgList = Array.isArray(msgs) ? msgs : msgs?.data || [];
        console.log("💬 Messages chargés :", msgList.length);
        
        // Mapper les messages
        const mappedMessages = msgList.map((msg: any) => ({
          ...msg,
          sender: msg.senderId === user._id ? "user" : "patient",
        }));

        setMessages(mappedMessages);
      } catch (err: any) {
        console.error("❌ Erreur chargement :", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [patientId]);

  // Scroll to end
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
    if (!doctor || !patientId) return;
    const text = sanitize(messageText);
    if (!isValidMsg(text)) return;

    setSending(true);
    try {
      // Envoyer le message
      const newMsg = await sendMessage({
        senderId: doctor._id,
        receiverId: String(patientId),
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
      setIsViewOnce(false);
    } catch (err: any) {
      console.error("❌ Erreur envoi :", err.message);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
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

      // Charger et jouer le message
      if (!voiceUrl) {
        throw new Error('URL du message vocal invalide');
      }
      console.log('🎵 Lecture du message vocal:', voiceUrl);
      const { sound } = await Audio.Sound.createAsync(
        { uri: voiceUrl },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlayingMessageId(messageId);

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

      // Marquer comme lu
      if (message && !message.isRead) {
        try {
          await markMessageAsRead(messageId);
          console.log('✅ Message marqué comme lu:', messageId);
          setMessages(prev => prev.map(m => 
            m._id === messageId ? { ...m, isRead: true, readAt: new Date().toISOString() } : m
          ));
        } catch (err: any) {
          console.error('⚠️ Erreur marquage lecture:', err.message);
        }
      }
    } catch (err: any) {
      console.error('❌ Erreur lecture vocal:', err);
      Alert.alert('Erreur', 'Impossible de lire le message vocal');
    }
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
      <View style={[styles.header, { backgroundColor: '#2ccdd2' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={[styles.avatar, { backgroundColor: '#10B981' }]}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
          <View style={{ justifyContent: "center" }}>
            <Text style={styles.patientName}>{patientName}</Text>
            <Text style={styles.onlineStatus}>En ligne</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.iconPhoto}>
          <Ionicons name="call" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* MESSAGES */}
      {messages.length > 0 ? (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.muted} />
          <Text style={[styles.emptyText, { color: theme.colors.muted }]}>Aucun message</Text>
        </View>
      )}

      {/* INPUT */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <TextInput
          style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.background }]}
          placeholder="Écris ton message..."
          placeholderTextColor={theme.colors.muted}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity 
          onPress={handleSend} 
          style={[styles.sendButton, { backgroundColor: theme.colors.primary, opacity: (!isValidMsg(messageText) || sending) ? 0.7 : 1 }]} 
          disabled={sending || !isValidMsg(messageText)}
        >
          <Ionicons name={sending ? "hourglass" : "send"} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "space-between",
    marginTop: 40,
  },
  iconBack: { paddingRight: 6 },
  headerInfo: { flexDirection: "row", alignItems: "center", flex: 1, marginLeft: 6 },
  avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  patientName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  onlineStatus: { color: "#D1FAE5", fontSize: 12 },
  iconPhoto: { paddingLeft: 6 },
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
    alignSelf: "flex-end",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
  },
});
