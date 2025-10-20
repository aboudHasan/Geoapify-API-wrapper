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

    const places = await radiusAPI(lat1, long1, radius, limitNum, category);
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

    const places = await rectAPI(lat1, long1, lat2, long2, limitNum);
    res.status(200).json(places);
  } catch (error) {
    next(error);
  }
};
