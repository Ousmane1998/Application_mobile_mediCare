// @ts-nocheck
// controllers/messageController.js
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";

export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, text, type, voiceUrl, voiceDuration, isViewOnce } = req.body;
    if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
    if (!senderId || !receiverId) return res.status(400).json({ message: 'senderId et receiverId requis' });
    
    const oid = /^[0-9a-fA-F]{24}$/;
    if (!oid.test(String(senderId)) || !oid.test(String(receiverId))) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }
    if (String(req.user._id) !== String(senderId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Interdit: senderId invalide' });
    }

    // Valider selon le type
    const msgType = type || 'text';
    if (msgType === 'text') {
      if (typeof text !== 'string') return res.status(400).json({ message: 'text requis pour message texte' });
      const cleanText = text.trim();
      if (cleanText.length === 0 || cleanText.length > 2000) {
        return res.status(400).json({ message: 'Texte invalide (1-2000 caractères)' });
      }
    } else if (msgType === 'voice') {
      if (!voiceUrl) return res.status(400).json({ message: 'voiceUrl requis pour message vocal' });
    }

    const message = await Message.create({
      senderId,
      receiverId,
      text: text || '',
      type: msgType,
      voiceUrl: voiceUrl || null,
      voiceDuration: voiceDuration || null,
      isViewOnce: isViewOnce || false,
      isRead: false,
    });

    console.log(`📨 [sendMessage] Message ${msgType} créé:`, message._id);

    // 📬 Créer une notification pour le destinataire
    try {
      const notifMsg = msgType === 'voice' 
        ? `Message vocal (${voiceDuration}s)` 
        : `Nouveau message: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`;
      
      // Récupérer les infos du sender pour la notification
      const User = (await import("../models/User.js")).default;
      const sender = await User.findById(senderId);
      
      await Notification.create({
        userId: receiverId,
        type: 'message',
        message: notifMsg,
        data: { 
          messageId: message._id, 
          senderId,
          patientId: senderId,
          patientName: sender ? `${sender.prenom} ${sender.nom}` : 'Patient',
          prenom: sender?.prenom,
          nom: sender?.nom
        },
        isRead: false,
      });
      console.log("✅ [sendMessage] Notification créée pour :", receiverId);
    } catch (notifErr) {
      console.error("⚠️ [sendMessage] Erreur création notification :", notifErr.message);
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
    
    // Supprimer les messages "vu unique" qui ont été lus
    const filteredMessages = messages.filter(msg => {
      if (msg.isViewOnce && msg.isRead && msg.viewedAt) {
        return false; // Supprimer du résultat
      }
      return true;
    });
    
    res.json(filteredMessages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Marquer un message comme lu
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
    
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message non trouvé' });
    
    // Vérifier que l'utilisateur est le destinataire
    if (String(message.receiverId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Interdit' });
    }
    
    message.isRead = true;
    message.readAt = new Date();
    message.viewedAt = new Date();
    await message.save();
    
    console.log(`✅ [markMessageAsRead] Message ${messageId} marqué comme lu`);
    res.json({ message: 'Message marqué comme lu', data: message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Définir le statut "en train d'écrire"
export const setTypingStatus = async (req, res) => {
  try {
    const { receiverId, isTyping } = req.body;
    if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
    if (!receiverId) return res.status(400).json({ message: 'receiverId requis' });
    
    console.log(`✍️ [setTypingStatus] ${req.user.prenom} ${req.user.nom} est ${isTyping ? 'en train d\'écrire' : 'arrêté'}`);
    
    // Retourner le statut (peut être utilisé avec WebSocket pour temps réel)
    res.json({ 
      senderId: req.user._id, 
      receiverId, 
      isTyping,
      senderName: `${req.user.prenom} ${req.user.nom}`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Supprimer un message "vu unique"
export const deleteViewOnceMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
    
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message non trouvé' });
    
    if (!message.isViewOnce) {
      return res.status(400).json({ message: 'Ce message n\'est pas un message vu unique' });
    }
    
    // Vérifier que l'utilisateur est le destinataire
    if (String(message.receiverId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Interdit' });
    }
    
    await Message.findByIdAndDelete(messageId);
    console.log(`🗑️ [deleteViewOnceMessage] Message ${messageId} supprimé`);
    res.json({ message: 'Message supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
