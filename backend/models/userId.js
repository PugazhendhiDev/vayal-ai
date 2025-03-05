const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  Terms_Of_Use_And_Privacy_Policy: { type: Boolean, required: true },
  created_at: { type: Date, default: Date.now },
});

const userId = mongoose.model("user_ids", userSchema);

module.exports = userId;