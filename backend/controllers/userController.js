// @ts-nocheck
import User from "../models/User.js";
import nodemailer from 'nodemailer';

function getMailer() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
  } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return null;
  const transporter = SMTP_HOST && SMTP_PORT
    ? nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })
    : nodemailer.createTransport({ service: 'gmail', auth: { user: SMTP_USER, pass: SMTP_PASS } });
  const from = SMTP_FROM || `"MediCare" <${SMTP_USER}>`;
  return { transporter, from };
}

// Lister tous les utilisateurs
export const listUsers = async (req, res) => {
  try {
    const users = await User.find({ archived: { $ne: true } });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lister les patients du médecin connecté
export const listMyPatients = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'medecin') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const patients = await User.find({ role: 'patient', medecinId: req.user._id, archived: { $ne: true } });
    res.status(200).json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lister les patients
export const listPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: "patient", archived: { $ne: true } });
    res.status(200).json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lister les médecins
export const listMedecins = async (req, res) => {
  try {
    const medecins = await User.find({ role: "medecin", archived: { $ne: true } });
    res.status(200).json(medecins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupérer un utilisateur par ID
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Modifier un utilisateur
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedUser) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Archiver un utilisateur
export const archiveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const archivedUser = await User.findByIdAndUpdate(id, { archived: true }, { new: true });
    if (!archivedUser) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.status(200).json({ message: "Utilisateur archivé", user: archivedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const total = await User.countDocuments({ archived: { $ne: true } });
    const patients = await User.countDocuments({ role: "patient", archived: { $ne: true } });
    const medecins = await User.countDocuments({ role: "medecin", archived: { $ne: true } });
    const admins = await User.countDocuments({ role: "admin", archived: { $ne: true } });
    const pendingMedecins = await User.countDocuments({ role: 'medecin', archived: { $ne: true }, $or: [{ active: false }, { status: { $ne: 'active' } }] });
    res.status(200).json({ total, patients, medecins, admins, pendingMedecins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    if (!role || !["patient", "medecin", "admin"].includes(String(role))) {
      return res.status(400).json({ message: "Rôle invalide" });
    }
    const updated = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!updated) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.status(200).json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: activer/désactiver un utilisateur (ex: médecin)
export const setUserActivation = async (req, res) => {
  try {
    const { id } = req.params;
    const { active, status } = req.body || {};
    const update = {};
    if (typeof active !== 'undefined') update.active = !!active;
    if (typeof status === 'string') update.status = status;
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'Aucun champ d\'activation fourni' });
    }
    const before = await User.findById(id);
    if (!before) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    const wasActive = (before.active === true) || (String(before.status || '').toLowerCase() === 'active');
    const updated = await User.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    const isNowActive = (updated.active === true) || (String(updated.status || '').toLowerCase() === 'active');

    // If just activated and has email, try to send notification
    if (!wasActive && isNowActive && updated.email) {
      const mailer = getMailer();
      if (mailer) {
        try {
          await mailer.transporter.sendMail({
            from: mailer.from,
            to: updated.email,
            subject: 'Votre compte Médecin est activé',
            text: `Bonjour ${updated.prenom || ''} ${updated.nom || ''},\n\nVotre compte Médecin sur MediCare a été activé. Vous pouvez maintenant vous connecter et accéder à votre tableau de bord.\n\nCordialement,\nL'équipe MediCare`,
            html: `<p>Bonjour ${updated.prenom || ''} ${updated.nom || ''},</p>
                   <p>Votre compte <b>Médecin</b> sur <b>MediCare</b> a été <b>activé</b>.</p>
                   <p>Vous pouvez maintenant vous connecter et accéder à votre tableau de bord.</p>
                   <p>Cordialement,<br/>L'équipe MediCare</p>`,
          });
        } catch (e) {
          // log but do not fail the API response
          console.log('⚠️ Email activation non envoyé:', e?.message);
        }
      }
    }
    res.status(200).json({ message: 'Activation mise à jour', user: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
