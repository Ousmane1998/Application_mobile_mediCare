import express from "express";
import { createAdvice, getAdvice } from "../controllers/adviceController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

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

// POST pour créer un conseil
router.post("/", authMiddleware, createAdvice);

// GET / - récupérer tous les conseils (sans paramètre)
router.get("/", authMiddleware, getAdvice);

// GET /:patientId - récupérer les conseils d'un patient spécifique
router.get("/:patientId", authMiddleware, (req, res, next) => {
  // Vérifier que ce n'est pas une route spéciale
  if (!req.params.patientId || req.params.patientId === '') {
    return next();
  }
  getAdvice(req, res);
});

export default router;
