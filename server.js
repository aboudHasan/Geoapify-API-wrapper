import express from "express";
import errorHandler from "./middleware/error.js";
import router from "./routes/router.js";

const port = process.env.PORT || 5000;
const app = express();
app.use(express.json());
app.use("/", router);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Listening on port ${port}\nhttp://localhost:${port}`);
  console.log(`IMPORTANT INFO ABOUT RESPONSE OBJECT
    
    I recommend using postman to test this api, and then pasting the response object into a json formatter to see for yourself how the tree looks, but otherwise I will try to explain where to find key information below.
    
    All the places will be listed in an array of 'features' (just how the geoapify api works).
    
    To start, I'll explain where to find the coordinates. The coordinates will be located at
    Object.features[i].geometry.coordinates[i]
    
    coordinates has two indexes, 0 and 1. 0 being the longitude, and 1 being the latitude.
    
    Next, you can find important information about the place at
    Object.features[i].properties
    
    You can find things such as name, country, state, county (did you know we are in the golden horseshoe?), postal code, street name, also lon and lat values, formatted (which is the place full name and address, e.g. John Bear Chevrolet Buick GMC, Upper James Street, Hamilton, ON L9C 3B2, Canada), and also a categories properties, which is an array. The categories array contains the specific category or categories this place falls under. For example, in the case of the car dealership, it would have 4 indexes, 0: building, 1: building.commercial, 2: commercial, 3: commercial.vehicle.
    
    In order to access each of the properties i just mentioned in the paragraph above, it would be located at
    Object.features[i].properties.<property name>
    
    Sorry this isn't formatted. After I commit this, I'm gonna start planning the enemies part.`);
});
