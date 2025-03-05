const mongoose = require("mongoose");

const userLocationSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  location: { type: Object, required: true },
  created_at: { type: Date, default: Date.now },
});

const userLocation = mongoose.model("user_locations", userLocationSchema);
module.exports = userLocation;
