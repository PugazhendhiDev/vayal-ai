const express = require("express");
const iotDevice = require("../models/iotDevice");
const router = express.Router();

function addDevice() {
  router.post("/api/addDevice", async (req, res) => {
    const uid = req.uid;
    const { deviceName, type } = req.body;

    try {
      const newDevice = new iotDevice({
        userUid: uid,
        name: deviceName,
        type: type,
      });
      await newDevice.save();

      res.status(201).json({ message: "Device registered", device: newDevice });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = addDevice;
