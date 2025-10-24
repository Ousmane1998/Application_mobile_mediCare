import express from "express";
import {
  listUsers,
  listMyPatients,
  listPatients,
  listMedecins,
  updateUser,
  archiveUser,
} from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

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

// Modifier un utilisateur
router.put("/:id", updateUser);

// Archiver un utilisateur
router.put("/archive/:id", archiveUser);

export default router;
