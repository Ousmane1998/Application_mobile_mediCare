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
import { getProfile, getMessages, sendMessage } from "../../utils/api";
import { useLocalSearchParams } from "expo-router";

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
  const searchParams = useLocalSearchParams();
  const patientId = (searchParams?.patientId as string) || (route?.params?.patientId as string) || "";
  const patientName = (searchParams?.patientName as string) || (route?.params?.patientName as string) || "Patient";
  
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message> | null>(null);

  // Si pas de patientId, afficher une erreur
  if (!patientId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 16, color: "#EF4444" }}>Erreur: Patient non sélectionné</Text>
      </View>
    );
  }

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
    if (!messageText.trim() || !doctor) return;

    setSending(true);
    try {
      // Envoyer le message
      const newMsg = await sendMessage({
        senderId: doctor._id,
        receiverId: patientId,
        text: messageText.trim(),
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

  const onSubmitEditing = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    handleSend();
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";
    return (
      <View style={styles.messageRow}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.patientBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.patientText]}>
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
      style={styles.container}
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
          <ActivityIndicator size="large" color="#2ccdd2" />
          <Text style={{ marginTop: 12, color: "#6B7280" }}>Chargement des messages...</Text>
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
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.iconAttach}>
          <Entypo name="attachment" size={22} color="#4B5563" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Écris ton message..."
          placeholderTextColor="#9CA3AF"
          value={messageText}
          onChangeText={setMessageText}
          multiline
          onSubmitEditing={onSubmitEditing}
          returnKeyType="send"
        />

        <TouchableOpacity onPress={handleSend} style={styles.sendButton} disabled={sending}>
          <Ionicons name={sending ? "hourglass" : "send"} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },

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
  patientName: { color: "#fff", fontSize: 16, fontWeight: "600" },
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
});
