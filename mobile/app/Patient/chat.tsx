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
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialIcons, Entypo } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { getProfile, getMessages, sendMessage, getMedecinById } from "../../utils/api";
import { useAppTheme } from "../../theme/ThemeContext";

type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
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
  sender: "user" | "doctor";
  createdAt: string;
};

type Doctor = {
  _id: string;
  nom: string;
  prenom: string;
  photo?: string;
  specialite?: string;
  email?: string;
};

const ChatScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message> | null>(null);

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

  // Charger le profil du patient et son médecin
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Récupérer le profil du patient
        const { user } = await getProfile();
        setPatient(user);
        console.log("👤 Patient :", user._id);

        // Récupérer le médecin du patient (medecinId)
        if (user.medecinId) {
          console.log("🏥 Médecin ID :", user.medecinId);
          
          try {
            // Récupérer les données du médecin
            const medecinData = await getMedecinById(user.medecinId);
            const medecinUser = medecinData.user || medecinData;
            setDoctor(medecinUser);
            console.log("👨‍⚕️ Médecin chargé :", medecinUser.prenom, medecinUser.nom);
          } catch (err: any) {
            console.error("❌ Erreur chargement médecin :", err.message);
          }

          // Charger les messages avec le médecin
          const msgs = await getMessages(user._id, user.medecinId);
          console.log("💬 Messages chargés :", msgs.length);
          
          // Mapper les messages
          const mappedMessages = msgs.map((msg: any) => ({
            ...msg,
            sender: msg.senderId === user._id ? "user" : "doctor",
          }));
          setMessages(mappedMessages);
        }
      } catch (err: any) {
        console.error("❌ Erreur chargement :", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
    if (!patient || !patient.medecinId) return;
    const text = sanitize(messageText);
    if (!isValidMsg(text)) return;

    setSending(true);
    try {
      // Envoyer le message
      const newMsg = await sendMessage({
        senderId: patient._id,
        receiverId: patient.medecinId,
        text,
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
      };

      setMessages((prev) => [...prev, msgToAdd]);
      setMessageText("");
    } catch (err: any) {
      console.error("❌ Erreur envoi :", err.message);
    } finally {
      setSending(false);
    }
  };

  // support "Enter" send on keyboard (android/ios external keyboards)
  const onSubmitEditing = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    handleSend();
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";
    return (
      <View style={styles.messageRow}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.doctorBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.doctorText]}>
            {item.text}
          </Text>
        </View>
        <View style={[styles.timeRow, isUser ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]}>
          <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

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
          {doctor?.photo ? (
            <Image
              source={{ uri: doctor.photo }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: '#2ccdd2', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {`${(doctor?.prenom||'').charAt(0)}${(doctor?.nom||'').charAt(0)}`.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={{ justifyContent: "center" }}>
            <Text style={styles.doctorName}>
              {doctor ? `Dr. ${doctor.prenom} ${doctor.nom}` : "Chargement..."}
            </Text>
            <Text style={styles.onlineStatus}>En ligne</Text>
          </View>
        </View>

      </View>

      {/* MESSAGES */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2ccdd2" />
          <Text style={{ marginTop: 12, color: '#6B7280' }}>Chargement des messages...</Text>
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

      {/* INPUT */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }] }>
        <TouchableOpacity style={styles.iconAttach}>
          <Entypo name="attachment" size={22} color="#4B5563" />
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
          onChangeText={setMessageText}
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
  doctorName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  onlineStatus: { color: "#D1FAE5", fontSize: 12 },

  iconPhoto: { paddingLeft: 6 },

  /* MESSAGES LIST */
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  messageRow: {
    marginVertical: 6,
    // full width container that will hold bubble and time
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
  doctorBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E7EB",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: { color: "#fff" },
  doctorText: { color: "#111827" },

  timeRow: {
    marginTop: 4,
    // width fits content
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
});
