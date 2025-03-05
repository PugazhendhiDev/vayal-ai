const express = require("express");
const userId = require("../models/userId");
const router = express.Router();

function signup(admin) {
  router.post("/api/signup", async (req, res) => {
    const { idToken, Terms_Of_Use_And_Privacy_Policy } = req.body;

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const { uid, email } = decodedToken;

      const newUser = new userId({
        uid,
        email,
        Terms_Of_Use_And_Privacy_Policy,
      });

      await newUser.save();
      res.status(201).json({
        message: "User created and stored in MongoDB successfully!",
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ error: "Invalid token", details: error.message });
    }
  });

  return router;
}

module.exports = signup;
