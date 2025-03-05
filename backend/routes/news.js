const express = require("express");
const router = express.Router();

const dotenv = require("dotenv");
dotenv.config();

function news() {
  router.get("/api/news", async (req, res) => {
    const newsData = await fetch(
      `https://newsdata.io/api/1/latest?apikey=${process.env.NEWS_API_KEY}&q=agriculture or crops or crops price or agriculture in india&country=in&language=en`
    );
    const jsonNewsData = await newsData.json();
    res.status(200).json({
      message: "News data fetched successfully.",
      data: jsonNewsData,
    });
  });
  return router;
}

module.exports = news;
