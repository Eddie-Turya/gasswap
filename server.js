// server.js
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const FEE_WALLET = "4EkpmcAnw2F9fMj8U6ySofZNmWyAkGkRhp3MMc7ZLLsL";
const JUPITER_API_URL = "https://quote-api.jup.ag/v6";

app.post("/getSwapTx", async (req, res) => {
  try {
    const { inputMint, outputMint, amount, userPublicKey } = req.body;

    // Add fee account
    const platformFeeBps = 3; // 0.03%
    const feeAccount = FEE_WALLET;

    // Fetch Jupiter route
    const quoteResp = await fetch(
      `${JUPITER_API_URL}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50&platformFeeBps=${platformFeeBps}`
    );
    const quote = await quoteResp.json();

    const bestRoute = quote.data[0];

    // Build swap transaction
    const swapTxResp = await fetch(`${JUPITER_API_URL}/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: bestRoute,
        userPublicKey,
        wrapUnwrapSOL: true,
        feeAccount,
      }),
    });

    const swapTx = await swapTxResp.json();
    res.json(swapTx);
  } catch (error) {
    console.error("Swap Error:", error);
    res.status(500).json({ error: "Failed to create swap transaction." });
  }
});

app.listen(3000, () => {
  console.log("✅ Backend running on http://localhost:3000");
});
