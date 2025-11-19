import { randomUUID } from "crypto";

class EnemyTile {
  constructor(extent = 4096, enemyCount = 100, enemyRespawnTime = 0.1) {
    this.extent = extent;
    this.expiryTime = Date.now() + enemyRespawnTime * 60 * 1000;
    this.enemies = Array.from({ length: enemyCount }, () => ({
      id: randomUUID(),
      x: Math.floor(Math.random() * (extent + 1)),
      y: Math.floor(Math.random() * (extent + 1)),
      enemyType: Math.floor(Math.random() * 3),
    }));
  }

  isExpired() {
    return Date.now() > this.expiryTime;
  }
}

const trackedEnemyTiles = new Map(); // "[x]_[y]" = EnemyTile()

export const getEnemiesFromTile = (req, res, next) => {
  try {
    const { x, y } = req.query;

    if (!x || !y) {
      const error = new Error("Please include x and y query parameters");
      error.status = 400;
      return next(error);
    }

    const key = `${x}_${y}`;

    let tile; // Only generate new enemies if they don't exist on this tile yet or the existing ones are expired
    if (!trackedEnemyTiles.has(key) || trackedEnemyTiles.get(key).isExpired()) {
      trackedEnemyTiles.set(key, new EnemyTile());
    }
    tile = trackedEnemyTiles.get(key);

    res.json({
      tileX: parseInt(x),
      tileY: parseInt(y),
      expiryTime: tile.expiryTime,
      formattedExpiryTime: new Date(tile.expiryTime).toLocaleTimeString("en-US", {timeZone: "America/New_York"}), // Might remove this later
      extent: tile.extent,
      enemies: tile.enemies,
    });
  } catch (error) {
    next(error);
  }
};
