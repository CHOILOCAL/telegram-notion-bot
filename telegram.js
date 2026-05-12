const axios = require("axios");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

async function sendTelegram(chatId, text) {
  try {
    await axios.post(`${BASE_URL}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error("Telegram send error:", err.response?.data || err.message);
  }
}

// Webhook 등록 함수 (최초 1회 실행용)
async function setWebhook(url) {
  const res = await axios.post(`${BASE_URL}/setWebhook`, { url });
  console.log("Webhook set:", res.data);
}

module.exports = { sendTelegram, setWebhook };
