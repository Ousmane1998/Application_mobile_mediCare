// controllers/geolocationController.js
export const getGeolocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude)
      return res.status(400).json({ message: "Coordonnées manquantes" });

    res.json({ message: "Position reçue", latitude, longitude });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
