const express = require("express");
const iotDevice = require("../models/iotDevice");
const router = express.Router();

function deleteDevice() {
  router.delete("/api/deleteDevice", async (req, res) => {
    const { deviceCode } = req.body;

    try {
      const deletedDevice = await iotDevice.findOneAndDelete({ _id: deviceCode });
  
      if (!deletedDevice) return res.status(404).json({ message: "Device not found" });
  
      res.json({ message: "Device deleted successfully", deletedDevice });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = deleteDevice;
