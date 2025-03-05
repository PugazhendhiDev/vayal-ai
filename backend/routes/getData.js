const express = require("express");
const router = express.Router();
const agriList = require("../models/agriList");

function getData() {
  router.get("/api/getData", async (req, res) => {
    try {
      const uid = req.uid;

      const data = await agriList.find({ uid }).sort({ _id: -1 });

      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = getData;
