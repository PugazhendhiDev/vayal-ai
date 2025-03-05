const express = require("express");
const router = express.Router();
const agriList = require("../models/agriList");
const agriData = require("../models/agriData");

function deleteData(handleDelete) {
  router.post("/api/deleteData", async (req, res) => {
    try {
      const uid = req.uid;
      const id = req.body.id;

      const agriItem = await agriList.findOneAndDelete({ uid, _id: id });

      if (!agriItem) {
        return res.status(404).json({ error: "Agri list not found." });
      }

      if (agriItem.image_name) {
        await handleDelete(agriItem.image_name);
      }

      const childData = await agriData.find({
        uid,
        agri_data_id: `${uid}-${id}`,
      });

      const childImageNames = childData
        .map((item) => item.image_name)
        .filter(Boolean);

      const deletedChildData = await agriData.deleteMany({
        uid,
        agri_data_id: `${uid}-${id}`,
      });

      for (const imageName of childImageNames) {
        await handleDelete(imageName);
      }

      res.status(200).json({
        message: "Data and related images deleted successfully.",
        deletedChildCount: deletedChildData.deletedCount,
      });
    } catch (error) {
      res.status(500).json({
        error: "Error deleting data",
        details: error.message,
      });
    }
  });

  return router;
}

module.exports = deleteData;
