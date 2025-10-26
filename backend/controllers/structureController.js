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
    console.log(`🔍 Requête Overpass pour: ${lat}, ${lng}`);
    
    // Utiliser une bbox plus grande
    const bbox = `${lat - 0.15},${lng - 0.15},${lat + 0.15},${lng + 0.15}`;
    
    const query = `[bbox:${bbox}];(node["amenity"="hospital"];node["amenity"="pharmacy"];node["amenity"="clinic"];way["amenity"="hospital"];way["amenity"="pharmacy"];way["amenity"="clinic"];);out center;`;

    const url = `https://overpass-api.de/api/interpreter`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: query,
      timeout: 30000
    });

    if (!response.ok) {
      console.error(`❌ Overpass API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    console.log(`📍 Éléments trouvés: ${data.elements?.length || 0}`);

    const structures = [];
    
    if (data.elements && Array.isArray(data.elements)) {
      data.elements.forEach(element => {
        if (!element.tags) return;

        let elemLat = element.lat;
        let elemLng = element.lon;
        
        // Pour les ways, utiliser le centre
        if (element.center) {
          elemLat = element.center.lat;
          elemLng = element.center.lon;
        }

        const tags = element.tags;
        let type = 'Hopital';
        
        if (tags.amenity === 'pharmacy') {
          type = 'Pharmacie';
        } else if (tags.amenity === 'clinic') {
          type = 'Poste de santé';
        }

        const distance = calculateDistance(lat, lng, elemLat, elemLng);

        structures.push({
          nom: tags.name || `${type} sans nom`,
          type: type,
          lat: elemLat,
          lng: elemLng,
          adresse: tags['addr:full'] || tags['addr:street'] || tags['addr:city'] || 'Adresse non disponible',
          tel: tags.phone || tags.contact?.phone || 'Non disponible',
          distance: distance
        });
      });
    }

    console.log(`✅ Structures parsées: ${structures.length}`);
    return structures;
  } catch (err) {
    console.error("❌ Erreur Overpass API:", err.message);
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

    console.log(`📊 Total structures reçues: ${allStructures.length}`);

    // Filtrer et trier par distance
    const nearbyStructures = allStructures
      .filter(s => {
        const dist = calculateDistance(lat, lng, s.lat, s.lng);
        return dist <= maxRadius;
      })
      .map(s => ({
        nom: s.nom,
        type: s.type,
        lat: s.lat,
        lng: s.lng,
        adresse: s.adresse,
        tel: s.tel,
        distance: calculateDistance(lat, lng, s.lat, s.lng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20); // Limiter à 20 résultats

    console.log(`✅ Structures filtrées: ${nearbyStructures.length}`);

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

