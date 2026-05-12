const express = require("express");
const app = express();
app.use(express.json());

const { handleMessage } = require("./bot");

// Telegram Webhook endpoint
app.post("/webhook", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.text) return res.sendStatus(200);

    await handleMessage(message);
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(200); // 항상 200 반환해야 Telegram이 재시도 안 함
  }
});

app.get("/", (req, res) => res.send("Bot is running ✅"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
