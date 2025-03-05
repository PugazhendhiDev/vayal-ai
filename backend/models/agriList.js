const mongoose = require("mongoose");

const agriListSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  name: { type: String, required: true },
  image_name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const agriList = mongoose.model("agri_lists", agriListSchema);

module.exports = agriList;
