import express from "express";
import errorHandler from "./middleware/error.js";
const port = process.env.PORT || 5000;
const app = express();
app.use(express.json());
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Listening on port ${port}\nhttp://localhost:${port}`);
});
