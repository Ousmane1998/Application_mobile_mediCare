// routes/appointmentRoutes.js
import express from "express";
import { createAppointment, getAppointments, updateAppointmentStatus } from "../controllers/appointmentController.js";

/**
 * @openapi
 * tags:
 *   - name: Appointments
 *     description: Gestion des rendez-vous
 * /api/appointments:
 *   post:
 *     tags: [Appointments]
 *     summary: Créer un rendez-vous
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Rendez-vous créé
 *   get:
 *     tags: [Appointments]
 *     summary: Lister les rendez-vous
 *     responses:
 *       200:
 *         description: Liste des rendez-vous
 * /api/appointments/{id}/status:
 *   put:
 *     tags: [Appointments]
 *     summary: Mettre à jour le statut d'un rendez-vous
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Statut mis à jour
 */
const router = express.Router();

router.post("/", createAppointment);
router.get("/", getAppointments);
router.put("/:id/status", updateAppointmentStatus);

export default router;
