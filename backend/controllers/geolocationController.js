// @ts-nocheck
export const getGeolocation = async (req, res) => {
  try {
    // On récupère latitude/longitude soit depuis query (GET) soit depuis body (POST)
    const latitude = req.query.latitude || req.body.latitude;
    const longitude = req.query.longitude || req.body.longitude;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Coordonnées manquantes" });
    }

    res.json({ message: "Position reçue", latitude, longitude });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
