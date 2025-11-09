import express from "express";
import { fetchByBBox, fetchByName } from "../controllers/places.js";
import { fetchTile, fetchTilesByPlace } from "../controllers/tiles.js";

const router = express.Router();

router.get("/bbox", fetchByBBox);
router.get("/name", fetchByName);
router.get("/tile-data", fetchTile);
router.get("/tiles-by-place", fetchTilesByPlace);

export default router;
