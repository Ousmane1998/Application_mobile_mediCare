// controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const {
      nom,
      prenom,
      telephone,
      email,
      adresse,
      age,
      password,
      role, // "patient" | "medecin" | "admin"
      specialite,
      hopital,
    } = req.body || {};

    if (!telephone || !password || !nom) {
      return res.status(400).json({ message: "Champs requis manquants (telephone, password, nom)." });
    }

    const existing = await User.findOne({ $or: [{ telephone }, { email }] });
    if (existing) {
      return res.status(400).json({ message: "Utilisateur existant (email ou téléphone)." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      nom,
      prenom,
      telephone,
      email,
      adresse,
      age,
      hopital,
      password: hashed,
      role: role || undefined,
      specialite,
    });

    const token = signToken(user);
    return res.status(201).json({
      message: "Inscription réussie",
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    // Accepte "identifiant" (selon vos routes) ou "identifier" (tolérance front)
    const identifiant = req.body?.identifiant || req.body?.identifier;
    const { password } = req.body || {};

    if (!identifiant || !password) {
      return res.status(400).json({ message: "identifiant et password requis." });
    }

    const user = await User.findOne({
      $or: [{ email: identifiant?.toLowerCase() }, { telephone: identifiant }],
    });
    if (!user) {
      return res.status(400).json({ message: "Identifiants invalides." });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Identifiants invalides." });
    }

    const token = signToken(user);
    return res.json({
      message: "Connexion réussie",
      token,
      role: user.role,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/profile
export async function profile(req, res) {
  if (!req.user) return res.status(401).json({ message: "Non authentifié" });
  return res.json({ user: req.user });
}

// GET /api/auth/logout
export async function logout(req, res) {
  if (!req.user) return res.status(401).json({ message: "Non authentifié" });
  req.logout();
  res.json({ message: "Déconnexion réussie" });
}
