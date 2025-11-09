/**
 * Clamps a number between a minimum and maximum value.
 * (Equivalent to GDScript's clamp())
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Converts degrees to radians.
 * (Equivalent to GDScript's deg_to_rad())
 */
function degToRad(degrees) {
  return degrees * (Math.PI / 180.0);
}

/**
 * Converts Latitude and Longitude to Web Mercator tile X/Y coordinates
 * at a fixed zoom level of 12.
 *
 * This function is a direct translation of the provided GDScript formula.
 *
 * @param {number} latitude - The latitude in degrees.
 * @param {number} longitude - The longitude in degrees (West is negative).
 * @returns {{x: number, y: number}} An object containing the integer tile coordinates {x, y}.
 */
export const latLonToTileXY = (latitude, longitude) => {
  const zoomLevel = 14;

  // 1. Clamp latitude to the valid Mercator range
  const clamped_lat = clamp(latitude, -85.05112878, 85.05112878);

  // 2. Convert clamped latitude to radians
  const lat_rad = degToRad(clamped_lat);

  // 3. Calculate 'n', the number of tiles across the map at this zoom level
  // n = 2^zoom
  const n = Math.pow(2.0, zoomLevel); // At zoom 12, n = 4096

  // 4. Calculate the tile X coordinate
  // This formula converts longitude ([-180, 180]) to a tile index ([0, n-1])
  const x_tile_float = ((longitude + 180.0) / 360.0) * n;

  // 5. Calculate the tile Y coordinate
  // This formula converts latitude to a tile index ([0, n-1])
  // Math.log(Math.tan(lat_rad) + 1.0 / Math.cos(lat_rad)) is the Mercator projection part
  const y_tile_float =
    ((1.0 - Math.log(Math.tan(lat_rad) + 1.0 / Math.cos(lat_rad)) / Math.PI) /
      2.0) *
    n;

  // 6. Return the integer part of the coordinates, matching the
  // GDScript `int()` cast which truncates the decimal.
  // Math.floor() is the JavaScript equivalent for positive numbers.
  return {
    x: Math.floor(x_tile_float),
    y: Math.floor(y_tile_float),
  };
};
