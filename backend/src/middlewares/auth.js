import jwt from "jsonwebtoken";

const jwtAuth = (req, res, next) => {
  if (!req.cookies || !req.cookies.token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = req.cookies.token;

  try {
    const decoded = jwt.verify(token, "tHISiStHEsECRETkEY");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Unauthorized: Invalid token" });
  }
};

export default jwtAuth;
