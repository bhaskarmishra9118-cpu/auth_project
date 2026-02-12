const crypto = require("crypto");
const { getSecretFromDB } = require("./mockDb");

const generateToken = async (email) => {
  try {
    // Input validation
    if (!email || typeof email !== "string") {
      throw new Error("Valid email is required");
    }

    const secret = await getSecretFromDB();

    if (!secret) {
      throw new Error("Secret key not found");
    }

    // Add timestamp to prevent replay attacks
    const payload = `${email}:${Date.now()}`;

    const token = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64");

    return token;

  } catch (error) {
    console.error("Token generation failed:", error.message);
    throw error; // Never swallow errors
  }
};

module.exports = { generateToken };
