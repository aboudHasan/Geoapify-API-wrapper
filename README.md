web server for gps rpg

serves zip file of tile vector art binaries
serves points of interest in json
serves enemies, but it's up to clients to request enemies when they're expired
endpoints for reverse geocoding, has built in forward geocoding
function to convert from lat lon to web mercator projection (x and y tiles)
uses ws to have global chat
also has legacy logic for enemies

apis used: geoapify for points of interest, openmaptiles (via cloud.maptiler) for vector art for mapview
