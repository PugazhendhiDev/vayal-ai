const express = require("express");
const router = express.Router();
const agriChatList = require("../models/agriChatList");
const agriChats = require("../models/agriChats");

function deleteChatHistory(handleDelete) {
  router.post("/api/deleteChatHistory", async (req, res) => {
    try {
      const uid = req.uid;
      const id = req.body.id;
      const chatId = `${uid}-${id}`;

      await agriChatList.deleteOne({ uid, _id: id });

      const childData = await agriChats.find({
        uid,
        chat_id: chatId,
      });

      const childImageNames = childData
        .map((item) => item.image_name)
        .filter(Boolean);

      await agriChats.deleteMany({ uid, chat_id: chatId });

      for (const imageName of childImageNames) {
        await handleDelete(imageName);
      }
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = deleteChatHistory;
