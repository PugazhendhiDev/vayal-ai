const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");

const verifyToken = require("./routes/verifyToken.js");
const addData = require("./routes/addData.js");
const getData = require("./routes/getData.js");
const getOtpForEmailVerification = require("./routes/getOtpForEmailVerification.js");
const verifyEmail = require("./routes/verifyEmail.js");
const signup = require("./routes/signup.js");
const signin = require("./routes/signin.js");
const signout = require("./routes/signout.js");
const resetPassword = require("./routes/resetPassword.js");
const getAgriData = require("./routes/getAgriData.js");
const addAgriData = require("./routes/addAgriData.js");
const deleteData = require("./routes/deleteData.js");
const deleteAgriData = require("./routes/deleteAgriData.js");
const weatherData = require("./routes/weatherData.js");
const news = require("./routes/news.js");
const getChatHistory = require("./routes/getChatHistory.js");
const addChatHistory = require("./routes/addChatHistory.js");
const deleteChatHistory = require("./routes/deleteChatHistory.js");
const getChatData = require("./routes/getChatData.js");
const addChatData = require("./routes/addChatData.js");
const shopData = require("./routes/shopData.js");

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);

const mongoURI = process.env.MONGODB_URI;

dotenv.config();

let isConnecting = false;

async function connectToDatabase() {
  if (isConnecting || mongoose.connection.readyState !== 0) {
    return;
  }

  isConnecting = true;
  console.log("Attempting to connect to MongoDB...");

  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("Connected to MongoDB!");
  } catch (err) {
    console.error("Database connection failed:", err);
    console.log("Retrying in 5 seconds...");
    setTimeout(() => {
      isConnecting = false;
      connectToDatabase();
    }, 5000);
  }
}

const db = mongoose.connection;

db.once("open", () => console.log("MongoDB connection opened."));
db.on("disconnected", () => {
  console.error("MongoDB disconnected. Reconnecting...");
  setTimeout(connectToDatabase, 5000);
});
db.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

connectToDatabase();

const storage = new multer.memoryStorage();
const upload = multer({ storage });

cloudinary.config({
  cloud_name: process.env.FILE_SERVER_NAME,
  api_key: process.env.FILE_SERVER_API_KEY,
  api_secret: process.env.FILE_SERVER_API_SECRET,
});

async function handleUpload(file) {
  const res = await cloudinary.uploader.upload(file, {
    resource_type: "image",
    folder: "uploads",
    format: "jpg",
  });
  return res;
}

async function handleDelete(file) {
  const res = await cloudinary.uploader.destroy(file, (error, result) => {
    if (error) console.log(error);
  });
  return res;
}

const transporter = nodemailer.createTransport({
  service: process.env.NODEMAILER_SERVICE_PROVIDER,
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const clearCache = (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const idToken = authHeader.split("Bearer ")[1];

    admin
      .auth()
      .verifyIdToken(idToken)
      .then((decodedToken) => {
        req.uid = decodedToken.uid;
        next();
      })
      .catch((error) => {
        res.status(401).json({ message: "Unauthorized" });
      });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

app.post(
  "/api/getOtpForEmailVerification",
  getOtpForEmailVerification(
    transporter,
    process.env.APP_NAME,
    process.env.NODEMAILER_EMAIL
  )
);

app.post("/api/verifyEmail", verifyEmail());

app.post("/api/signup", signup(admin));

app.post("/api/signin", signin(admin));

app.get("/api/signout", clearCache, authenticateToken, signout());

app.post(
  "/api/resetPassword",
  resetPassword(
    admin,
    transporter,
    process.env.APP_NAME,
    process.env.NODEMAILER_EMAIL
  )
);

app.get("/api/verifyToken", clearCache, authenticateToken, verifyToken());

app.post(
  "/api/addData",
  authenticateToken,
  upload.single("agri_image"),
  addData(handleUpload)
);

app.get("/api/getData", clearCache, authenticateToken, getData());

app.post("/api/getAgriData/:showData", authenticateToken, getAgriData());

app.post(
  "/api/addAgriData",
  authenticateToken,
  upload.single("agri_image"),
  addAgriData(handleUpload, handleDelete)
);

app.post("/api/deleteData", authenticateToken, deleteData(handleDelete));

app.post(
  "/api/deleteAgriData",
  authenticateToken,
  deleteAgriData(handleDelete)
);

app.post("/api/weatherData", authenticateToken, weatherData());

app.get("/api/news", clearCache, authenticateToken, news());

app.post("/api/shopData", clearCache, authenticateToken, shopData());

app.get("/api/getChatHistory", clearCache, authenticateToken, getChatHistory());

app.post("/api/addChatHistory", authenticateToken, addChatHistory());

app.post(
  "/api/deleteChatHistory",
  authenticateToken,
  deleteChatHistory(handleDelete)
);

app.post("/api/getChatData", authenticateToken, getChatData());

app.post(
  "/api/addChatData",
  authenticateToken,
  upload.single("agri_image"),
  addChatData(handleUpload, handleDelete)
);

app.use(express.static(path.join(__dirname, "client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

module.exports = app;
