import express from "express";
import {
  listUsers,
  listMyPatients,
  listPatients,
  listMedecins,
  getUser,
  updateUser,
  archiveUser,
  getStats,
  updateUserRole,
  deleteUser,
} from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

// Toutes les routes nécessitent un token admin
router.use(authMiddleware);

// Liste tous les utilisateurs
router.get("/", listUsers);

// Liste des patients du médecin connecté
router.get("/my-patients", listMyPatients);

// Liste patients
router.get("/patients", listPatients);

// Liste médecins
router.get("/medecins", listMedecins);

// Récupérer un utilisateur par ID
router.get("/:id", getUser);

// Modifier un utilisateur
router.put("/:id", updateUser);

// Archiver un utilisateur
router.put("/archive/:id", archiveUser);

// === Admin-only ===
router.get("/stats", adminMiddleware, getStats);
router.put("/:id/role", adminMiddleware, updateUserRole);
router.delete("/:id", adminMiddleware, deleteUser);

export default router;
