import express from "express";
import { createAdvice, getAdvice } from "../controllers/adviceController.js";

/**
 * @openapi
 * tags:
 *   - name: Advices
 *     description: Conseils médicaux
 * /api/advices:
 *   post:
 *     tags: [Advices]
 *     summary: Créer un conseil
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Conseil créé
 *   get:
 *     tags: [Advices]
 *     summary: Récupérer des conseils
 *     responses:
 *       200:
 *         description: Liste des conseils
 */
const router = express.Router();

router.post("/", createAdvice);
router.get("/", getAdvice);

export default router;
