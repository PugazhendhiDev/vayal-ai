#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WebSocketsClient.h>
#include <EEPROM.h>

#define RELAY_PIN LED_BUILTIN
#define FLASH_BUTTON_PIN 0
#define RESET_FLAG_ADDR 99
#define EEPROM_SIZE 100

const char *apSSID = "VayalAI-Device";
const char *apPassword = "12345678";    
const char *serverIP = "Server-IP";
const int serverPort = 3001;

String ssid = "", password = "", deviceId = "";
ESP8266WebServer server(80);
WebSocketsClient webSocket;
bool isConnected = false;

void saveCredentials(String ssid, String password, String id) {
    EEPROM.begin(EEPROM_SIZE);
    for (int i = 0; i < 32; i++) {
        EEPROM.write(i, i < ssid.length() ? ssid[i] : 0);
        EEPROM.write(32 + i, i < password.length() ? password[i] : 0);
        EEPROM.write(64 + i, i < id.length() ? id[i] : 0);
    }
    EEPROM.commit();
}

void loadCredentials() {
    EEPROM.begin(EEPROM_SIZE);
    char storedSSID[32] = {0}, storedPass[32] = {0}, storedID[32] = {0};
    for (int i = 0; i < 32; i++) {
        storedSSID[i] = EEPROM.read(i);
        storedPass[i] = EEPROM.read(32 + i);
        storedID[i] = EEPROM.read(64 + i);
    }
    ssid = String(storedSSID);
    password = String(storedPass);
    deviceId = String(storedID);
}

void factoryReset() {
    Serial.println("\nFACTORY RESET: Clearing credentials...");
    EEPROM.begin(EEPROM_SIZE);
    for (int i = 0; i < EEPROM_SIZE; i++) EEPROM.write(i, 0);
    EEPROM.commit();
    
    Serial.println("Reset done! Restarting...");
    delay(2000);
    ESP.restart();
}

void webSocketEvent(WStype_t type, uint8_t *payload, size_t length) {
    if (type == WStype_CONNECTED) {
        Serial.println("🔗 WebSocket Connected!");
        if (deviceId.length() > 0) {
            String message = "{\"deviceId\":\"" + deviceId + "\"}";
            webSocket.sendTXT(message.c_str());
            Serial.println("Sent Device ID to Server: " + message);
        }
    } else if (type == WStype_TEXT) {
        String message = String((char*)payload);
        Serial.println("Command Received: " + message);
        if (message.equals("start")) {
            digitalWrite(RELAY_PIN, LOW);
            Serial.println("Irrigation Started");
        } else if (message.equals("stop")) {
            digitalWrite(RELAY_PIN, HIGH);
            Serial.println("Irrigation Stopped");
        }
    } else if (type == WStype_DISCONNECTED) {
        Serial.println("WebSocket Disconnected");
    }
}

void handleRoot() {
    server.send(200, "text/html", R"rawliteral(
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Vayal-AI Setup</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f8f9fa;
                }
                .container {
                    background: #fff;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                    width: 90%;
                    max-width: 350px;
                    text-align: center;
                }
                form { display: flex; flex-direction: column; }
                h2 { margin-bottom: 10px; color: #333; }
                input, button {
                    padding: 10px; margin: 8px 0;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 14px;
                }
                button { background: #6c757d; color: white; border: none; cursor: pointer; }
                button:hover { background: #5a6268; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Vayal-AI Setup</h2>
                <form action="/connect" method="POST">
                    <input name="ssid" placeholder="WiFi SSID" required>
                    <input name="pass" type="password" placeholder="WiFi Password" required>
                    <input name="id" placeholder="Device ID" required>
                    <button type="submit">Connect</button>
                </form>
            </div>
        </body>
        </html>
    )rawliteral");
}

void handleConnect() {
    ssid = server.arg("ssid");
    password = server.arg("pass");
    deviceId = server.arg("id");
    saveCredentials(ssid, password, deviceId);
    
    server.send(200, "text/plain", "Connecting to WiFi...");
    delay(1000);
    
    WiFi.softAPdisconnect(true);
    WiFi.begin(ssid.c_str(), password.c_str());

    Serial.println("Connecting...");
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(1000); Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nConnected!");
        isConnected = true;
        webSocket.begin(serverIP, serverPort, "/");
        webSocket.onEvent(webSocketEvent);
    } else {
        Serial.println("\nFailed! Restarting AP mode...");
        WiFi.softAP(apSSID, apPassword);
    }
}

void setup() {
    Serial.begin(115200);
    Serial.println("\nDevice Booting...");

    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, HIGH);
    pinMode(FLASH_BUTTON_PIN, INPUT_PULLUP);

    EEPROM.begin(EEPROM_SIZE);
    loadCredentials();

    if (ssid.length() > 0 && password.length() > 0) {
        WiFi.setHostname(apSSID);
        WiFi.begin(ssid.c_str(), password.c_str());

        Serial.println("Connecting to saved WiFi...");
        int attempts = 0;
        while (WiFi.status() != WL_CONNECTED && attempts < 20) {
            delay(1000); Serial.print(".");
            attempts++;
        }

        if (WiFi.status() == WL_CONNECTED) {
            Serial.println("\nConnected!");
            isConnected = true;
            webSocket.begin(serverIP, serverPort, "/");
            webSocket.onEvent(webSocketEvent);
        } else {
            Serial.println("\nFailed! Starting AP mode...");
            WiFi.softAP(apSSID, apPassword);
        }
    } else {
        WiFi.softAP(apSSID, apPassword);
    }

    server.on("/", handleRoot);
    server.on("/connect", HTTP_POST, handleConnect);
    server.begin();
}

void loop() {
    server.handleClient();
    webSocket.loop();

    static unsigned long lastCheck = 0;
    if (millis() - lastCheck > 5000) {
        Serial.print("WebSocket Status: ");
        Serial.println(webSocket.isConnected() ? "Connected" : "Disconnected");
        lastCheck = millis();
    }

    if (digitalRead(FLASH_BUTTON_PIN) == LOW) {
        Serial.print("Reset Button Pressed... ");
        delay(3000);

        if (digitalRead(FLASH_BUTTON_PIN) == LOW) {
            factoryReset();
        } else {
            Serial.println("Cancelled (Button Released)");
        }
    }
}
