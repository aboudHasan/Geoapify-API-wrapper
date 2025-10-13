import express from "express";
import { fetchRadius, fetchRect } from "../controllers/places.js";

const router = express.Router();

router.get("/radius", fetchRadius);
router.get("/rect", fetchRect);

export default router;
