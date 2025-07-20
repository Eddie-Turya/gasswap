const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const app = express();

// ✅ Fix CORS to allow frontend
app.use(cors({
  origin: "*", // Replace with "https://beemxchain.io" to lock to your domain
}));

app.use(bodyParser.json());

// === CONFIG ===
const FEE_WALLET = "DyFn3wGNQuRoc28WtUKrKgTCkbMsEj1Ww4aZ1RTWWcWY";
const JUPITER_API_URL = "https://quote-api.jup.ag/v6";

// === SWAP ENDPOINT ===
app.post("/getSwapTx", async (req, res) => {
  try {
    const { inputMint, outputMint, amount, userPublicKey } = req.body;

    if (!inputMint || !outputMint || !amount || !userPublicKey) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const platformFeeBps = 3; // 0.03%
    const feeAccount = FEE_WALLET;

    // ✅ Get best quote
    const quoteResp = await fetch(
      `${JUPITER_API_URL}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50&platformFeeBps=${platformFeeBps}`
    );
    const quote = await quoteResp.json();

    if (!quote.data || quote.data.length === 0) {
      console.error("❌ No quote data found", quote);
      return res.status(400).json({ error: "No quote data found." });
    }

    const bestRoute = quote.data[0];

    // ✅ Build swap transaction
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

    if (!swapTx.swapTransaction) {
      console.error("❌ Swap transaction build failed:", swapTx);
      return res.status(500).json({ error: "Failed to build swap transaction", swapTx });
    }

    // ✅ Return the transaction
    res.json(swapTx);
  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ error: "Internal server error", message: error.message });
  }
});

// === START SERVER ===
app.listen(3000, () => {
  console.log("🚀 GASSWAP backend running on http://localhost:3000");
});
