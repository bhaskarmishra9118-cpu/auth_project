let cachedSecret = null;

const getSecretFromDB = async () => {
  if (cachedSecret) {
    return cachedSecret;
  }

  const secret = process.env.APPLICATION_SECRET;

  if (!secret) {
    console.error("APPLICATION_SECRET is not defined");
    throw new Error("Server configuration error");
  }

  cachedSecret = secret; // Cache it
  return secret;
};

module.exports = { getSecretFromDB };
