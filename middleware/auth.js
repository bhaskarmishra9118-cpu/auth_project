const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    // 1️⃣ Ensure secret exists (NO default fallback)
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is not defined");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // 2️⃣ Validate Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    // 3️⃣ Verify token with restricted algorithm
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    // 4️⃣ Attach user to request
    req.user = decoded;

    // 5️⃣ Continue request
    next();

  } catch (error) {
    console.error("JWT verification failed:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    return res.status(401).json({ error: "Invalid token" });
  }
};
