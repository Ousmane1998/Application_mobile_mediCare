// routes/appointmentRoutes.js
import express from "express";
import { createAppointment, getAppointments, updateAppointmentStatus } from "../controllers/appointmentController.js";

const router = express.Router();

router.post("/", createAppointment);
router.get("/", getAppointments);
router.put("/:id/status", updateAppointmentStatus);

export default router;
