import express from "express";
import { createAdvice, getAdvice } from "../controllers/adviceController.js";

const router = express.Router();

router.post("/", createAdvice);
router.get("/", getAdvice);

export default router;
