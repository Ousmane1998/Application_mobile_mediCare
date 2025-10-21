import express from "express";
import { getGeolocation } from "../controllers/geolocationController.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Geolocation
 *     description: Géolocalisation et services associés
 *
 * /api/geolocation:
 *   get:
 *     tags: [Geolocation]
 *     summary: Récupérer les informations de géolocalisation
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Position reçue
 *       400:
 *         description: Coordonnées manquantes
 *
 *   post:
 *     tags: [Geolocation]
 *     summary: Envoyer les informations de géolocalisation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Position reçue
 *       400:
 *         description: Coordonnées manquantes
 */

router.get("/", getGeolocation);
router.post("/", getGeolocation);

export default router;
