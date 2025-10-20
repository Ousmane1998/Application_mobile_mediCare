// routes/messageRoutes.js
import express from "express";
import { sendMessage, getMessages } from "../controllers/messageController.js";

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

router.post("/", sendMessage);
router.get("/", getMessages);

export default router;
