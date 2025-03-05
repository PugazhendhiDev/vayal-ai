const express = require("express");
const router = express.Router();
const agriData = require("../models/agriData");

function getagriData() {
  router.post("/api/getagriData/:showData", async (req, res) => {
    try {
      const uid = req.uid;
      let id = req.body.id;
      const showData = req.params.showData;

      let query = {};

      if (showData === "preview") {
        query = { uid, agri_data_id: `${uid}-${id}` };
        const data = await agriData.find(
          query,
          "id image_name created_at"
        ).sort({ _id: -1 });
        return res.status(200).json(data);
      } else if (showData === "content") {
        query = { uid, _id: id };
        const data = await agriData.findOne(query);
        return res.status(200).json(data);
      }

      res.status(400).json({ error: "Invalid showData parameter" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = getagriData;
