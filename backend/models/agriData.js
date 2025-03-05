const mongoose = require("mongoose");

const agriDataSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  agri_data_id: { type: String, required: true },
  content: { type: String, required: true },
  image_name: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

const agriData = mongoose.model("agri_datas", agriDataSchema);

module.exports = agriData;
