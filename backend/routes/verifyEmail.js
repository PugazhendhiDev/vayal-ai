const express = require("express");
const userOtp = require("../models/userOtp");
const router = express.Router();

function verifyEmail() {
  router.post("/api/verifyEmail", async (req, res) => {
    const { email, otp } = req.body;

    try {
      const otpRecord = await userOtp.findOne({ email });

      if (!otpRecord) {
        return res.status(404).json({ error: "OTP expired or not found" });
      }

      if (otp === otpRecord.otp) {
        await userOtp.deleteOne({ email });
        return res.status(200).json({ message: "Email verified successfully" });
      } else {
        return res
          .status(400)
          .json({ error: "Email verification unsuccessful" });
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      return res
        .status(500)
        .json({ error: "Error verifying email", details: error.message });
    }
  });

  return router;
}

module.exports = verifyEmail;
