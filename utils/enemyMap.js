import { pickRandomFromBbox } from "./mercator.js";
import Enemy from "./enemy.js";

const enemies = new Map();

export const createRoom = (roomID, lat1, lon1, lat2, lon2) => {
  if (enemies.has(roomID)) {
    console.log(`room ${roomID} exists`);
  } else {
    let enemyList = [];
    for (let i = 0; i < Math.random() * 1000 + 100; i++) {
      const { randomLat, randomLon } = pickRandomFromBbox(
        lat1,
        lon1,
        lat2,
        lon2
      );
      const enemy = new Enemy(randomLat, randomLon);
      enemyList.push(enemy);
    }
    enemies.set(roomID, enemyList);
    return enemies.get(roomID);
  }
};

export const updateRoom = (roomID, lat1, lon1, lat2, lon2) => {
  if (!enemies.has(roomID)) {
    console.log(`room ${roomID} does not exist`);
  } else {
    clearExpired(roomID);
    let enemyList = enemies.get(roomID);

    for (let i = 0; i < Math.random() * 100 + 10; i++) {
      const { randomLat, randomLon } = pickRandomFromBbox(
        lat1,
        lon1,
        lat2,
        lon2
      );
      const enemy = new Enemy(randomLat, randomLon);
      enemyList.push(enemy);
    }

    enemies.set(roomID, enemyList);
  }
};

function clearExpired(roomID) {
  enemies.set(
    roomID,
    enemies.get(roomID).filter((enemy) => {
      return enemy.getExpiry() > Date.now();
    })
  );
}

export const getEnemiesInRoom = (roomID) => {
  clearExpired(roomID);
  return enemies.get(roomID);
};

export const clearRoom = (roomID) => {
  enemies.delete(roomID);
};
