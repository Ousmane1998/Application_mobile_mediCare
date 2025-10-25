// routes/availabilityRoutes.js
import express from "express";
import { setAvailability, getAvailability, updateAvailability, deleteAvailability } from "../controllers/availabilityController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

/**
 * @openapi
 * tags:
 *   - name: Availability
 *     description: Disponibilités des médecins
 * /api/availability:
 *   post:
 *     tags: [Availability]
 *     summary: Définir la disponibilité
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               definitionImport:
 *                 type: string
 *                 format: binary
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
router.use(authMiddleware);

router.post("/", setAvailability);
router.get("/", getAvailability);
router.put("/:id", updateAvailability);
router.delete("/:id", deleteAvailability);

export default router;
