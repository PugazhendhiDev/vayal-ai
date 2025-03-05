const mongoose = require("mongoose");

const agriChatListSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  chat_name: { type: String, required: true },
  last_msg_time: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
});

const agriChatList = mongoose.model("agri_chat_lists", agriChatListSchema);

module.exports = agriChatList;
