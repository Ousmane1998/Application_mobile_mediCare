// @ts-nocheck
// routes/chatRoutes.js
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import Chat from "../models/Chat.js";

const router = express.Router();

// Récupérer les messages d'une conversation (auth + accès restreint)
router.get("/:chatId", authMiddleware, async (req, res) => {
  try {
    const chatId = req.params.chatId;
    if (!chatId) return res.status(400).json({ message: "chatId requis" });
    const me = String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    // Heuristique d'appartenance: chatId contient l'userId OU l'user a déjà posté dans ce chat
    const appearsInId = chatId.includes(me);
    const postedBefore = await Chat.exists({ chatId, senderId: me });
    if (!isAdmin && !appearsInId && !postedBefore) {
      return res.status(403).json({ message: 'Accès interdit à cette conversation' });
    }
    const chat = await Chat.find({ chatId }).sort({ createdAt: 1 });
    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Envoyer un message (auth + sender = user)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { chatId, senderId, text } = req.body || {};
    if (!chatId || !senderId || !text) return res.status(400).json({ message: 'chatId, senderId et text requis' });
    const me = String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && String(senderId) !== me) {
      return res.status(403).json({ message: 'senderId invalide' });
    }
    if (typeof text !== 'string' || text.trim().length === 0 || text.length > 4000) {
      return res.status(400).json({ message: 'Texte invalide' });
    }
    const chat = new Chat({ chatId, senderId, text: text.trim() });
    await chat.save();
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
