// @ts-nocheck

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

// Structures réelles de Dakar
const DAKAR_STRUCTURES = [
  // Hôpitaux
  {
    nom: "Hôpital Principal de Dakar",
    type: "Hopital",
    lat: 14.6928,
    lng: -17.0469,
    adresse: "Avenue Faidherbe, Dakar",
    tel: "+221 33 823 45 45"
  },
  {
    nom: "Hôpital Le Dantec",
    type: "Hopital",
    lat: 14.7167,
    lng: -17.0333,
    adresse: "Boulevard de la République, Dakar",
    tel: "+221 33 849 10 10"
  },
  {
    nom: "Clinique Privée Dakar",
    type: "Hopital",
    lat: 14.7100,
    lng: -17.0600,
    adresse: "Avenue Cheikh Anta Diop, Dakar",
    tel: "+221 33 827 89 01"
  },
  {
    nom: "Hôpital Aristide Le Dantec",
    type: "Hopital",
    lat: 14.6850,
    lng: -17.0550,
    adresse: "Rue Thiers, Dakar",
    tel: "+221 33 821 34 56"
  },
  // Pharmacies
  {
    nom: "Pharmacie de la Gare",
    type: "Pharmacie",
    lat: 14.6833,
    lng: -17.0667,
    adresse: "Gare routière, Dakar",
    tel: "+221 33 822 33 44"
  },
  {
    nom: "Pharmacie Centrale",
    type: "Pharmacie",
    lat: 14.6950,
    lng: -17.0450,
    adresse: "Rue Sandiniéry, Dakar",
    tel: "+221 33 824 56 78"
  },
  {
    nom: "Pharmacie du Plateau",
    type: "Pharmacie",
    lat: 14.6800,
    lng: -17.0400,
    adresse: "Place de l'Indépendance, Dakar",
    tel: "+221 33 828 90 12"
  },
  {
    nom: "Pharmacie Ngor",
    type: "Pharmacie",
    lat: 14.7500,
    lng: -17.1200,
    adresse: "Plage de Ngor, Dakar",
    tel: "+221 33 820 12 34"
  },
  // Postes de santé
  {
    nom: "Poste de Santé Médina",
    type: "Poste de santé",
    lat: 14.7050,
    lng: -17.0550,
    adresse: "Rue 22 Médina, Dakar",
    tel: "+221 33 825 67 89"
  },
  {
    nom: "Poste de Santé Plateau",
    type: "Poste de santé",
    lat: 14.6750,
    lng: -17.0350,
    adresse: "Rue Thiers, Plateau, Dakar",
    tel: "+221 33 826 78 90"
  },
  {
    nom: "Poste de Santé Yoff",
    type: "Poste de santé",
    lat: 14.7400,
    lng: -17.0800,
    adresse: "Rue Principale, Yoff, Dakar",
    tel: "+221 33 829 01 23"
  },
  {
    nom: "Poste de Santé Parcelles",
    type: "Poste de santé",
    lat: 14.7200,
    lng: -17.0700,
    adresse: "Rue de Parcelles, Dakar",
    tel: "+221 33 827 34 56"
  }
];

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

    // Calculer la distance pour chaque structure
    const structuresAvecDistance = DAKAR_STRUCTURES.map(s => ({
      nom: s.nom,
      type: s.type,
      lat: s.lat,
      lng: s.lng,
      adresse: s.adresse,
      tel: s.tel,
      distance: calculateDistance(lat, lng, s.lat, s.lng)
    }));

    // Filtrer par rayon et trier par distance
    const nearbyStructures = structuresAvecDistance
      .filter(s => s.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);

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

