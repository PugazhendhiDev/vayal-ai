const mongoose = require("mongoose");

const iotDeviceSchema = new mongoose.Schema({
    userUid: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["Greenhouse LED"], required: true },
    status: { type: String, enum: ["Online", "Offline"], default: "Offline" },
    isWorking: { type: Boolean, default: false },
    lastData: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
});

const iotDevice = mongoose.model("iot_devices", iotDeviceSchema);

module.exports = iotDevice;
