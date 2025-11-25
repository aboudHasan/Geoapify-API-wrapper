import { randomUUID } from "crypto";
import { convertPlace } from "./convertPlace.js";
import { latLonToTileXY } from "../utils/mercator.js";

const enemyOdds = () => {
  const r = Math.random();
  if (r < 0.7) return 0;
  if (r < 0.97) return 1;
  return 2;
};

class EnemyTile {
  constructor(extent = 4096, enemyCount = 75, enemyRespawnTime = 30) {
    this.extent = extent;
    this.expiryTime = Date.now() + enemyRespawnTime * 60 * 1000;
    this.enemies = Array.from({ length: enemyCount }, () => ({
      id: randomUUID(),
      x: Math.floor(Math.random() * (extent + 1)),
      y: Math.floor(Math.random() * (extent + 1)),
      enemyType: enemyOdds(),
    }));
  }

  isExpired() {
    return Date.now() > this.expiryTime;
  }
}

const trackedPlaces = new Map();

export const getEnemiesFromTile = async (req, res, next) => {
  try {
    let { place } = req.query;

    if (!place) {
      const error = new Error("Please include place query parameters");
      error.status = 400;
      return next(error);
    }

    const placeInfo = await convertPlace(place);
    const placeId = placeInfo.results[0].place_id;
    const bbox = placeInfo.results[0].bbox;

    const bottomLeft = latLonToTileXY(bbox.lat1, bbox.lon1);
    const topRight = latLonToTileXY(bbox.lat2, bbox.lon2);
    const minX = Math.min(bottomLeft.x, topRight.x);
    const maxX = Math.max(bottomLeft.x, topRight.x);
    const minY = Math.min(bottomLeft.y, topRight.y);
    const maxY = Math.max(bottomLeft.y, topRight.y);

    if (!trackedPlaces.has(placeId)) {
      trackedPlaces.set(placeId, new Map());
    }

    const cityTilesMap = trackedPlaces.get(placeId);

    const responseTiles = {};

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const tileKey = `${x}_${y}`;

        if (
          !cityTilesMap.has(tileKey) ||
          cityTilesMap.get(tileKey).isExpired()
        ) {
          cityTilesMap.set(tileKey, new EnemyTile());
        }

        const tile = cityTilesMap.get(tileKey);

        responseTiles[tileKey] = {
          tileX: x,
          tileY: y,
          expiryTime: tile.expiryTime,
          formattedExpiryTime: new Date(tile.expiryTime).toLocaleTimeString(
            "en-US",
            { timeZone: "America/New_York" }
          ),
          extent: tile.extent,
          enemies: tile.enemies,
        };
      }
    }

    res.json(responseTiles);
  } catch (error) {
    next(error);
  }
};
