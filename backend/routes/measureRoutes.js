// routes/measureRoutes.js
import express from "express";
import { addMeasure, getHistory } from "../controllers/measureController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

/**
 * @openapi
 * tags:
 *   - name: Measures
 *     description: Mesures de santé
 * /api/measures:
 *   post:
 *     tags: [Measures]
 *     summary: Ajouter une mesure pour l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
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
 *         description: Mesure ajoutée
 *       401:
 *         description: Non authentifié
 * /api/measures/history/{patientId}:
 *   get:
 *     tags: [Measures]
 *     summary: Historique des mesures d'un patient
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Historique retourné
 *       401:
 *         description: Non authentifié
 */
const router = express.Router();

router.post("/", authMiddleware, addMeasure);
router.get("/history/:patientId", authMiddleware, getHistory);

export default router;
