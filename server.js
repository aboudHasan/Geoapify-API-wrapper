import express from "express";
import http from "http";
import errorHandler from "./middleware/error.js";
import router from "./routes/router.js";
import WebSocket, { WebSocketServer } from "ws";

const port = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server: server });

let pvp_lobby = [];
let current_turn = 0;

function broadcast(msg) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

wss.on("connection", (ws, req) => {
  const parameters = new URL(req.url, "http://localhost").searchParams;
  ws.id = parameters.get("user");

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send("New client connected");
      console.log(`New client ${ws}`);
    }
  });

  ws.on("error", (error) => {
    console.log(`error: ${error}`);
  });

  ws.on("message", (message) => {
    let parsed;
    try {
      parsed = JSON.parse(message);
    } catch (e) {
      parsed = null;
    }

    if (message == "/reset") {
      broadcast("DezuraCaptainNoob");
    } else if (message == "/tux") {
      broadcast("TuxModeActivate");
    } else if (message == "/hello") {
      broadcast(`Hello from server to ${ws.id || "unknown user"}`);
    } else if (message == "/debug-clear-lobby") {
      pvp_lobby = [];
      current_turn = 0;
      broadcast(`ClearedPVPLobby`);
    } if (parsed && parsed.type === "pvp_lobby_request") {
        let payload = {
          type: "pvp_lobby_update",
          update_type: parsed.update,
          current_turn: parsed.current_turn || 0,
        };

        if (parsed.update === "join") {
          let existing = pvp_lobby.find(u => u.id === ws.id);
          if (!existing) {
            pvp_lobby.push({
              id: ws.id || "unknown user",
              name: parsed.name || "Unknown",
              level: parsed.level || 0,
              hp: parsed.hp || 0,
              max_hp: parsed.max_hp || 0,
              stunned: parsed.stunned || false,
              blocking: parsed.blocking || false,
            });
          }
          current_turn = current_turn % pvp_lobby.length;
        } else if (parsed.update === "leave") {
          pvp_lobby = pvp_lobby.filter(u => u.id !== ws.id);
        } else if (parsed.update === "start_fight") {
          current_turn = Math.floor(Math.random() * pvp_lobby.length);
          payload.current_turn = current_turn;
        } else if (parsed.update === "next_turn") {
          pvp_lobby = parsed.lobby || pvp_lobby;
          current_turn = (current_turn + 1) % pvp_lobby.length;
          payload.current_turn = current_turn;
        } else if (parsed.update === "end_fight") {
          pvp_lobby = parsed.lobby || pvp_lobby;
          payload.current_turn = current_turn;
        }

        payload.lobby = pvp_lobby;
        console.log(`Broadcasting Payload - ${JSON.stringify(payload)}`);
        broadcast(JSON.stringify(payload));
        if (parsed.update === "end_fight") {
          pvp_lobby = [];
          current_turn = 0;
        }
      } if (parsed && parsed.type === "position_lobby_update") {
        let payload = {
          type: "position_lobby_update",
          update_type: parsed.update,
          id: ws.id || "unknown user",
          name: parsed.name,
          color: parsed.color,
          lon: parsed.lon,
          lat: parsed.lat,
          level: parsed.level,
        };

        console.log(`Broadcasting Payload - ${JSON.stringify(payload)}`);
        broadcast(JSON.stringify(payload));
      } else {
      console.log(`New message - ${message}`);
      broadcast(message)
    }
  });
});

app.use(express.json());
app.use("/", router);
app.use(errorHandler);

server.listen(port, () => {
  console.log(`Listening on port ${port}\nhttp://localhost:${port}`);
  console.log(`IMPORTANT INFO ABOUT QUERYING AND RESPONSE OBJECT
    typically it goes latitude longitude, like x then y, but geoapify api does it reverse for some reason

    To query this api, just do this
    <url>/name?place=<place name>&limit=<num>&category=<category_name>
    ofc replace num with actual numbers, and limit is also an optional query, i've set the default to 50 places
    (make sure you encode URL components so you have "%20" instead of just " ")

    must include category now

    my direct example: http://localhost:8080/name?place=Hamilton%20Ontario&limit=100&categories=commercial
    my direct example: http://localhost:8080/bbox?place=Toronto%2COntario&limit=100&categories=leisure
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
    
    you can request the binary data at
    <url>/tile-data?x=<x value>&y=<y value>

    better tile data is at
    <url>/tiles-by-place?place=<place-name>
    
    i believe it will just serve the raw binary data, you may have to modify your headers in your request
    if you're having problems, try changing one of your headers in your get request, specifically
    Content-Type: application/x-protobuf`);
});
