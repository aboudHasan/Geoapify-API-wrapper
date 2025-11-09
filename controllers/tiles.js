import archiver from "archiver";
import { convertPlace } from "./convertPlace.js";
import { latLonToTileXY } from "../utils/mercator.js";

const apiKey = process.env.TILE_KEY;

async function getTileBinary(x, y, zoom = 12) {
  try {
    const apiURL = `https://api.maptiler.com/tiles/v3-openmaptiles/${zoom}/${x}/${y}.pbf?key=${apiKey}`;

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
    console.log(`Failed to fetch tile data from API for ${x},${y}`);
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

export const fetchTilesByPlace = async (req, res, next) => {
  try {
    const { place } = req.query;

    if (!place) {
      const error = new Error("Must include a place name");
      error.status = 400;
      return next(error);
    }

    const placeInformation = await convertPlace(place);
    const bbox = placeInformation.results[0].bbox;

    const bottomLeft = latLonToTileXY(bbox.lat1, bbox.lon1);
    const topRight = latLonToTileXY(bbox.lat2, bbox.lon2);

    const minX = Math.min(bottomLeft.x, topRight.x);
    const maxX = Math.max(bottomLeft.x, topRight.x);
    const minY = Math.min(bottomLeft.y, topRight.y);
    const maxY = Math.max(bottomLeft.y, topRight.y);

    console.log("Bounding box:", bbox);
    console.log("Bottom-left tile:", bottomLeft);
    console.log("Top-right tile:", topRight);
    console.log("Tile range:", { minX, maxX, minY, maxY });
    console.log("Total tiles:", (maxX - minX + 1) * (maxY - minY + 1));
    // Set response headers for ZIP download
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="tiles_${place.replace(/\s+/g, "_")}.zip"`
    );

    // Create ZIP archive
    const archive = archiver("zip", {
      zlib: { level: 6 }, // Compression level (0-9)
    });

    // Pipe archive to response
    archive.pipe(res);

    // Handle archiver errors
    archive.on("error", (err) => {
      throw err;
    });

    // Fetch all tiles and add them to the archive
    const tilePromises = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        console.log(x, y);
        tilePromises.push(
          getTileBinary(x, y)
            .then(({ buffer }) => {
              archive.append(buffer, { name: `${x}_${y}.pbf` });
            })
            .catch((err) => {
              console.log(`Skipping tile ${x},${y} due to error:`, err.message);
            })
        );
      }
    }

    // Wait for all tiles to be fetched
    await Promise.all(tilePromises);

    await archive.finalize();
  } catch (error) {
    next(error);
  }
};
