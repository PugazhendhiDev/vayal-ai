const express = require("express");
const router = express.Router();
const AgriChats = require("../models/agriChats");

function getChatData() {
  router.post("/api/getChatData", async (req, res) => {
    const uid = req.uid;
    const id = req.body.id;
    const chat_id = `${uid}-${id}`;

    try {
      const chatData = await AgriChats.find({ uid, chat_id })
        .select("id user_msg ai_msg image_name created_at")
        .sort({ created_at: 1 });
      res.status(200).json(chatData);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = getChatData;
