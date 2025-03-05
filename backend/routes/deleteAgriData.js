const express = require("express");
const router = express.Router();
const agriData = require("../models/agriData");

function deleteAgriData(handleDelete) {
  router.post("/api/deleteAgriData", async (req, res) => {
    try {
      const uid = req.uid;
      const id = req.body.id;
      const imageName = req.body.image_name;

      await handleDelete(imageName);

      const deletedAgriData = await agriData.findOneAndDelete({
        uid,
        _id: id,
        image_name: imageName,
      });

      if (!deletedAgriData) {
        return res.status(404).json({ error: "Agri data not found." });
      }

      res.status(200).json({ message: "Agri data deleted successfully." });
    } catch (error) {
      res
        .status(500)
        .json({
          error: "Agri data deletion unsuccessful.",
          details: error.message,
        });
    }
  });

  return router;
}

module.exports = deleteAgriData;
