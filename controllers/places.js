import { convertPlace } from "./convertPlace.js";

const apiKey = process.env.API_KEY;
const apiUrl = `https://api.geoapify.com/v2/places?apiKey=${apiKey}&limit=500`;

async function getPOIsByBBox(place, categories) {
  try {
    const placeInformation = await convertPlace(place);

    const lat1 = placeInformation.results[0].bbox.lat1;
    const lat2 = placeInformation.results[0].bbox.lat2;
    const lon1 = placeInformation.results[0].bbox.lon1;
    const lon2 = placeInformation.results[0].bbox.lon2;

    const res = await fetch(
      apiUrl +
        `&filter=rect:${lon1},${lat1},${lon2},${lat2}&categories=${categories}`
    );
    if (!res.ok) {
      throw new Error(`API Error: ${res.status}, ${res.statusText}`);
    }

    const places = await res.json();
    // Return the center lat for the thinning helper
    const centerLat = (lat1 + lat2) / 2;
    return { places, centerLat };
  } catch (error) {
    console.log("Failed to get POIs");
    throw error;
  }
}

async function getPOIsByName(place, categories) {
  try {
    const placeInformation = await convertPlace(place);

    const placeid = placeInformation.results[0].place_id;
    // Get center lat for the thinning helper
    const centerLat = placeInformation.results[0].lat;

    const res = await fetch(
      apiUrl + `&filter=place:${placeid}&categories=${categories}`
    );
    if (!res.ok) {
      throw new Error(`API Error: ${res.status}, ${res.statusText}`);
    }

    const places = await res.json();
    return { places, centerLat };
  } catch (error) {
    console.log("Failed to get POIs");
    throw error;
  }
}

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

  if (!rawPlaces.features || !Array.isArray(rawPlaces.features)) {
    return rawPlaces; // Return original object if features are missing
  }

  // Sort by place_id FIRST to guarantee consistent order for all clients.
  rawPlaces.features.sort((a, b) => {
    const idA = a.properties?.place_id || "";
    const idB = b.properties?.place_id || "";
    return idA.localeCompare(idB);
  });
  // --------------------

  for (const feature of rawPlaces.features) {
    const [lon, lat] = feature.geometry.coordinates;

    const cellX = Math.floor(lon / lonGridSize);
    const cellY = Math.floor(lat / latGridSize);
    const cellId = `${cellX},${cellY}`;

    if (!occupiedCells.has(cellId)) {
      occupiedCells.add(cellId);
      filteredFeatures.push(feature);
    }
  }

  return {
    ...rawPlaces,
    features: filteredFeatures,
  };
};

export const fetchByBBox = async (req, res, next) => {
  try {
    const { place, categories } = req.query;

    if (!place) {
      const error = new Error("Must include a place name");
      error.status = 400;
      throw error;
    }
    if (!categories) {
      const error = new Error("Must include a categories");
      error.status = 400;
      throw error;
    }

    // Get the raw places AND the center latitude for thinning
    const { places: rawPlaces, centerLat } = await getPOIsByBBox(
      place,
      categories
    );

    // Apply 50-meter grid thinning
    const thinnedPlaces = applyGridThinning(rawPlaces, centerLat, 50);

    res.status(200).json(thinnedPlaces);
  } catch (error) {
    next(error);
  }
};

export const fetchByName = async (req, res, next) => {
  try {
    const { place, categories } = req.query;
    if (!place) {
      const error = new Error("Must include a place name");
      error.status = 400;
      throw error;
    }
    if (!categories) {
      const error = new Error("Must include categories");
      error.status = 400;
      throw error;
    }

    // Get the raw places AND the center latitude for thinning
    const { places: rawPlaces, centerLat } = await getPOIsByName(
      place,
      categories
    );

    // Apply 50-meter grid thinning
    const thinnedPlaces = applyGridThinning(rawPlaces, centerLat, 50);

    res.status(200).json(thinnedPlaces);
  } catch (error) {
    next(error);
  }
};
