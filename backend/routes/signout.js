const express = require("express");
const router = express.Router();

function signout() {
  router.post("/api/signout", async (req, res) => {
    try {
      res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      res.status(400).json({
        error: "Logout failed",
        details: error.message || "Unable to log out. Please try again.",
      });
    }
  });
  return router;
}

module.exports = signout;
