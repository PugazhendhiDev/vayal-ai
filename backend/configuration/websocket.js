const WebSocket = require("ws");
const iotDevice = require("../models/iotDevice");

const clients = {};
const pingInterval = 30000;

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    ws.isAlive = true;

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        if (!data.deviceId) {
          ws.close();
          return;
        }

        const device = await iotDevice.findById(data.deviceId);
        if (!device) {
          ws.close();
          return;
        }

        clients[data.deviceId] = ws;
        ws.deviceId = data.deviceId;

        if (device.status !== "Online") {
          await iotDevice.updateOne(
            { _id: data.deviceId },
            { status: "Online" }
          );
        }
      } catch (error) {
        ws.close();
      }
    });

    ws.on("close", async () => {
      handleDisconnection(ws);
    });
  });

  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        handleDisconnection(ws);
        ws.terminate();
      } else {
        ws.isAlive = false;
        ws.ping();
      }
    });
  }, pingInterval);
}

async function handleDisconnection(ws) {
  if (ws.deviceId && clients[ws.deviceId] === ws) {
    delete clients[ws.deviceId];

    const device = await iotDevice.findById(ws.deviceId);
    if (device && device.status !== "Offline") {
      await iotDevice.updateOne(
        { _id: ws.deviceId },
        { status: "Offline", isWorking: false }
      );
    }

    if (
      ws.readyState !== WebSocket.CLOSED &&
      ws.readyState !== WebSocket.CLOSING
    ) {
      ws.terminate();
    }
  }
}

async function sendCommand(deviceId, command) {
  try {
    const device = await iotDevice.findById(deviceId);

    if (!device) {
      if (clients[deviceId]) {
        clients[deviceId].terminate();
        delete clients[deviceId];
      }

      return false;
    }

    if (clients[deviceId]) {
      clients[deviceId].send(command);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error sending command:", error);
  }
}

module.exports = { setupWebSocket, sendCommand };
