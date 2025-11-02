// routes/appointmentRoutes.js
import express from "express";
import { createAppointment, getAppointments, getAppointmentById, updateAppointment } from "../controllers/appointmentController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Appointments
 *     description: Gestion des rendez-vous
 *
 * /api/appointments:
 *   post:
 *     tags:
 *       - Appointments
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
 *
 *   get:
 *     tags:
 *       - Appointments
 *     summary: Lister les rendez-vous
 *     responses:
 *       200:
 *         description: Liste des rendez-vous
 *
 * /api/appointments/{id}:
 *   put:
 *     tags:
 *       - Appointments
 *     summary: Mettre à jour un rendez-vous (statut, date, heure)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant unique du rendez-vous
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               statut:
 *                 type: string
 *                 description: "en_attente | confirme | annule"
 *               date:
 *                 type: string
 *                 format: date
 *                 description: "Nouvelle date du rendez-vous"
 *               heure:
 *                 type: string
 *                 description: "Nouvelle heure du rendez-vous"
 *     responses:
 *       200:
 *         description: Rendez-vous mis à jour
 */

router.post("/", authMiddleware, createAppointment);
router.get("/", authMiddleware, getAppointments);
router.get("/:id", authMiddleware, getAppointmentById);
router.put("/:id", authMiddleware, updateAppointment);

export default router;
