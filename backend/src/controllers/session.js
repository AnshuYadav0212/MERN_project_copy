import crypto from "crypto";
import jwt from "jsonwebtoken";
import Student from "../schemas/student.js";
import Washerman from "../schemas/washerman.js";
import WebSocket from "ws";

const adminLogin = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res
      .status(400)
      .json({ message: "Bad Request (Wrong/Missing Keys in json)" });
    return;
  }
  if (username === "admin" && password === "password1") {
    const token = jwt.sign({ username }, "tHISiStHEsECRETkEY", {
      expiresIn: "12h",
    });
    res.cookie("token", token, { httpOnly: true });
    res.status(200).json({ message: "Admin logged in successfully" });
  } else {
    res.status(401).json({ message: "Invalid credentials for admin login" });
  }
};

const studentLogin = async (req, res) => {
  const { roll, pass } = req.body;

  try {
    let user;

    user = await Student.findOne({ roll: roll }).populate("washerman");

    if (!user) {
      return res.status(401).json({ message: "student not found" });
    }

    const hashedpass = sha256(pass);

    if (user.passHash === hashedpass) {
      const token = jwt.sign({ roll }, "tHISiStHEsECRETkEY", {
        expiresIn: "12h",
      });
      res.cookie("token", token, cookieOptions);

      res.cookie(
        "info",
        JSON.stringify({
          roll,
          name: user.name,
          hall: user.hall,
          wing: user.wing,
          email: user.email,
          washerman: {
            name: user.washerman.name,
            upcomingDate: user.washerman.upcomingDate,
            contact: user.washerman.contact,
          },
          lastCleared: user.lastCleared,
        }),
        cookieOptions
      );

      res.status(200).json({ message: "student logged in successfully" });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const washermanLogin = async (req, res) => {
  const { contact, pass } = req.body;

  try {
    let user;

    user = await Washerman.findOne({ contact }).populate({
      path: "halls",
      populate: { path: "wings" },
    });

    if (!user) {
      return res.status(401).json({ message: "Washerman not found" });
    }

    const hashedpass = sha256(pass);

    if (user.passHash === hashedpass) {
      const token = jwt.sign({ contact }, "tHISiStHEsECRETkEY", {
        expiresIn: "12h",
      });
      res.cookie("token", token, cookieOptions);

      // Initialize WebSocket connection
      // const ws = new WebSocket(process.env.WS_URL);

      // ws.onopen = () => {
      //     // Save WebSocket connection in Washerman document
      //     user.wsConn = ws;
      //     user.save();
      // };

      // Set cookie with user info
      res.cookie(
        "info",
        JSON.stringify({
          contact,
          name: user.name,

          halls: user.halls,
        }),
        cookieOptions
      );

      res.status(200).json({ message: "Washerman logged in successfully" });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error logging in washerman:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.clearCookie("info");
  res.status(200).json({ message: "Logged out successfully" });
};

const washermanLogout = async (req, res) => {
  try {
    const user = await Washerman.findOne({ contact: req.user.contact });

    res.clearCookie("token");
    res.clearCookie("info");

    if (user.wsConn) {
      user.wsConn.close();
      user.wsConn = null;
      await user.save();
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error logging out washerman:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

// Deployment
// const cookieOptions = {
//     secure: true,
//     sameSite: 'None',
//     path: '/',
//     domain: process.env.DOMAIN
//   };

// For local testing
const cookieOptions = {
  sameSite: "strict",
  path: "/",
  domain: "localhost",
};

const session = {
  adminLogin,
  studentLogin,
  washermanLogin,
  logout,
  washermanLogout,
};

export default session;
