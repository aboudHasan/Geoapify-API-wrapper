import express from "express";
import { fetchRadius, fetchRect } from "../controllers/places.js";
import { fetchTile } from "../controllers/tiles.js";

const router = express.Router();

router.get("/radius", fetchRadius);
router.get("/rect", fetchRect);
router.get("/tile-data", fetchTile);

export default router;
