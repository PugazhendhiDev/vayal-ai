const express = require("express");
const router = express.Router();
const iotDevice = require("../models/iotDevice");
const { sendCommand } = require("../configuration/websocket.js");

function updateDevice() {
  router.put("/api/updateDevice", async (req, res) => {
    const { deviceId, isWorking } = req.body;

    if (!deviceId || typeof isWorking !== "boolean") {
      return res.status(400).json({ error: "Invalid request data" });
    }

    try {
      const success = await sendCommand(deviceId, isWorking ? "start" : "stop");

      if (success) {
        await iotDevice.updateOne({ _id: deviceId }, { isWorking });

        return res
          .status(200)
          .json({ message: "Command sent and device updated" });
      } else {
        return res
          .status(500)
          .json({ error: "Device is offline or not connected" });
      }
    } catch (error) {
      console.error("Error updating device:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

module.exports = updateDevice;
