const apiKey = process.env.API_KEY;
const apiUrl = `https://api.geoapify.com/v2/places?&apiKey=${apiKey}`;

async function radiusAPI(lat1, long1, radius, limit, category) {
  try {
    const res = await fetch(
      apiUrl +
        `&filter=circle:${long1},${lat1},${radius}&bias=proximity:${long1},${lat1}&categories=${category}&limit=${limit}`
    );

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}, ${res.statusText}`);
    }

    const places = await res.json();
    return places;
  } catch (error) {
    console.log("Failed to fetch by radius");
    throw error;
  }
}

async function convertPlace(place) {
  try {
    place = encodeURIComponent(place);
    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/search?apiKey=${apiKey}&name=${place}&format=json`
    );

    // This function is incomplete, leaving as-is
  } catch (error) {
    console.log("Failed to fetch placeid");
    throw error;
  }
}

async function rectAPI(lat1, long1, lat2, long2, limit, category) {
  const centerLong = (long1 + long2) / 2;
  const centerLat = (lat1 + lat2) / 2;
  try {
    const res = await fetch(
      apiUrl +
        `&filter=rect:${long1},${lat1},${long2},${lat2}&bias=proximity:${centerLong},${centerLat}&categories=${category}&limit=${limit}`
    );
    if (!res.ok) {
      throw new Error(`API Error: ${res.status}, ${res.statusText}`);
    }

    const places = await res.json();
    return places;
  } catch (error) {
    console.log("Failed to fetch by bounding box");
    throw error;
  }
}

/**
 * Helper function to apply deterministic grid-based thinning to a GeoJSON-like features list.
 * @param {Object} rawPlaces - The raw API response object (must have a .features array).
 * @param {number} centerLat - The latitude to use for accurate distance calculation.
 * @param {number} gridSizeInMeters - The side length of the grid cells (e.g., 50).
 * @returns {Object} A new object with the .features array filtered.
 */
const applyGridThinning = (rawPlaces, centerLat, gridSizeInMeters) => {
  // 1 degree of latitude is ~111,139 meters
  const metersPerDegreeLat = 111139;
  // 1 degree of longitude varies with latitude
  const metersPerDegreeLon =
    metersPerDegreeLat * Math.cos(centerLat * (Math.PI / 180));

  const latGridSize = gridSizeInMeters / metersPerDegreeLat; // grid height in degrees
  const lonGridSize = gridSizeInMeters / metersPerDegreeLon; // grid width in degrees

  const occupiedCells = new Set();
  const filteredFeatures = [];

  // Ensure features exist before trying to iterate
  if (!rawPlaces.features || !Array.isArray(rawPlaces.features)) {
    return rawPlaces; // Return original object if features are missing
  }

  for (const feature of rawPlaces.features) {
    const [lon, lat] = feature.geometry.coordinates;

    // Calculate which grid cell this POI belongs to
    const cellX = Math.floor(lon / lonGridSize);
    const cellY = Math.floor(lat / latGridSize);
    const cellId = `${cellX},${cellY}`;

    // If this cell is not yet occupied, keep this POI and mark the cell
    if (!occupiedCells.has(cellId)) {
      occupiedCells.add(cellId);
      filteredFeatures.push(feature);
    }
    // If the cell IS occupied, we skip (discard) this feature.
  }

  // Return the original object structure but with the new, thinner features array
  return {
    ...rawPlaces,
    features: filteredFeatures,
  };
};

export const fetchRadius = async (req, res, next) => {
  try {
    const { lat1, long1, radius, limit, category } = req.query;
    if (!lat1 || !long1) {
      const error = new Error("Must include one latitude and longitude value");
      error.status = 400;
      return next(error);
    }
    if (!radius) {
      const error = new Error("Must include radius");
      error.status = 400;
      return next(error);
    }
    if (radius <= 0) {
      const error = new Error("Radius must be greater than 0");
      error.status = 400;
      return next(error);
    }
    if (!category) {
      const error = new Error("Must include a category");
      error.status = 400;
      throw error;
    }

    const limitNum = limit ? limit : 50;

    const rawPlaces = await radiusAPI(lat1, long1, radius, limitNum, category);

    // Apply 50-meter grid thinning
    const places = applyGridThinning(rawPlaces, Number(lat1), 50);

    res.status(200).json(places);
  } catch (error) {
    next(error);
  }
};

export const fetchRect = async (req, res, next) => {
  try {
    const lat1 = Number(req.query.lat1);
    const long1 = Number(req.query.long1);
    const lat2 = Number(req.query.lat2);
    const long2 = Number(req.query.long2);
    const { limit, category } = req.query;
    if (!lat1 || !long1 || !lat2 || !long2) {
      const error = new Error("Must include two latitude and longitude values");
      error.status = 400;
      throw error;
    }
    if (!category) {
      const error = new Error("Must include a category");
      error.status = 400;
      throw error;
    }

    const limitNum = limit ? limit : 50;

    // *** FIX ***: You were not passing 'category' to rectAPI. I've added it.
    const rawPlaces = await rectAPI(
      lat1,
      long1,
      lat2,
      long2,
      limitNum,
      category
    );

    // Apply 50-meter grid thinning
    const centerLat = (lat1 + lat2) / 2; // Use center for grid calculation
    const places = applyGridThinning(rawPlaces, centerLat, 50);

    res.status(200).json(places);
  } catch (error) {
    next(error);
  }
};
