// routes/authRoutes.js
import express from "express";
import { register, login, profile } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Endpoints d'authentification
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Inscription d'un utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom: { type: string }
 *               prenom: { type: string }
 *               telephone: { type: string }
 *               email: { type: string }
 *               adresse: { type: string }
 *               age: { type: integer }
 *               password: { type: string }
 *               role: { type: string }
 *               specialite: { type: string }
 *               hopital: { type: string }
 *             required: [telephone, password, nom]
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nom: { type: string }
 *               prenom: { type: string }
 *               telephone: { type: string }
 *               email: { type: string }
 *               adresse: { type: string }
 *               age: { type: integer }
 *               password: { type: string }
 *               role: { type: string }
 *               specialite: { type: string }
 *               hopital: { type: string }
 *             required: [telephone, password, nom]
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Requête invalide
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Connexion via email ou téléphone
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifiant:
 *                 type: string
 *                 description: Email ou téléphone
 *               password:
 *                 type: string
 *             required: [identifiant, password]
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               identifiant:
 *                 type: string
 *                 description: Email ou téléphone
 *               password:
 *                 type: string
 *             required: [identifiant, password]
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       400:
 *         description: Identifiants invalides
 * /api/auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Profil de l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil retourné
 *       401:
 *         description: Non authentifié
 */
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, profile);

export default router;
