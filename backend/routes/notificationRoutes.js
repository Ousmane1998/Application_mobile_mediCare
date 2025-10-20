// routes/notificationRoutes.js
import express from "express";
import { createNotification, getNotifications } from "../controllers/notificationController.js";
import Notification from "../models/Notification.js";

const router = express.Router();

// ➕ Créer une nouvelle notification
router.post("/", createNotification);

// 📩 Récupérer toutes les notifications d’un utilisateur
router.get("/", getNotifications);

// 🟢 Marquer une notification comme lue
router.put("/:id/read", async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json({ message: "Notification marquée comme lue", notif });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ❌ Supprimer une notification
router.delete("/:id", async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification supprimée" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
