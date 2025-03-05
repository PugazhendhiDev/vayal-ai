const express = require("express");
const router = express.Router();
const { getContent } = require("../configuration/gemini.js");
const AgriData = require("../models/agriData.js");

function addAgriData(handleUpload, handleDelete) {
  router.post("/api/addAgriData", async (req, res) => {
    const uid = req.uid;
    const id = req.body["id"];
    const agriDefaultPrompt = process.env.DEFAULT_PROMPT;
    const prompt = req.body["agri_prompt"];

    let image_name;

    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const b64 = Buffer.from(req.file.buffer).toString("base64");
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      const uploadResult = await handleUpload(dataURI);
      image_name = uploadResult.public_id;

      const content = await getContent(
        req.file.buffer,
        req.file.mimetype,
        `${agriDefaultPrompt} ${prompt}`
      );

      const newAgriData = new AgriData({
        uid,
        agri_data_id: `${uid}-${id}`,
        content,
        image_name,
      });

      await newAgriData.save();

      const insertedData = await AgriData.findOne({ image_name });

      res.status(200).json({
        id: insertedData._id,
        message: "Agri data added successfully!",
      });
    } catch (error) {
      console.error("Error processing the request:", error);

      await handleDelete(image_name);

      await AgriData.deleteOne({ uid, agri_data_id: `${uid}-${id}` }).catch(
        (err) => console.error("Error deleting failed entry:", err)
      );

      res
        .status(500)
        .json({ error: "Error generating content or inserting data." });
    }
  });

  return router;
}

module.exports = addAgriData;
