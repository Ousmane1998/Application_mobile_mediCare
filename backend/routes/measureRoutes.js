// routes/measureRoutes.js
import express from "express";
import { addMeasure, getHistory } from "../controllers/measureController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, addMeasure);
router.get("/history/:patientId", authMiddleware, getHistory);

export default router;
