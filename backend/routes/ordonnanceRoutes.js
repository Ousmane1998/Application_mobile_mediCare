// routes/ordonnanceRoutes.js
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getAllOrdonnances,
  createOrdonnance,
  deleteOrdonnance,
} from "../controllers/ordonnanceController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Ordonnances
 *   description: Gestion des ordonnances médicales
 */

/**
 * @swagger
 * /api/ordonnances:
 *   get:
 *     summary: Récupérer toutes les ordonnances
 *     tags: [Ordonnances]
 *     responses:
 *       200:
 *         description: Liste des ordonnances
 */
router.get("/", authMiddleware, getAllOrdonnances);

/**
 * @swagger
 * /api/ordonnances:
 *   post:
 *     summary: Créer une nouvelle ordonnance
 *     tags: [Ordonnances]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ordonnance'
 *     responses:
 *       201:
 *         description: Ordonnance créée
 */
router.post("/", authMiddleware, createOrdonnance);

/**
 * @swagger
 * /api/ordonnances/{id}:
 *   delete:
 *     summary: Supprimer une ordonnance
 *     tags: [Ordonnances]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Ordonnance supprimée
 */
router.delete("/:id", authMiddleware, deleteOrdonnance);

export default router;
