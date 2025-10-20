// routes/geolocationRoutes.js
import express from "express";
import { getGeolocation } from "../controllers/geolocationController.js";

/**
 * @openapi
 * tags:
 *   - name: Geolocation
 *     description: Géolocalisation et services associés
 * /api/geolocation:
 *   get:
 *     tags: [Geolocation]
 *     summary: Récupérer les informations de géolocalisation
 *     responses:
 *       200:
 *         description: Informations de géolocalisation
 */
const router = express.Router();

router.get("/", getGeolocation);

export default router;
