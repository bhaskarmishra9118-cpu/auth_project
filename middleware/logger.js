const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  console.log(`[START] ${method} ${originalUrl} - IP: ${ip}`);

  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log(
      `[END] ${method} ${originalUrl} -> ${res.statusCode} (${duration}ms)`
    );
  });

  res.on("error", (err) => {
    console.error(
      `[ERROR] ${method} ${originalUrl} - ${err.message}`
    );
  });

  next(); // 🔥 IMPORTANT
};

module.exports = requestLogger;
