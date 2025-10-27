// @ts-nocheck
import jwt from 'jsonwebtoken';
import FicheDeSante from '../models/FicheDeSante.js';
import User from '../models/User.js';

// Generate a 1-day share token for health record (fiche)
export const generateFicheShareToken = async (req, res) => {
  try {
    const user = req.user; // set by authMiddleware
    if (!user) return res.status(401).json({ message: 'Non autorisé' });

    let patientId = String(user._id);

    // Allow doctor/admin to generate for a specific patient if provided
    if ((user.role === 'medecin' || user.role === 'admin') && req.body?.patientId) {
      patientId = String(req.body.patientId);
      const patient = await User.findById(patientId).lean();
      if (!patient) return res.status(404).json({ message: 'Patient introuvable' });
    }

    // Ensure fiche exists (optional)
    const fiche = await FicheDeSante.findOne({ patient: patientId }).lean();
    if (!fiche) return res.status(404).json({ message: 'Fiche de santé introuvable' });

    const payload = { scope: 'fiche_share', patientId };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    return res.status(201).json({ token, expiresIn: 86400 });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Public view using token
export const publicViewFiche = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Token manquant');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.scope !== 'fiche_share') return res.status(403).send('Portée invalide');

    const fiche = await FicheDeSante.findOne({ patient: decoded.patientId })
      .populate('patient', 'nom prenom email')
      .lean();
    if (!fiche) return res.status(404).send('Fiche non trouvée');

    // If JSON requested
    const accept = (req.headers['accept'] || '').toLowerCase();
    if (accept.includes('application/json')) return res.json({ fiche });

    const title = 'Fiche de santé';
    const patientName = `${fiche.patient?.prenom || ''} ${fiche.patient?.nom || ''}`.trim();
    const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
  h1 { font-size: 20px; }
  .muted { color: #6B7280; }
  .sec { margin-top: 16px; }
  ul { margin: 6px 0 0 18px; }
  .card { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin: 12px 0; }
</style>
</head>
<body>
  <h1>Fiche de santé — ${patientName || 'Patient'}</h1>
  <div class="muted">Accès public via lien sécurisé (exp. 24h)</div>
  <div class="card">
    <div class="sec"><b>Groupe sanguin</b><br/>${fiche.groupeSanguin || '—'}</div>
    <div class="sec"><b>Allergies</b><ul>${(fiche.allergies || []).map(a => `<li>${a}</li>`).join('') || '<li>Aucune</li>'}</ul></div>
    <div class="sec"><b>Maladies</b><ul>${(fiche.maladies || []).map(m => `<li>${m}</li>`).join('') || '<li>Aucune</li>'}</ul></div>
    <div class="sec"><b>Traitements</b><ul>${(fiche.traitements || []).map(t => `<li>${t}</li>`).join('') || '<li>Aucun</li>'}</ul></div>
    <div class="sec"><b>Antécédents</b><ul>${(fiche.antecedents || []).map(t => `<li>${t}</li>`).join('') || '<li>Aucun</li>'}</ul></div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) {
    if (err?.name === 'TokenExpiredError') return res.status(401).send('Lien expiré');
    return res.status(500).send('Erreur serveur');
  }
};
