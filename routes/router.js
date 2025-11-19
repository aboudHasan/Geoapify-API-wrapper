import express from "express";
import { fetchByBBox, fetchByName } from "../controllers/places.js";
import { fetchTile, fetchTilesByPlace } from "../controllers/tiles.js";
import { getEnemiesFromTile } from "../controllers/enemies.js";

const router = express.Router();

router.get("/bbox", fetchByBBox);
router.get("/name", fetchByName);
router.get("/tile-data", fetchTile);
router.get("/tiles-by-place", fetchTilesByPlace);
router.get("/enemy-tile", getEnemiesFromTile);

export default router;
