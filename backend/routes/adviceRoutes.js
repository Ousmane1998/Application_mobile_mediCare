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
 *     summary: Créer un conseil (JSON ou fichier)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
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
