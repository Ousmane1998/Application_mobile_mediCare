// @ts-nocheck
// controllers/adviceController.js
import Advice from "../models/Advice.js";
import User from "../models/User.js";

export const createAdvice = async (req, res) => {
  try {
    const { medecinId, patientId, titre, contenu, categorie } = req.body;
    if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
    if (!medecinId || !patientId) {
      return res.status(400).json({ message: "medecinId et patientId sont obligatoires" });
    }
    // Seul un médecin connecté (ou admin) peut créer, et medecinId doit correspondre
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && req.user.role !== 'medecin') {
      return res.status(403).json({ message: 'Seul un médecin peut créer un conseil' });
    }
    if (!isAdmin && String(medecinId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'medecinId doit être l’utilisateur connecté' });
    }
    // Vérifier que le patient est rattaché au médecin
    const patient = await User.findById(patientId).select('medecinId');
    if (!patient) return res.status(404).json({ message: 'Patient introuvable' });
    if (!isAdmin && String(patient.medecinId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Patient non rattaché à ce médecin' });
    }

    const advice = await Advice.create({ medecinId, patientId, titre, contenu, categorie });

    res.status(201).json({ message: "Conseil créé", advice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getAdvice = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
    // Récupérer patientId depuis les params ou query
    const patientId = req.params.patientId || req.query.patientId;
    console.log("📥 [getAdvice] Récupération des conseils pour patientId :", patientId);
    console.log("📥 [getAdvice] req.params :", req.params);
    console.log("📥 [getAdvice] req.query :", req.query);
    
    if (!patientId) {
      console.log("❌ [getAdvice] patientId manquant");
      return res.status(400).json({ message: "patientId est requis" });
    }
    
    // Vérifier que patientId est un ObjectId valide
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("⚠️ [getAdvice] patientId n'est pas un ObjectId valide :", patientId);
    }
    
    // Rôles: patient ne voit que ses conseils; médecin voit ses patients; admin tout
    const me = req.user;
    const isAdmin = me.role === 'admin';
    if (me.role === 'patient' && String(patientId) !== String(me._id)) {
      return res.status(403).json({ message: 'Interdit' });
    }
    if (me.role === 'medecin' && !isAdmin) {
      const patient = await User.findById(patientId).select('medecinId');
      if (!patient || String(patient.medecinId) !== String(me._id)) {
        return res.status(403).json({ message: 'Interdit' });
      }
    }

    // ✅ Filtrer par patientId
    const advices = await Advice.find({ patientId })
      .populate('medecinId', 'nom prenom email')
      .populate('patientId', 'nom prenom email')
      .sort({ createdAt: -1 });

    console.log("✅ [getAdvice] Conseils trouvés :", advices.length);
    console.log("📋 [getAdvice] Détails des conseils :", JSON.stringify(advices, null, 2));
    
    res.json(advices || []);
  } catch (err) {
    console.error("❌ [getAdvice] Erreur :", err.message);
    console.error("❌ [getAdvice] Stack :", err.stack);
    res.status(500).json({ message: err.message });
  }
};
