const express = require("express");
const router = express.Router();
const agriChatList = require("../models/agriChatList");

function addChatHistory() {
  router.post("/api/addChatHistory", async (req, res) => {
    const uid = req.uid;
    const chat_name = req.body.chat_name;

    try {
      const newChat = new agriChatList({ uid, chat_name });
      await newChat.save();
      res.sendStatus(200);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = addChatHistory;
