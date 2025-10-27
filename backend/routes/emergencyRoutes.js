// @ts-nocheck
import express from 'express';
import { sendEmergencyAlert, getEmergencyAlerts, getEmergencyAlertDetail } from '../controllers/emergencyController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// POST /api/emergency/alert - Envoyer une alerte SOS
router.post('/alert', sendEmergencyAlert);

// GET /api/emergency/alerts - Récupérer les alertes SOS (médecin)
router.get('/alerts', authMiddleware, getEmergencyAlerts);

// GET /api/emergency/alerts/:id - Récupérer les détails d'une alerte
router.get('/alerts/:id', authMiddleware, getEmergencyAlertDetail);

export default router;
