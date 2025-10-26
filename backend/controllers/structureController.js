// @ts-nocheck
import fetch from 'node-fetch';

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

// Récupérer les structures via Overpass API (OpenStreetMap)
const getStructuresFromOverpass = async (lat, lng, radius = 10000) => {
  try {
    const query = `
      [bbox:${lat - 0.1},${lng - 0.1},${lat + 0.1},${lng + 0.1}];
      (
        node["amenity"="hospital"];
        node["amenity"="pharmacy"];
        node["amenity"="clinic"];
        way["amenity"="hospital"];
        way["amenity"="pharmacy"];
        way["amenity"="clinic"];
      );
      out center;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();

    const structures = [];
    
    if (data.elements) {
      data.elements.forEach(element => {
        let lat = element.lat;
        let lng = element.lon;
        
        // Pour les ways, utiliser le centre
        if (element.center) {
          lat = element.center.lat;
          lng = element.center.lon;
        }

        const tags = element.tags || {};
        let type = 'Hopital';
        
        if (tags.amenity === 'pharmacy') {
          type = 'Pharmacie';
        } else if (tags.amenity === 'clinic') {
          type = 'Poste de santé';
        }

        structures.push({
          nom: tags.name || `${type} sans nom`,
          type: type,
          lat: lat,
          lng: lng,
          adresse: tags['addr:full'] || tags['addr:street'] || 'Adresse non disponible',
          tel: tags.phone || 'Non disponible',
          distance: calculateDistance(lat, lng, lat, lng)
        });
      });
    }

    return structures;
  } catch (err) {
    console.error("❌ Erreur Overpass API:", err);
    return [];
  }
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

    console.log(`🔍 Recherche structures près de: ${lat}, ${lng} (rayon: ${maxRadius}km)`);

    // Récupérer les structures via Overpass API
    const allStructures = await getStructuresFromOverpass(lat, lng, maxRadius * 1000);

    // Calculer la distance et filtrer
    const nearbyStructures = allStructures
      .map(s => ({
        nom: s.nom,
        type: s.type,
        lat: s.lat,
        lng: s.lng,
        adresse: s.adresse,
        tel: s.tel,
        distance: calculateDistance(lat, lng, s.lat, s.lng)
      }))
      .filter(s => s.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20); // Limiter à 20 résultats

    console.log(`✅ Structures trouvées: ${nearbyStructures.length}`);

    res.json({
      message: "Structures trouvées",
      count: nearbyStructures.length,
      structures: nearbyStructures
    });
  } catch (err) {
    console.error("❌ Erreur getNearbyStructures:", err);
    res.status(500).json({ message: err.message });
  }
};

