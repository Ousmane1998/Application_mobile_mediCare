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
} from "react-native";
import { Ionicons, MaterialIcons, Entypo } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";

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
  id: string;
  text: string;
  sender: "user" | "doctor";
  timeISO: string; // stocke ISO pour formatage
};

const initialMessages: Message[] = [
  {
    id: "1",
    text: "Bonjour, comment vous sentez-vous aujourd’hui ?",
    sender: "doctor",
    timeISO: new Date().toISOString(),
  },
  {
    id: "2",
    text: "Je me sens un peu fatigué ce matin.",
    sender: "user",
    timeISO: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1h avant
  },
];

const ChatScreen: React.FC<Props> = ({ navigation }) => {
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const listRef = useRef<FlatList<Message> | null>(null);

  // scroll to end when messages change
  useEffect(() => {
    // slight delay to allow FlatList update
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
      // Format "HH:mm" with locale-aware hours/minutes
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const handleSend = () => {
    if (!messageText.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      text: messageText.trim(),
      sender: "user",
      timeISO: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessageText("");

    // simulation réponse docteur
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: "Merci, je note cela. Reposez-vous et buvez de l'eau.",
        sender: "doctor",
        timeISO: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 900);
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
        {/* time under bubble, aligned right for user, left for doctor */}
        <View style={[styles.timeRow, isUser ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]}>
          <Text style={styles.messageTime}>{formatTime(item.timeISO)}</Text>
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
            <Text style={styles.doctorName}>Dr. Faye</Text>
            <Text style={styles.onlineStatus}>En ligne</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.iconPhoto}>
          <MaterialIcons name="photo-camera" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* MESSAGES */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messagesList}
        // inverted false, we scroll to end manually
        showsVerticalScrollIndicator={false}
      />

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

        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Ionicons name="send" size={20} color="#fff" />
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
