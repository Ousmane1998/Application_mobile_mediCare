// models/Notification.js
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  medecinId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String },
  title: { type: String },
  message: { type: String },
  isRead: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
