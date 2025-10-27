// routes/ficheDeSanteRoutes.js
import express from "express";
import {
  getAllFiches,
  createFiche,
  updateFiche,
  deleteFiche,
} from "../controllers/ficheDeSanteController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: FichesDeSante
 *   description: Gestion des fiches de santé
 */

/**
 * @swagger
 * /api/fiches:
 *   get:
 *     summary: Récupérer toutes les fiches de santé
 *     tags: [FichesDeSante]
 *     responses:
 *       200:
 *         description: Liste des fiches
 */
router.get("/", authMiddleware, getAllFiches);

/**
 * @swagger
 * /api/fiches:
 *   post:
 *     summary: Créer une nouvelle fiche de santé
 *     tags: [FichesDeSante]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FicheDeSante'
 *     responses:
 *       201:
 *         description: Fiche créée
 */
router.post("/", authMiddleware, createFiche);

/**
 * @swagger
 * /api/fiches/{id}:
 *   put:
 *     summary: Mettre à jour une fiche de santé
 *     tags: [FichesDeSante]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Fiche mise à jour
 */
router.put("/:id", authMiddleware, updateFiche);

/**
 * @swagger
 * /api/fiches/{id}:
 *   delete:
 *     summary: Supprimer une fiche de santé
 *     tags: [FichesDeSante]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Fiche supprimée
 */
router.delete("/:id", authMiddleware, deleteFiche);

export default router;
