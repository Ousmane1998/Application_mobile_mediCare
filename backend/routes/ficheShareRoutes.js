// @ts-nocheck
// routes/ficheShareRoutes.js
import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { generateFicheShareToken } from '../controllers/shareController.js';

const router = express.Router();

// Générer un token de partage (valide 1 jour)
router.post('/share-token', authMiddleware, generateFicheShareToken);

export default router;
