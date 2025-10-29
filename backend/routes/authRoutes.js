// routes/authRoutes.js
import express from "express";
import { registerDoctor, registerPatient, login, profile, changePassword, modifyProfile, logout, googleLogin, forgotPassword, resetPassword, updatePhoto } from "../controllers/authController.js";
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

/**
 * @swagger
 * /auth/registerDoctor:
 *   post:
 *     summary: Inscription d'un nouveau médecin
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
 *                 example: Diallo
 *               prenom:
 *                 type: string
 *                 example: Ahmed
 *               telephone:
 *                 type: string
 *                 example: "771234567"
 *               email:
 *                 type: string
 *                 example: ahmed.diallo@hospital.com
 *               adresse:
 *                 type: string
 *                 example: "123 Rue de la Santé, Dakar"
 *               age:
 *                 type: integer
 *                 example: 45
 *               password:
 *                 type: string
 *                 example: "SecurePassword123"
 *               role:
 *                 type: string
 *                 enum: [medecin]
 *                 example: medecin
 *               specialite:
 *                 type: string
 *                 example: Cardiologie
 *               hopital:
 *                 type: string
 *                 example: Hôpital Principal de Dakar
 *             required: [telephone, password, nom]
 *     responses:
 *       201:
 *         description: Médecin créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inscription réussie"
 *                 token:
 *                   type: string
 *                   description: JWT token pour l'authentification
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nom:
 *                       type: string
 *                     prenom:
 *                       type: string
 *                     email:
 *                       type: string
 *                     telephone:
 *                       type: string
 *                     role:
 *                       type: string
 *                     specialite:
 *                       type: string
 *                     hopital:
 *                       type: string
 *       400:
 *         description: Erreur de validation (champs manquants, format invalide, utilisateur existant)
 *       500:
 *         description: Erreur serveur
 */
router.post("/registerDoctor", registerDoctor);
router.post("/login", login);
router.get("/profile", authMiddleware, profile);
router.post("/changePassword", authMiddleware, changePassword);
router.post("/modifyProfile", authMiddleware, modifyProfile);
router.post("/updatePhoto", authMiddleware, updatePhoto);
router.post("/registerPatient", authMiddleware, registerPatient);
router.post("/registerDoctor", authMiddleware, registerDoctor);
router.get("/logout", authMiddleware, logout);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword", resetPassword);

/**
 * @openapi
 * /api/auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Connexion via Google (id_token)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Jeton ID Google retourné par OAuth
 *             required: [idToken]
 *     responses:
 *       200:
 *         description: Connexion Google réussie
 *       400:
 *         description: Requête invalide
 *       500:
 *         description: Erreur serveur
 */
router.post("/google", googleLogin);

export default router;
