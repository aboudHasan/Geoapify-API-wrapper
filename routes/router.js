import express from "express";
import { fetchByBBox, fetchByName } from "../controllers/places.js";
import { fetchTile, fetchTilesByPlace } from "../controllers/tiles.js";
import { getEnemiesFromTile, resetTrackedEnemies } from "../controllers/enemies.js";
import { convertCoords } from "../controllers/convertPlace.js";

const router = express.Router();

router.get("/bbox", fetchByBBox);
router.get("/name", fetchByName);
router.get("/tile-data", fetchTile);
router.get("/tiles-by-place", fetchTilesByPlace);
router.get("/enemy-tile", getEnemiesFromTile);
router.get("/reset-enemies", resetTrackedEnemies);
router.get("/convert-place", convertCoords);

export default router;
