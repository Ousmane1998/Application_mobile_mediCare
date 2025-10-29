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
    console.log('👥 [Admin] Récupération de la liste des utilisateurs...');
    console.log('🔐 Utilisateur connecté:', req.user ? `${req.user.prenom} ${req.user.nom} (${req.user.role})` : 'AUCUN');
    const users = await User.find({ archived: { $ne: true } });
    console.log(`✅ ${users.length} utilisateurs trouvés:`, users.map(u => ({ _id: u._id, nom: u.nom, prenom: u.prenom, role: u.role })));
    res.status(200).json(users);
  } catch (err) {
    console.error('❌ Erreur listUsers:', err.message);
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
    const { nom, prenom, email, telephone, role, specialite, hopital, pathologie } = req.body || {};
    console.log(`✏️ [Admin] Modification de l'utilisateur ${id}:`, { nom, prenom, email, telephone, role });
    
    const update = {};
    if (nom) update.nom = nom;
    if (prenom) update.prenom = prenom;
    if (email) update.email = email;
    if (telephone) update.telephone = telephone;
    if (role) update.role = role;
    if (specialite) update.specialite = specialite;
    if (hopital) update.hopital = hopital;
    if (pathologie) update.pathologie = pathologie;

    const updatedUser = await User.findByIdAndUpdate(id, update, { new: true });
    if (!updatedUser) {
      console.warn(`⚠️ Utilisateur non trouvé: ${id}`);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    console.log(`✅ Utilisateur modifié: ${id}`);
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error('❌ Erreur updateUser:', err.message);
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
    console.log('📊 [Admin] Récupération des stats...');
    console.log('🔐 Utilisateur connecté:', req.user ? `${req.user.prenom} ${req.user.nom} (${req.user.role})` : 'AUCUN');
    
    // Compter tous les utilisateurs sans filtre d'abord
    const allUsers = await User.countDocuments();
    console.log('📋 Total utilisateurs en BD:', allUsers);
    
    const total = await User.countDocuments({ archived: { $ne: true } });
    const patients = await User.countDocuments({ role: "patient", archived: { $ne: true } });
    const medecins = await User.countDocuments({ role: "medecin", archived: { $ne: true } });
    const admins = await User.countDocuments({ role: "admin", archived: { $ne: true } });
    const pendingMedecins = await User.countDocuments({ role: 'medecin', archived: { $ne: true }, $or: [{ active: false }, { status: { $ne: 'active' } }] });
    
    console.log('✅ Stats:', { total, patients, medecins, admins, pendingMedecins });
    res.status(200).json({ total, patients, medecins, admins, pendingMedecins });
  } catch (err) {
    console.error('❌ Erreur getStats:', err.message);
    console.error('❌ Stack:', err.stack);
    res.status(500).json({ message: err.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    console.log(`👤 [Admin] Modification du rôle de ${id} vers ${role}`);
    if (!role || !["patient", "medecin", "admin"].includes(String(role))) {
      console.warn(`⚠️ Rôle invalide: ${role}`);
      return res.status(400).json({ message: "Rôle invalide" });
    }
    const updated = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!updated) {
      console.warn(`⚠️ Utilisateur non trouvé: ${id}`);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    console.log(`✅ Rôle modifié: ${id} → ${role}`);
    res.status(200).json(updated);
  } catch (err) {
    console.error('❌ Erreur updateUserRole:', err.message);
    res.status(500).json({ message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ [Admin] Suppression de l'utilisateur: ${id}`);
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      console.warn(`⚠️ Utilisateur non trouvé: ${id}`);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    console.log(`✅ Utilisateur supprimé: ${id}`);
    res.status(200).json({ message: "Utilisateur supprimé" });
  } catch (err) {
    console.error('❌ Erreur deleteUser:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Admin: activer/désactiver un utilisateur (ex: médecin)
export const setUserActivation = async (req, res) => {
  try {
    const { id } = req.params;
    const { active, status } = req.body || {};
    console.log(`🔐 [Admin] Activation de ${id}:`, { active, status });
    const update = {};
    if (typeof active !== 'undefined') update.active = !!active;
    if (typeof status === 'string') update.status = status;
    if (Object.keys(update).length === 0) {
      console.warn(`⚠️ Aucun champ d'activation fourni`);
      return res.status(400).json({ message: 'Aucun champ d\'activation fourni' });
    }
    const before = await User.findById(id);
    if (!before) {
      console.warn(`⚠️ Utilisateur non trouvé: ${id}`);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    const wasActive = (before.active === true) || (String(before.status || '').toLowerCase() === 'active');
    const updated = await User.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      console.warn(`⚠️ Utilisateur non trouvé après update: ${id}`);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    const isNowActive = (updated.active === true) || (String(updated.status || '').toLowerCase() === 'active');
    console.log(`✅ Activation mise à jour: ${id} (${wasActive} → ${isNowActive})`);

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
