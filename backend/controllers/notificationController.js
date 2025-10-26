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

export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.query;
    console.log("📬 [getNotifications] Récupération des notifications pour userId :", userId);
    
    if (!userId) {
      console.log("❌ [getNotifications] userId manquant");
      return res.status(400).json({ message: "userId est requis" });
    }
    
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
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
    console.log("📬 [getAllNotifications] Récupération de TOUTES les notifications");
    
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    console.log("✅ [getAllNotifications] Total notifications :", notifications.length);
    
    res.json(notifications);
  } catch (err) {
    console.error("❌ [getAllNotifications] Erreur :", err.message);
    res.status(500).json({ message: err.message });
  }
};
