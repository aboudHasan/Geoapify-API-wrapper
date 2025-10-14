const apiKey = process.env.API_KEY;
const apiUrl = `https://api.geoapify.com/v2/places?categories=commercial&apiKey=${apiKey}`;

async function radiusAPI(lat1, long1, radius, limit) {
  try {
    const res = await fetch(
      apiUrl +
        `&filter=circle:${long1},${lat1},${radius}&bias=proximity:${long1},${lat1}&limit=${limit}`
    );

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    const places = await res.json();
    return places;
  } catch (error) {
    console.log("Failed to fetch by radius");
    throw error;
  }
}

async function rectAPI(lat1, long1, lat2, long2, limit) {
  const centerLong = (long1 + long2) / 2;
  const centerLat = (lat1 + lat2) / 2;
  try {
    const res = await fetch(
      apiUrl +
        `&filter=rect:${long1},${lat1},${long2},${lat2}&bias=proximity:${centerLong},${centerLat}&limit=${limit}`
    );
    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    const places = await res.json();
    return places;
  } catch (error) {
    console.log("Failed to fetch by bounding box");
    throw error;
  }
}

export const fetchRadius = async (req, res, next) => {
  try {
    const { lat1, long1, radius, limit } = req.query;
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

    const limitNum = limit ? limit : 50;

    const places = await radiusAPI(lat1, long1, radius, limitNum);
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
    const limit = Number(req.query.limit);
    if (!lat1 || !long1 || !lat2 || !long2) {
      const error = new Error("Must include two latitude and longitude values");
      error.status = 400;
      return next(error);
    }

    const limitNum = limit ? limit : 50;

    const places = await rectAPI(lat1, long1, lat2, long2, limitNum);
    res.status(200).json(places);
  } catch (error) {
    next(error);
  }
};
