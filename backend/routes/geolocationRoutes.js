// routes/geolocationRoutes.js
import express from "express";
import { getGeolocation } from "../controllers/geolocationController.js";

const router = express.Router();

router.get("/", getGeolocation);

export default router;
