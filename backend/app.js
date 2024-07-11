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
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// Get the directory name of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Current module file (__filename):", __filename);
console.log("Current module directory (__dirname):", __dirname);

const buildpath = path.join(__dirname, "../frontend/build");
console.log("Build path:", buildpath);

// Serve static files from the React app
app.use(express.static(buildpath));

// Use Morgan for HTTP request logging
app.use(morgan("dev"));

// Parsing JSON requests
app.use(bodyParser.json());
app.use(cookieParser());

// Load environment variables
dotenv.config();

// Enable CORS with dynamic origin handling
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, origin); // Allow the requesting origin dynamically
    },
    credentials: true,
  })
);

// Add API routes
app.use(router);

// Serve index.html for the root route
app.get("/", (req, res) => {
  const indexPath = path.join(buildpath, "index.html");
  console.log("Serving index.html from:", indexPath);
  res.sendFile(indexPath);
});

// Catch-all route to serve index.html for all other routes
app.get("*", (req, res) => {
  const indexPath = path.join(buildpath, "index.html");
  console.log("Serving index.html for catch-all route from:", indexPath);
  res.sendFile(indexPath);
});

console.log("DBMS Backend Service");

// Server Port
const PORT = process.env.PORT || 8000;

// Connect to MongoDB Atlas and start the server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error in connecting to MongoDB Atlas:", error);
  });

nodemon({
  ext: "js",
  ignore: ["node_modules/"], // Ignore changes in the node_modules directory
});
