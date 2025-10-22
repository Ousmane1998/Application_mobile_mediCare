// controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";

const signToken = (user) => {
  // @ts-ignore
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// POST /api/auth/register
export async function register(req, res) {
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
    return res.status(500).json({ message: "Erreur lors de l'inscription." });
  }
}

// POST /api/auth/googleLogin
export async function googleLogin(req, res) {
  try {
    const idToken = req.body?.idToken;
    if (!idToken) return res.status(400).json({ message: "idToken requis." });

    const idsRaw = process.env.GOOGLE_CLIENT_IDS || "";
    const audiences = (idsRaw ? idsRaw.split(",") : []).map((s) => s.trim()).filter(Boolean);
    const singleId = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID.trim();
    if (!audiences.length && singleId) audiences.push(singleId);
    if (!audiences.length) return res.status(500).json({ message: "Configuration Google manquante (GOOGLE_CLIENT_ID[S])." });

    const client = new OAuth2Client(audiences[0]);
    const ticket = await client.verifyIdToken({ idToken, audience: audiences });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ message: "Token Google invalide." });

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        nom: (payload.family_name || "").trim() || "",
        prenom: (payload.given_name || "").trim() || "",
        email,
        telephone: "",
        adresse: "",
        age: undefined,
        // @ts-ignore
        password: await bcrypt.hash(jwt.sign({ s: payload.sub }, process.env.JWT_SECRET), 10),
        role: "patient",
      });
    }
    
    // @ts-ignore
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({
      message: "Connexion Google réussie",
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
    return res.status(500).json({ message: "Erreur lors de la connexion Google." });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
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
    return res.status(500).json({ message: "Erreur lors de la connexion." });
  }
}

// GET /api/auth/profile
export async function profile(req, res) {
  if (!req.user) return res.status(401).json({ message: "Non authentifié" });
  return res.json({ user: req.user });
}

// GET /api/auth/logout
export async function logout(req, res) {
  // Optionnel : tu peux invalider le token côté serveur si tu utilises une blacklist
  return res.json({ message: "Déconnexion réussie" });
}

// POST /api/auth/changePassword
export async function changePassword(req, res) {
  try {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ message: "password requis." });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(400).json({ message: "Utilisateur non trouvé." });
    }
    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    await user.save();
    return res.json({ message: "Mot de passe modifié avec succès." });
  } catch (err) {
    return res.status(500).json({ message: "Erreur lors de la modification du mot de passe." });
  }
}

// POST /api/auth/modifyProfile
export async function modifyProfile(req, res) {
  try {
    const { nom, prenom, email, adresse, age, telephone } = req.body || {};
    if (!nom || !prenom || !email || !adresse || !age || !telephone) {
      return res.status(400).json({ message: "Remplir tous les champs." });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(400).json({ message: "Utilisateur non trouvé." });
    }
    user.nom = nom;
    user.prenom = prenom;
    user.email = email;
    user.adresse = adresse;
    user.age = age;
    user.telephone = telephone;
    await user.save();
    return res.json({ message: "Profil modifié avec succès." });
  } catch (err) {
    return res.status(500).json({ message: "Erreur lors de la modification du profil." });
  }
}
