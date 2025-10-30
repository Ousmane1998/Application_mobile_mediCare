// routes/messageRoutes.js
import express from "express";
import { sendMessage, getMessages, markMessageAsRead, setTypingStatus, deleteViewOnceMessage } from "../controllers/messageController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

/**
 * @openapi
 * tags:
 *   - name: Messages
 *     description: Messagerie entre utilisateurs
 * /api/messages:
 *   post:
 *     tags: [Messages]
 *     summary: Envoyer un message
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
 *         description: Message envoyé
 *   get:
 *     tags: [Messages]
 *     summary: Récupérer les messages
 *     responses:
 *       200:
 *         description: Liste des messages
 */
const router = express.Router();

// Routes principales
router.post("/", authMiddleware, sendMessage);
router.get("/", authMiddleware, getMessages);

// Routes pour les statuts
router.put("/:messageId/read", authMiddleware, markMessageAsRead);
router.post("/typing", authMiddleware, setTypingStatus);
router.delete("/:messageId/view-once", authMiddleware, deleteViewOnceMessage);

export default router;
