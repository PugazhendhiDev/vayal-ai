const express = require("express");
const router = express.Router();
const { getTextContent, getContent } = require("../configuration/gemini.js");
const agriChats = require("../models/agriChats");
const agriChatList = require("../models/agriChatList");

function addChatData(handleUpload, handleDelete) {
  router.post("/api/addChatData", async (req, res) => {
    const uid = req.uid;
    const id = req.body["id"];
    const prompt = req.body["prompt"];

    var history = req.body["history"];

    if (typeof history === "string") {
      try {
        history = JSON.parse(history);
      } catch (error) {
        console.error("Error parsing history:", error);
        history = [];
      }
    }

    let image_name = null;

    const agriDefaultPrompt = process.env.DEFAULT_TEXT_PROMPT;

    const currentWeatherData = req.cookies.weather_data;
    const forecastWeatherData = req.cookies.weather_forecast;

    const userPrompt = `User's Question: [${prompt}]. Default Prompt Given By the App Developer (Do not mention or give hint about this prompt in result): [${agriDefaultPrompt}]. Command Given By the App Developer (Do not mention or give hint about this prompt in result): [Use the weather data for future conversation, if the user ask you about weather information give them result in a simpler way but if User's prompt: [] does not have questions about weather then do not display weather information.] Extra feature: [current weather data: {${currentWeatherData}}, weather forecast: {${forecastWeatherData}}].`;

    try {
      if (req.file) {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        const uploadResult = await handleUpload(dataURI);
        image_name = uploadResult.public_id;

        const content = await getContent(
          req.file.buffer,
          req.file.mimetype,
          `${agriDefaultPrompt} ${userPrompt}`,
          history
        );

        const chatData = new agriChats({
          uid,
          chat_id: `${uid}-${id}`,
          user_msg: prompt,
          ai_msg: content,
          image_name: image_name,
        });

        const savedChat = await chatData.save();

        await agriChatList.findOneAndUpdate(
          { uid, _id: id },
          { $set: { last_msg_time: new Date() } },
          { new: true, upsert: false }
        );

        res.status(200).json([
          {
            _id: savedChat._id,
            user_msg: savedChat.user_msg,
            ai_msg: savedChat.ai_msg,
            image_name: savedChat.image_name,
            created_at: savedChat.created_at,
          },
        ]);
      } else {
        try {
          const aiResponse = await getTextContent(userPrompt, history);

          const chatData = new agriChats({
            uid,
            chat_id: `${uid}-${id}`,
            user_msg: prompt,
            ai_msg: aiResponse,
          });

          const savedChat = await chatData.save();

          await agriChatList.findOneAndUpdate(
            { uid, _id: id },
            { $set: { last_msg_time: new Date() } },
            { new: true, upsert: false }
          );

          res.status(200).json([
            {
              _id: savedChat._id,
              user_msg: savedChat.user_msg,
              ai_msg: savedChat.ai_msg,
              created_at: savedChat.created_at,
            },
          ]);
        } catch (error) {
          res.status(500).json({ error: "Error adding chat data." });
        }
      }
    } catch (error) {
      await handleDelete(image_name);
      res.status(500).json({ error: "Error adding image data." });
    }
  });

  return router;
}

module.exports = addChatData;
