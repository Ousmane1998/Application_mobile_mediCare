// routes/authRoutes.js
import express from "express";
import { register, login, profile, modifyPassword, modifyProfile, logout } from "../controllers/authController.js";
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

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Gestion des utilisateurs
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d’un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Faye
 *               prenom:
 *                 type: string
 *                 example: Ousmane
 *               telephone:
 *                 type: string
 *                 example: "771234567"
 *               email:
 *                 type: string
 *                 example: ousmane@gmail.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès.
 *       400:
 *         description: Erreur de validation.
 */
router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, profile);
router.post("/modifyPassword", authMiddleware, modifyPassword);
router.post("/modifyProfile", authMiddleware, modifyProfile);
router.get("/logout", authMiddleware, logout);

export default router;
