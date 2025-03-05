const mongoose = require("mongoose");

const agriChatsSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  chat_id: { type: String, required: true },
  user_msg: { type: String, required: true },
  ai_msg: { type: String, required: true },
  image_name: { type: String },
  created_at: { type: Date, default: Date.now },
});

const agriChats = mongoose.model("agri_chats", agriChatsSchema);

module.exports = agriChats;
