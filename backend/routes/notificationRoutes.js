// @ts-nocheck
// routes/notificationRoutes.js
import express from "express";
import { createNotification, getNotifications, getAllNotifications, markNotificationRead, deleteNotificationCtrl } from "../controllers/notificationController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import Notification from "../models/Notification.js";

const router = express.Router();

// Créer une nouvelle notification
router.post("/", authMiddleware, createNotification);

// Récupérer TOUTES les notifications 
router.get("/all", authMiddleware, getAllNotifications);

// Récupérer toutes les notifications d'un utilisateur
router.get("/", authMiddleware, getNotifications);

// Marquer une notification comme lue
router.put("/:id/read", authMiddleware, markNotificationRead);

// Supprimer une notification
router.delete("/:id", authMiddleware, deleteNotificationCtrl);

export default router;
