const express = require("express");
const router = express.Router();
const agriChatList = require("../models/agriChatList");

function getChatHistory() {
  router.get("/api/getChatHistory", async (req, res) => {
    const uid = req.uid;

    try {
      const chatHistory = await agriChatList.find({ uid })
        .select("id chat_name last_msg_time created_at")
        .sort({ last_msg_time: -1 });

      res.status(200).json(chatHistory);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  return router;
}

module.exports = getChatHistory;
