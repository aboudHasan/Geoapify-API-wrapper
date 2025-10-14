const apiKey = process.env.TILE_KEY;

async function getTileBinary(x, y) {
  try {
    const apiURL = `https://api.maptiler.com/tiles/v3-openmaptiles/14/${x}/${y}.pbf?key=${apiKey}`;

    const res = await fetch(apiURL);
    if (!res.ok) {
      throw new Error("API Error: " + res.status);
    }
    const tileData = await res.arrayBuffer();
    return {
      buffer: Buffer.from(tileData),
      contentType: res.headers.get("Content-Type") || "application/x-protobuf",
    };
  } catch (error) {
    console.log("Failed to fetch tile data from API");
    throw error;
  }
}

export const fetchTile = async (req, res, next) => {
  try {
    const { x, y } = req.query;

    if (!x || !y) {
      const error = new Error("Please include an x and y value");
      error.status = 400;
      return next(error);
    }
    const { buffer, contentType } = await getTileBinary(x, y);

    res.setHeader("Content-Type", contentType);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
