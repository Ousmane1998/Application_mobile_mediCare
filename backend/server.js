import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();
app.use(express.json());

// 🔌 Connexion à MongoDB locale
connectDB();

app.get("/api/test", (req, res) => {
  res.json({ message: "Hello depuis le backend Node.js connecté à MongoDB 🚀" });
});

// Swagger docs
swaggerDocs(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur en marche sur le port ${PORT}`);
});
