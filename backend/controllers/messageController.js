// @ts-nocheck
// controllers/messageController.js
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";

export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, text, isRead, createdAt } = req.body; // extraire text

    const message = await Message.create({
      senderId,
      receiverId,
      text,                     // ✅ correspond au champ JSON
      isRead: isRead || false,  // optionnel, par défaut false
      createdAt: createdAt || Date.now(), // optionnel, par défaut date actuelle
    });

    console.log("📨 [sendMessage] Message créé :", message._id);

    // 📬 Créer une notification pour le destinataire
    try {
      await Notification.create({
        userId: receiverId,
        type: 'message',
        message: `Nouveau message: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
        data: { messageId: message._id, senderId },
        isRead: false,
      });
      console.log("✅ [sendMessage] Notification créée pour :", receiverId);
    } catch (notifErr) {
      console.error("⚠️ [sendMessage] Erreur création notification :", notifErr.message);
      // Continuer même si la notification échoue
    }

    res.status(201).json({ message: "Message envoyé", data: message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getMessages = async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
