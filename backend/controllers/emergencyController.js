// @ts-nocheck
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser } from '../utils/sendNotification.js';

/**
 * POST /api/emergency/alert
 * Envoyer une alerte SOS au médecin
 */
export async function sendEmergencyAlert(req, res) {
  try {
    const { patientId, medecinId, location, lastMeasure, patientInfo, doctorInfo, timestamp } = req.body || {};

    if (!patientId || !medecinId) {
      return res.status(400).json({ message: 'patientId et medecinId requis.' });
    }

    console.log('🚨 [Emergency] Alerte SOS reçue');
    console.log('📍 Patient:', patientId);
    console.log('👨‍⚕️ Médecin:', medecinId);
    console.log('📍 Position:', location);
    console.log('📊 Dernière mesure:', lastMeasure);

    // Créer la notification pour le médecin
    const notification = await Notification.create({
      medecinId,
      patientId,
      type: 'emergency',
      title: `🚨 Alerte SOS de ${patientInfo?.prenom} ${patientInfo?.nom}`,
      message: `Alerte d'urgence reçue à ${new Date(timestamp).toLocaleString('fr-FR')}`,
      data: {
        patientInfo,
        location,
        lastMeasure,
        doctorInfo,
        timestamp
      },
      isRead: false
    });

    console.log('✅ Notification créée:', notification._id);

    // Émettre l'événement socket au médecin
    try {
      await emitToUser(medecinId, 'emergency', {
        emergencyId: notification._id,
        patientId,
        patientInfo,
        location,
        lastMeasure,
        doctorInfo,
        timestamp,
        message: `🚨 Alerte SOS de ${patientInfo?.prenom} ${patientInfo?.nom}`
      });
      console.log('📡 Événement socket émis au médecin');
    } catch (e) {
      console.error('⚠️ Erreur émission socket:', e.message);
    }

    // Envoyer un email au médecin (optionnel)
    try {
      const doctor = await User.findById(medecinId);
      if (doctor?.email) {
        // TODO: Implémenter l'envoi d'email
        console.log('📧 Email à envoyer à:', doctor.email);
      }
    } catch (e) {
      console.error('⚠️ Erreur email:', e.message);
    }

    return res.json({
      message: '✅ Alerte SOS envoyée avec succès',
      notificationId: notification._id
    });
  } catch (err) {
    console.error('🔥 Erreur urgence:', err);
    return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'alerte.' });
  }
}

/**
 * GET /api/emergency/alerts
 * Récupérer les alertes SOS pour un médecin
 */
export async function getEmergencyAlerts(req, res) {
  try {
    const medecinId = req.user?.id;
    if (!medecinId) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    const alerts = await Notification.find({
      medecinId,
      type: 'emergency'
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json(alerts);
  } catch (err) {
    console.error('🔥 Erreur récupération alertes:', err);
    return res.status(500).json({ message: 'Erreur lors de la récupération des alertes.' });
  }
}

/**
 * GET /api/emergency/alerts/:id
 * Récupérer les détails d'une alerte SOS
 */
export async function getEmergencyAlertDetail(req, res) {
  try {
    const { id } = req.params;
    const medecinId = req.user?.id;

    if (!medecinId) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    const alert = await Notification.findOne({
      _id: id,
      medecinId,
      type: 'emergency'
    });

    if (!alert) {
      return res.status(404).json({ message: 'Alerte non trouvée.' });
    }

    // Marquer comme lue
    if (!alert.isRead) {
      alert.isRead = true;
      await alert.save();
    }

    return res.json(alert);
  } catch (err) {
    console.error('🔥 Erreur détail alerte:', err);
    return res.status(500).json({ message: 'Erreur lors de la récupération de l\'alerte.' });
  }
}
