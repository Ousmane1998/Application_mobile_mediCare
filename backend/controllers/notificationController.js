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
    
    res.json(notifications);
  } catch (err) {
    console.error("❌ [getNotifications] Erreur :", err.message);
    res.status(500).json({ message: err.message });
  }
};
