const express = require("express");
const userId = require("../models/userId");
const router = express.Router();

function signin(admin) {
  router.post("/api/signin", async (req, res) => {
    const { idToken, email } = req.body;

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const existingUser = await userId.findOne({ uid });

      if (!existingUser) {
        const newUser = new userId({
          uid,
          email,
          Terms_Of_Use_And_Privacy_Policy: true,
        });

        await newUser.save();
        res
          .status(200)
          .json({ message: "Successfully signed in and user inserted" });
      } else {
        res.status(200).json({ message: "Successfully signed in" });
      }
    } catch (error) {
      res.status(404).json({
        error: "Invalid credentials or user not found",
        details: error.message,
      });
    }
  });

  return router;
}

module.exports = signin;
