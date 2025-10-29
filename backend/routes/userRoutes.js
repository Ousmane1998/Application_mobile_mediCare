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
  setUserActivation,
} from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

// Toutes les routes nécessitent un token admin
router.use(authMiddleware);

// === Routes spécifiques AVANT les routes paramétrées ===
// Liste tous les utilisateurs
router.get("/", listUsers);

// Liste des patients du médecin connecté
router.get("/my-patients", listMyPatients);

// Liste patients
router.get("/patients", listPatients);

// Liste médecins
router.get("/medecins", listMedecins);

// === Admin-only (AVANT les routes paramétrées) ===
// Endpoint de test - Vérifier l'utilisateur connecté
router.get("/test/me", (req, res) => {
  res.json({ 
    user: req.user ? { 
      id: req.user._id, 
      nom: req.user.nom, 
      prenom: req.user.prenom, 
      role: req.user.role,
      email: req.user.email 
    } : null 
  });
});

// Endpoint de test - Compter les utilisateurs
router.get("/test/count", async (req, res) => {
  try {
    const User = require("../models/User.js").default;
    const total = await User.countDocuments();
    const patients = await User.countDocuments({ role: "patient" });
    const medecins = await User.countDocuments({ role: "medecin" });
    const admins = await User.countDocuments({ role: "admin" });
    console.log('📊 Test count:', { total, patients, medecins, admins });
    res.json({ test: true, total, patients, medecins, admins });
  } catch (err) {
    console.error('❌ Erreur test count:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats", adminMiddleware, getStats);
router.put("/archive/:id", archiveUser);
router.put("/:id/role", adminMiddleware, updateUserRole);
router.put("/:id/activation", adminMiddleware, setUserActivation);
router.delete("/:id", adminMiddleware, deleteUser);

// === Routes paramétrées (À LA FIN pour ne pas capturer les autres) ===
// Récupérer un utilisateur par ID
router.get("/:id", getUser);

// Modifier un utilisateur
router.put("/:id", updateUser);

export default router;
