const express = require("express");
const iotDevice = require("../models/iotDevice");
const router = express.Router();

function getDevice() {
  router.get("/api/getDevice", async (req, res) => {
    const uid = req.uid;

    try {
      const devices = await iotDevice.find({ userUid: uid });
      if (devices.length === 0)
        return res.status(404).json({ message: "No devices found" });
      res.json(devices);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = getDevice;
