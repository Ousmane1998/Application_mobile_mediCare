// controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import PasswordReset from "../models/PasswordReset.js";
import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";

import { tokenBlacklist } from "../middlewares/tokenBlacklist.js";

const signToken = (user) => {
  // @ts-ignore
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const emailRegex = /^\S+@\S+\.\S+$/;
const phoneRegex = /^7\d{8}$/;

// Cloudinary config (optional)
if (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// POST /api/auth/registerPatient (protected: medecin/admin)
export async function registerPatient(req, res) {
  try {
    if (!req.user || !['medecin', 'admin'].includes(String(req.user.role))) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    const { nom, prenom, email, telephone, adresse, age, hopital } = req.body || {};
    if (!nom || !prenom || !email || !telephone) {
      return res.status(400).json({ message: "Champs requis: nom, prenom, email, telephone." });
    }
    if (!emailRegex.test(String(email))) {
      return res.status(400).json({ message: "Format email invalide. Format attendu: string@string.string." });
    }
    if (!phoneRegex.test(String(telephone))) {
      return res.status(400).json({ message: "Format téléphone invalide. Format attendu: 7XXXXXXXX." });
    }

    const exists = await User.findOne({ $or: [{ email: String(email).toLowerCase() }, { telephone }] });
    if (exists) {
      return res.status(400).json({ message: "Un utilisateur avec cet email ou téléphone existe déjà." });
    }

    const defaultPassword = "medicare@123";
    const hashed = await bcrypt.hash(defaultPassword, 10);
    const user = await User.create({
      nom,
      prenom,
      email: String(email).toLowerCase(),
      telephone,
      adresse: adresse || "",
      age: age || undefined,
      hopital: hopital || "",
      password: hashed,
      role: 'patient',
    });

    // Send email with credentials and track status
    let emailSent = false;
    const mailer = getMailer();
    if (mailer) {
      try {
        await mailer.transporter.sendMail({
          from: mailer.from,
          to: user.email,
          subject: 'Votre compte MediCare',
          text: `Bonjour ${user.prenom || ''} ${user.nom || ''},\n\nVotre compte MediCare a été créé.\nIdentifiant: ${user.email || user.telephone}\nMot de passe: ${defaultPassword}\n\nPar mesure de sécurité, veuillez changer votre mot de passe dès votre première connexion.`,
          html: `<p>Bonjour ${user.prenom || ''} ${user.nom || ''},</p>
                 <p>Votre compte <b>MediCare</b> a été créé.</p>
                 <p><b>Identifiant</b>: ${user.email || user.telephone}<br/>
                 <b>Mot de passe</b>: ${defaultPassword}</p>
                 <p><i>Par mesure de sécurité, veuillez changer votre mot de passe dès votre première connexion.</i></p>`,
        });
        emailSent = true;
      } catch (e) {
        emailSent = false; // email non envoyé, mais compte créé
      }
    }

    return res.status(201).json({
      message: emailSent ? 'Patient créé avec succès. Un email a été envoyé avec les identifiants. Pensez à changer le mot de passe.' : "Patient créé avec succès. L'email n'a pas pu être envoyé, communiquez-lui ses identifiants et demandez-lui de changer le mot de passe dès la première connexion.",
      emailSent,
      user: { id: user._id, nom: user.nom, prenom: user.prenom, email: user.email, telephone: user.telephone, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ message: "Erreur lors de la création du patient." });
  }
}

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

    if (!phoneRegex.test(String(telephone))) {
      return res.status(400).json({ message: "Format téléphone invalide. Format attendu: 7XXXXXXXX." });
    }
    if (email && !emailRegex.test(String(email))) {
      return res.status(400).json({ message: "Format email invalide. Format attendu: string@string.string." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères." });
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

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères." });
    }

    const isEmail = String(identifiant).includes("@");
    if (isEmail) {
      if (!emailRegex.test(String(identifiant))) {
        return res.status(400).json({ message: "Format email invalide. Format attendu: string@string.string." });
      }
    } else {
      if (!phoneRegex.test(String(identifiant))) {
        return res.status(400).json({ message: "Format téléphone invalide. Format attendu: 7XXXXXXXX." });
      }
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

export async function logout(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(400).json({ message: "No token" });

  const token = authHeader.split(" ")[1];
  tokenBlacklist.push(token); // ajoute le token à la blacklist
  res.json({ message: "Déconnexion réussie, token invalidé côté serveur." });
}

// POST /api/auth/changePassword
export async function changePassword(req, res) {
  try {
    const { oldPassword, password } = req.body || {};
    if (!oldPassword || !password) {
      return res.status(400).json({ message: "oldPassword et password sont requis." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères." });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(400).json({ message: "Utilisateur non trouvé." });
    }
    const ok = await bcrypt.compare(String(oldPassword), user.password);
    if (!ok) {
      return res.status(400).json({ message: "Ancien mot de passe incorrect." });
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
  console.log("req.user :", req.user);

  try {
    const { nom, prenom, email, adresse, age, telephone } = req.body || {};
    if (!nom || !prenom || !email || !adresse || !age || !telephone) {
      return res.status(400).json({ message: "Champs requis manquants (nom, prenom, email, adresse, age, telephone)." });
    }
    if (!emailRegex.test(String(email))) {
      return res.status(400).json({ message: "Format email invalide. Format attendu: string@string.string." });
    }
    if (!phoneRegex.test(String(telephone))) {
      return res.status(400).json({ message: "Format téléphone invalide. Format attendu: 7XXXXXXXX." });
    }
    const user = await User.findById(req.user._id);
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

// POST /api/auth/updatePhoto
export async function updatePhoto(req, res) {
  try {
    const { photo } = req.body || {};
    if (!photo) return res.status(400).json({ message: "Photo requise." });

    // Accept data URL or raw base64
    let mime = "";
    let base64Data = "";
    const m = String(photo).match(/^data:(.+);base64,(.+)$/);
    if (m) {
      mime = m[1];
      base64Data = m[2];
    } else {
      mime = "image/jpeg";
      base64Data = String(photo);
    }

    // Validate MIME
    const allowed = ["image/jpeg", "image/png"]; 
    if (!allowed.includes(mime)) {
      return res.status(400).json({ message: "Type d'image invalide. Formats autorisés: JPEG, PNG." });
    }

    // Validate size <= 2MB
    try {
      const buf = Buffer.from(base64Data, 'base64');
      if (buf.length > 2 * 1024 * 1024) {
        return res.status(400).json({ message: "Image trop volumineuse (max 2MB)." });
      }
    } catch {
      return res.status(400).json({ message: "Image invalide." });
    }

    // Ensure Cloudinary configured
    // cloudinary is imported and configured at top if env present
    // @ts-ignore
    if (!require('cloudinary').v2.config().cloud_name) {
      return res.status(500).json({ message: "Stockage externe non configuré (Cloudinary)." });
    }

    // Upload
    const uploadRes = await (await import('cloudinary')).v2.uploader.upload(`data:${mime};base64,${base64Data}` , {
      folder: 'medicare/avatars',
      resource_type: 'image',
      overwrite: true,
      transformation: [{ width: 512, height: 512, crop: 'limit' }],
    });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ message: "Utilisateur non trouvé." });
    user.photo = uploadRes.secure_url;
    await user.save();
    return res.json({ message: "Photo modifiée avec succès.", photo: user.photo });
  } catch (err) {
    return res.status(500).json({ message: "Erreur lors de la modification de la photo." });
  }
}

// Email transport (optional). If env is missing, we fallback to console log.
function getMailer() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) return null;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return { transporter, from: SMTP_FROM };
}

// POST /api/auth/forgotPassword (email only)
export async function forgotPassword(req, res) {
  try {
    const email = req.body?.identifier || req.body?.email;
    if (!email || !emailRegex.test(String(email))) {
      return res.status(400).json({ message: "Email valide requis." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await PasswordReset.deleteMany({ identifier: email.toLowerCase() });
    await PasswordReset.create({ identifier: email.toLowerCase(), codeHash, expiresAt });

    const mailer = getMailer();
    if (mailer) {
      await mailer.transporter.sendMail({
        from: mailer.from,
        to: email,
        subject: "Votre code de réinitialisation",
        text: `Votre code est ${code}. Il expire dans 10 minutes.`,
        html: `<p>Votre code est <b>${code}</b>. Il expire dans 10 minutes.</p>`,
      });
    } else {
      // eslint-disable-next-line no-console
      console.log(`[PasswordReset] Code for ${email}: ${code} (expires 10min)`);
    }

    return res.json({ message: "Si un compte existe, un email avec un code a été envoyé." });
  } catch (err) {
    return res.status(500).json({ message: "Erreur lors de la demande de réinitialisation." });
  }
}

// POST /api/auth/resetPassword (email only)
export async function resetPassword(req, res) {
  try {
    const { identifier, email, code, newPassword } = req.body || {};
    const targetEmail = (email || identifier || "").toLowerCase();
    if (!targetEmail || !emailRegex.test(String(targetEmail))) {
      return res.status(400).json({ message: "Email valide requis." });
    }
    if (!code || !newPassword) {
      return res.status(400).json({ message: "code et newPassword requis." });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères." });
    }

    const pr = await PasswordReset.findOne({ identifier: targetEmail });
    if (!pr || pr.expiresAt < new Date()) {
      if (pr) await PasswordReset.deleteOne({ _id: pr._id });
      return res.status(400).json({ message: "Code invalide ou expiré." });
    }
    const ok = await bcrypt.compare(String(code), pr.codeHash);
    if (!ok) return res.status(400).json({ message: "Code invalide." });

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      await PasswordReset.deleteOne({ _id: pr._id });
      return res.status(400).json({ message: "Utilisateur introuvable." });
    }

    user.password = await bcrypt.hash(String(newPassword), 10);
    await user.save();
    await PasswordReset.deleteOne({ _id: pr._id });

    return res.json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (err) {
    return res.status(500).json({ message: "Erreur lors de la réinitialisation du mot de passe." });
  }
}