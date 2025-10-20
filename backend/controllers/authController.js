// controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Inscription
export const register = async (req, res) => {
  try {
    const { nom, prenom, telephone, adresse, age, email, password, role, specialite, hopital } = req.body;

    if (!telephone || !password || !nom)
      return res.status(400).json({ message: "Veuillez remplir tous les champs obligatoires." });

    const existingPhone = await User.findOne({ telephone });
    if (existingPhone)
      return res.status(400).json({ message: "Ce numéro de téléphone est déjà enregistré." });

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail)
        return res.status(400).json({ message: "Cet email est déjà enregistré." });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      nom,
      prenom,
      telephone,
      email,
      adresse,
      age,
      password: hashed,
      role,
      specialite,
      hopital,
    });

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      userId: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de l’inscription." });
  }
};

// Connexion
export const login = async (req, res) => {
  try {
    const { identifiant, password } = req.body;

    if (!identifiant || !password)
      return res.status(400).json({ message: "Identifiant et mot de passe requis." });

    const user = await User.findOne({
      $or: [{ telephone: identifiant }, { email: identifiant }],
    });

    if (!user) return res.status(400).json({ message: "Identifiant ou mot de passe invalide." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Identifiant ou mot de passe invalide." });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user._id,
        nom: user.nom,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
};

// Profil utilisateur connecté
export const profile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur lors de la récupération du profil." });
  }
};
