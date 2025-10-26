// @ts-nocheck
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Structure from "../models/Structure.js";

const seedStructures = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connecté à MongoDB");

    // Supprimer les structures existantes
    await Structure.deleteMany({});
    console.log("🗑️ Structures existantes supprimées");

    // Ajouter des structures de test (Dakar, Sénégal)
    const structures = [
      {
        nom: "Hôpital Principal de Dakar",
        type: "Hopital",
        lat: 14.6928,
        lng: -17.0469,
        adresse: "Avenue Faidherbe, Dakar, Sénégal",
        tel: "+221338234545",
      },
      {
        nom: "Hôpital Le Dantec",
        type: "Hopital",
        lat: 14.7167,
        lng: -17.0333,
        adresse: "Boulevard de la République, Dakar, Sénégal",
        tel: "+221338491010",
      },
      {
        nom: "Pharmacie de la Gare",
        type: "Pharmacie",
        lat: 14.6833,
        lng: -17.0667,
        adresse: "Gare routière, Dakar, Sénégal",
        tel: "+221338223344",
      },
      {
        nom: "Pharmacie Centrale",
        type: "Pharmacie",
        lat: 14.6950,
        lng: -17.0450,
        adresse: "Rue Sandiniéry, Dakar, Sénégal",
        tel: "+221338245678",
      },
      {
        nom: "Poste de Santé Médina",
        type: "Poste de santé",
        lat: 14.7050,
        lng: -17.0550,
        adresse: "Rue 22 Médina, Dakar, Sénégal",
        tel: "+221338256789",
      },
      {
        nom: "Poste de Santé Plateau",
        type: "Poste de santé",
        lat: 14.6750,
        lng: -17.0350,
        adresse: "Rue Thiers, Plateau, Dakar, Sénégal",
        tel: "+221338267890",
      },
      {
        nom: "Clinique Privée Dakar",
        type: "Hopital",
        lat: 14.7100,
        lng: -17.0600,
        adresse: "Avenue Cheikh Anta Diop, Dakar, Sénégal",
        tel: "+221338278901",
      },
      {
        nom: "Pharmacie du Plateau",
        type: "Pharmacie",
        lat: 14.6800,
        lng: -17.0400,
        adresse: "Place de l'Indépendance, Plateau, Dakar, Sénégal",
        tel: "+221338289012",
      },
    ];

    await Structure.insertMany(structures);
    console.log(`✅ ${structures.length} structures ajoutées`);

    await mongoose.disconnect();
    console.log("✅ Déconnecté de MongoDB");
  } catch (err) {
    console.error("❌ Erreur:", err.message);
    process.exit(1);
  }
};

seedStructures();
