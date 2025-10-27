// @ts-nocheck
// controllers/notificationController.js
import Notification from "../models/Notification.js";

export const createNotification = async (req, res) => {
  try {
    const notif = await Notification.create(req.body);
    res.status(201).json({ message: "Notification envoyée", notif });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const me = req.user;
    if (!me) return res.status(401).json({ message: 'Non authentifié' });
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Notification introuvable' });
    const isOwner = String(notif.userId) === String(me._id);
    const isAdmin = me.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Accès refusé' });
    notif.isRead = true;
    await notif.save();
    res.json({ message: 'Notification marquée comme lue', notif });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteNotificationCtrl = async (req, res) => {
  try {
    const me = req.user;
    if (!me) return res.status(401).json({ message: 'Non authentifié' });
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Notification introuvable' });
    const isOwner = String(notif.userId) === String(me._id);
    const isAdmin = me.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Accès refusé' });
    await notif.deleteOne();
    res.json({ message: 'Notification supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const me = req.user;
    if (!me) return res.status(401).json({ message: 'Non authentifié' });
    const requestedUserId = req.query.userId || String(me._id);
    const isAdmin = me.role === 'admin';
    if (!isAdmin && String(requestedUserId) !== String(me._id)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const notifications = await Notification.find({ userId: requestedUserId }).sort({ createdAt: -1 });
    console.log("✅ [getNotifications] Notifications trouvées :", notifications.length);
    console.log("📋 [getNotifications] Détails :", JSON.stringify(notifications, null, 2));
    
    // Afficher aussi les types de notifications
    const typeCount = {};
    notifications.forEach(n => {
      typeCount[n.type] = (typeCount[n.type] || 0) + 1;
    });
    console.log("📊 [getNotifications] Résumé par type :", typeCount);
    
    res.json(notifications);
  } catch (err) {
    console.error("❌ [getNotifications] Erreur :", err.message);
    res.status(500).json({ message: err.message });
  }
};

export const getAllNotifications = async (req, res) => {
  try {
    const me = req.user;
    if (!me) return res.status(401).json({ message: 'Non authentifié' });
    if (me.role !== 'admin') return res.status(403).json({ message: 'Réservé admin' });
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    console.error("❌ [getAllNotifications] Erreur :", err.message);
    res.status(500).json({ message: err.message });
  }
};
