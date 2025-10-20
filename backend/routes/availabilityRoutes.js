// routes/availabilityRoutes.js
import express from "express";
import { setAvailability, getAvailability } from "../controllers/availabilityController.js";

const router = express.Router();

router.post("/", setAvailability);
router.get("/", getAvailability);

export default router;
