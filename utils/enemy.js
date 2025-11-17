import { randomUUID } from "crypto";
import { latLonToTileXY } from "./mercator.js";

class Enemy {
  constructor(lat, lon) {
    this.expiry = Date.now() + 30 * 60 * 1000;
    this.lat = lat;
    this.lon = lon;
    const { x, y } = latLonToTileXY(lat, lon);
    this.x = x;
    this.y = y;
    this.id = randomUUID();
  }

  getExpiry() {
    return this.expiry;
  }
  getPosition() {
    return { lat: this.lat, lon: this.lon, x: this.x, y: this.y };
  }

  getProperties() {
    return {
      id: this.id,
      expiry: this.expiry,
      lat: this.lat,
      lon: this.lon,
      x: this.x,
      y: this.y,
    };
  }
}

export default Enemy;
