const express = require("express");
const router = express.Router();

const dotenv = require("dotenv");
dotenv.config();

function shopData() {
  router.post("/api/shopData", async (req, res) => {
    const { latitude, longitude } = req.body;

    try {
      const locationResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const locationData = await locationResponse.json();
      const state = locationData.address.state || "Unknown";

      const shopDataResponse = await fetch(
        `https://overpass-api.de/api/interpreter?data=[out:json];area[name="${state}"]->.searchArea;(node["shop"="garden_centre"](area.searchArea);node["shop"="nursery"](area.searchArea););out;`
      );
      const shopDataReport = await shopDataResponse.json();

      res.status(200).json({
        message: "Shop data fetched successfully.",
        data: shopDataReport,
      });
    } catch {
      res.status(500).json({ error: "Error fetching shop data." });
    }
  });
  return router;
}

module.exports = shopData;
