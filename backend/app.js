import express from "express";
import axios from "axios";
import connectDB from "./src/configs/db.js";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import router from "./src/routes/router.js";
import morgan from "morgan";
import nodemon from "nodemon";
import crypto from "crypto";
import cors from "cors";
import path from "path";

const app = express();
app.use(express.json());
const __dirname = path.dirname("");

const buildpath = path.join(__dirname, "../frontend/build");

app.use(express.static(buildpath));

app.get("/", (req, res) => {
  res.sendFile(path.join(buildpath, "index.html"));
});

// Parsing json requests
app.use(bodyParser.json());
app.use(cookieParser());

// Loading env variables
dotenv.config();

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, origin); // Allow the requesting origin dynamically
    },
    credentials: true,
  })
);

// Use Morgan for HTTP request logging
app.use(morgan("dev"));
app.use(router);

console.log("DBMS Backend Service");

// Server Port
const PORT = process.env.PORT || 8080;

// Connecting to mongodb Atlas then running Server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error in  connecting to MongoDB atlas:", error);
  });

nodemon({
  ext: "js",
  ignore: ["node_modules/"], // Ignore changes in the node_modules directory
});
