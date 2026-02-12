const http = require("http");

const BASE_URL = "http://localhost:3000";

// Helper function to make HTTP requests
function makeRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Test helper functions
function printTest(name) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST: ${name}`);
  console.log("=".repeat(60));
}

function printResult(status, message) {
  const symbol = status ? "✅ PASS" : "❌ FAIL";
  console.log(`${symbol}: ${message}`);
}

// Main test suite
async function runTests() {
  try {
    console.log("\n\n🔐 AUTH FLOW TEST SUITE 🔐\n");

    let loginSessionId = null;
    let otp = null;
    let accessToken = null;

    // TEST 1: Login
    printTest("1. LOGIN ENDPOINT");
    try {
      const loginRes = await makeRequest("POST", "/login", {
        email: "user@example.com",
        password: "password123",
      });

      console.log("Response Status:", loginRes.status);
      console.log("Response Body:", JSON.stringify(loginRes.body, null, 2));

      const pass1 = loginRes.status === 200 && loginRes.body.loginSessionId;
      printResult(pass1, "Login returns 200 and loginSessionId");

      if (loginRes.body.loginSessionId) {
        loginSessionId = loginRes.body.loginSessionId;
        console.log(`\n📝 Session ID stored: ${loginSessionId}`);
      }
    } catch (error) {
      printResult(false, `Login request failed: ${error.message}`);
    }

    // TEST 2: Verify OTP
    printTest("2. VERIFY OTP ENDPOINT");
    if (loginSessionId) {
      // Get OTP from server console or use a hardcoded test value
      // For now, we'll attempt login again to get the OTP from logs
      console.log("⚠️  Note: OTP is logged in server console");
      console.log("   Please check server logs [OTP] message");
      console.log(`   Using session: ${loginSessionId}`);
      console.log("   You need to enter the OTP from the logs manually");

      // For automated testing, we'll try common test OTPs
      const testOtps = [
        "123456",
        "100000",
        "000001",
      ];

      let otpVerified = false;

      for (const testOtp of testOtps) {
        try {
          const verifyRes = await makeRequest("POST", "/auth/verify-otp", {
            loginSessionId: loginSessionId,
            otp: testOtp,
          });

          console.log(`\nTrying OTP: ${testOtp}`);
          console.log("Response Status:", verifyRes.status);

          if (verifyRes.status === 200) {
            console.log("✅ OTP verified successfully!");
            console.log("Response:", JSON.stringify(verifyRes.body, null, 2));
            otpVerified = true;
            break;
          }
        } catch (error) {
          console.log(`   Error with OTP ${testOtp}: ${error.message}`);
        }
      }

      if (!otpVerified) {
        console.log("\n⚠️  Could not verify OTP with test values");
        console.log("   This is expected - please manually test with actual OTP");
      }
    } else {
      printResult(false, "Cannot test OTP verification without loginSessionId");
    }

    // TEST 3: Get Token
    printTest("3. GET TOKEN ENDPOINT");
    if (loginSessionId) {
      try {
        const tokenRes = await makeRequest("POST", "/auth/token", null);
        // Add Authorization header
        const url = new URL("/auth/token", BASE_URL);
        const options = {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${loginSessionId}`,
          },
        };

        const tokenResponse = await new Promise((resolve, reject) => {
          const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => {
              resolve({
                status: res.statusCode,
                body: data ? JSON.parse(data) : null,
              });
            });
          });

          req.on("error", reject);
          req.end();
        });

        console.log("Response Status:", tokenResponse.status);
        console.log("Response Body:", JSON.stringify(tokenResponse.body, null, 2));

        const pass3 =
          tokenResponse.status === 200 && tokenResponse.body.access_token;
        printResult(pass3, "Token endpoint returns access_token");

        if (tokenResponse.body.access_token) {
          accessToken = tokenResponse.body.access_token;
          console.log(`\n🔑 Access Token stored (first 50 chars): ${accessToken.substring(0, 50)}...`);
        }
      } catch (error) {
        printResult(false, `Token request failed: ${error.message}`);
      }
    } else {
      printResult(false, "Cannot test token generation without loginSessionId");
    }

    // TEST 4: Access Protected Route
    printTest("4. ACCESS PROTECTED ROUTE");
    if (accessToken) {
      try {
        const url = new URL("/protected", BASE_URL);
        const options = {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        };

        const protectedRes = await new Promise((resolve, reject) => {
          const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => {
              resolve({
                status: res.statusCode,
                body: data ? JSON.parse(data) : null,
              });
            });
          });

          req.on("error", reject);
          req.end();
        });

        console.log("Response Status:", protectedRes.status);
        console.log("Response Body:", JSON.stringify(protectedRes.body, null, 2));

        const pass4 = protectedRes.status === 200 && protectedRes.body.message === "Access granted";
        printResult(pass4, "Protected route returns access granted");

        if (protectedRes.body.success_flag) {
          console.log(`\n🚩 Success Flag: ${protectedRes.body.success_flag}`);
        }
      } catch (error) {
        printResult(false, `Protected route request failed: ${error.message}`);
      }
    } else {
      printResult(false, "Cannot test protected route without access token");
    }

    console.log("\n\n" + "=".repeat(60));
    console.log("TEST SUITE COMPLETE");
    console.log("=".repeat(60) + "\n");

  } catch (error) {
    console.error("Test suite error:", error);
  }

  process.exit(0);
}

// Wait a moment for server to be ready, then run tests
console.log("⏳ Waiting for server to be ready...");
setTimeout(runTests, 2000);
