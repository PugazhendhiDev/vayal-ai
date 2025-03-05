const express = require("express");
const router = express.Router();
const agriList = require("../models/agriList");

function addData(handleUpload) {
  router.post("/api/addData", async (req, res) => {
    const uid = req.uid;
    const name = req.body["agri_name"];

    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const b64 = Buffer.from(req.file.buffer).toString("base64");
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      const result = await handleUpload(dataURI);
      const image_name = result.public_id;

      // Insert into MongoDB
      const newAgriItem = new agriList({ uid, name, image_name });
      await newAgriItem.save();

      res.status(200).json({ message: "Data added successfully!" });
    } catch (error) {
      res.status(500).json({ error: "Upload failed", details: error.message });
    }
  });

  return router;
}

module.exports = addData;
