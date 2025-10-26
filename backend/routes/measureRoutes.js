// routes/measureRoutes.js
import express from "express";
import { addMeasure, getHistory, getById } from "../controllers/measureController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Measure:
 *       type: object
 *       properties:
 *         patientId:
 *           type: string
 *           description: ID du patient
 *         type:
 *           type: string
 *           enum: [tension, glycemie, poids, pouls, temperature]
 *           description: Type de mesure
 *         value:
 *           type: string
 *           description: Valeur de la mesure
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date de la mesure
 *         synced:
 *           type: boolean
 *           description: Synchronisé ou non
 *       required:
 *         - patientId
 *         - type
 *         - value
 */

/**
 * @swagger
 * /api/mesures:
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
 *             $ref: '#/components/schemas/Measure'
 *     responses:
 *       201:
 *         description: Mesure ajoutée
 */

const router = express.Router();

// POST pour ajouter une mesure
router.post("/", authMiddleware, addMeasure);

// GET /history/:patientId - route spécifique
router.get("/history/:patientId", authMiddleware, getHistory);
router.get("/:id", authMiddleware, getById);

// GET /:patientId - route générique (doit être APRÈS les routes spécifiques)
router.get("/:patientId", authMiddleware, (req, res, next) => {
  // Vérifier que ce n'est pas une route spéciale
  if (req.params.patientId === 'history') {
    return next();
  }
  getHistory(req, res);
});

export default router;
