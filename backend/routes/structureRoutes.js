import express from "express";
import { getNearbyStructures } from "../controllers/structureController.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Structure
 *     description: Gestion des structures (hôpitaux, pharmacies, postes)
 *
 * /api/structures/nearby:
 *   get:
 *     tags: [Structure]
 *     summary: Récupérer les structures proches via OpenStreetMap
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
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *     responses:
 *       200:
 *         description: Structures trouvées
 */

router.get("/nearby", getNearbyStructures);

export default router;
