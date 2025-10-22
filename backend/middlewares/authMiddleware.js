// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { tokenBlacklist } from "./tokenBlacklist.js";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];

  // Vérifie si le token est dans la blacklist
  if (tokenBlacklist.includes(token)) {
    return res.status(401).json({ message: "Token invalide (déconnecté)" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide" });
  }
};

export default authMiddleware;
