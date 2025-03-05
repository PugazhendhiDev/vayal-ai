const express = require("express");
const userId = require("../models/userId");
const router = express.Router();

function verifyToken() {
  router.get("/api/verifyToken", async (req, res) => {
    const uid = req.uid;

    try {
      const userExists = await userId.exists({ uid });

      if (userExists) {
        res.json({ exists: true, message: "User exists in the database" });
      } else {
        res.status(401).json({ exists: false, message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Database error", details: error.message });
    }
  });

  return router;
}

module.exports = verifyToken;
