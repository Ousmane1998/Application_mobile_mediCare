// @ts-nocheck
import Structure from '../models/Structure.js';

// Fonction pour calculer la distance entre deux points (formule de Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getNearbyStructures = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Coordonnées manquantes" });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const maxRadius = parseFloat(radius);

    // Récupérer toutes les structures
    const structures = await Structure.find();

    // Calculer la distance et filtrer
    const nearbyStructures = structures
      .map(s => ({
        _id: s._id,
        nom: s.nom,
        type: s.type,
        lat: s.lat,
        lng: s.lng,
        adresse: s.adresse,
        tel: s.tel,
        distance: calculateDistance(lat, lng, s.lat, s.lng)
      }))
      .filter(s => s.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      message: "Structures trouvées",
      count: nearbyStructures.length,
      structures: nearbyStructures
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllStructures = async (req, res) => {
  try {
    const structures = await Structure.find();
    res.json({
      message: "Toutes les structures",
      count: structures.length,
      structures
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
