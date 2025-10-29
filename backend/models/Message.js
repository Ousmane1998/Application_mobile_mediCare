// models/Message.js
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String },
  type: { type: String, enum: ['text', 'voice'], default: 'text' },
  voiceUrl: { type: String },
  voiceDuration: { type: Number },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  isTyping: { type: Boolean, default: false },
  isViewOnce: { type: Boolean, default: false },
  viewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", MessageSchema);
export default Message;