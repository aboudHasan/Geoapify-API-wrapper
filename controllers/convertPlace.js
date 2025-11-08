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
