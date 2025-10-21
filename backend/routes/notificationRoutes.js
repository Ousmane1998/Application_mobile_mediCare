// routes/notificationRoutes.js
import express from "express";
import { createNotification, getNotifications } from "../controllers/notificationController.js";
import Notification from "../Models/Notification.js";

/**
 * @openapi
 * tags:
 *   - name: Notifications
 *     description: Gestion des notifications
 * /api/notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Créer une notification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Notification créée
 *   get:
 *     tags: [Notifications]
 *     summary: Lister les notifications d'un utilisateur
 *     responses:
 *       200:
 *         description: Liste des notifications
 * /api/notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Marquer une notification comme lue
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification mise à jour
 * /api/notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Supprimer une notification
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification supprimée
 */
const router = express.Router();

// Créer une nouvelle notification
router.post("/", createNotification);

// Récupérer toutes les notifications d’un utilisateur
router.get("/", getNotifications);

// Marquer une notification comme lue
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

// Supprimer une notification
router.delete("/:id", async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification supprimée" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
