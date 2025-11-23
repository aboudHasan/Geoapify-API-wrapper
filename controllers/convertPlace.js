const apiKey = process.env.API_KEY;

export const convertPlace = async (place) => {
  try {
    place = encodeURIComponent(place);
    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/search?apiKey=${apiKey}&name=${place}&format=json`
    );
    if (!res.ok) {
      throw new Error("API Error");
    }

    const placeInformation = await res.json();

    if (!placeInformation.results || placeInformation.results.length === 0) {
      throw new Error("Place not found");
    }

    return placeInformation;
  } catch (error) {
    console.log("Failed to fetch place information");
    throw error;
  }
};
// https://api.geoapify.com/v1/geocode/reverse?lat=52.51894887928074&lon=13.409808180753316&format=json&apiKey=YOUR_API_KEY

export const convertCoords = async (req, res, next) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      const error = new Error("Must include both lat and lon");
      error.status = 400;
      throw error;
    }

    let placeInformation = await fetch(
      `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=json&apiKey=${apiKey}`
    );

    if (!placeInformation.ok) {
      throw new Error("API error");
    }

    placeInformation = await placeInformation.json();
    res.status(200).json(placeInformation);
  } catch (error) {
    next(error);
  }
};
