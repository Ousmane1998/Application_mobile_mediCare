// models/Conversation.js
const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // [medecinId, patientId]
}, { timestamps: true });

module.exports = mongoose.model("Chat", chatSchema);
