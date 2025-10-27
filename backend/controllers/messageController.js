// @ts-nocheck
// controllers/messageController.js
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";

export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, text, isRead, createdAt } = req.body; // extraire text
    if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
    if (!senderId || !receiverId || typeof text !== 'string') return res.status(400).json({ message: 'senderId, receiverId et text requis' });
    const oid = /^[0-9a-fA-F]{24}$/;
    if (!oid.test(String(senderId)) || !oid.test(String(receiverId))) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }
    if (String(req.user._id) !== String(senderId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Interdit: senderId invalide' });
    }
    const cleanText = text.trim();
    if (cleanText.length === 0 || cleanText.length > 2000) {
      return res.status(400).json({ message: 'Texte invalide (1-2000 caractères)' });
    }

    const message = await Message.create({
      senderId,
      receiverId,
      text: cleanText,                     // ✅ correspond au champ JSON
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
    if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
    if (!user1 || !user2) return res.status(400).json({ message: 'user1 et user2 requis' });
    const me = String(req.user._id);
    if (![String(user1), String(user2)].includes(me) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit à cette conversation' });
    }
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
