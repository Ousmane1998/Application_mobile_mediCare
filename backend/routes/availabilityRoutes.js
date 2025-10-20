// routes/availabilityRoutes.js
import express from "express";
import { setAvailability, getAvailability } from "../controllers/availabilityController.js";

/**
 * @openapi
 * tags:
 *   - name: Availability
 *     description: Disponibilités des médecins
 * /api/availability:
 *   post:
 *     tags: [Availability]
 *     summary: Définir la disponibilité
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Disponibilité enregistrée
 *   get:
 *     tags: [Availability]
 *     summary: Récupérer les disponibilités
 *     responses:
 *       200:
 *         description: Liste des disponibilités
 */
const router = express.Router();

router.post("/", setAvailability);
router.get("/", getAvailability);

export default router;
