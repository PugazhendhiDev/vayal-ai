const express = require("express");
const router = express.Router();
const userOtp = require("../models/userOtp");

function getOtpForEmailVerification(transporter, appName, myEmail) {
  router.post("/api/getOtpForEmailVerification", async (req, res) => {
    const email = req.body.email;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const userExists = await userOtp.findOne({ email });

      if (userExists) {
        await userOtp.deleteOne({ email });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await userOtp.create({ email, otp });

      const mailOptions = {
        from: myEmail,
        to: email,
        subject: `${appName}: OTP for Account Creation`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #333;">Account Verification</h2>
            <p>Hi,</p>
            <p>Use the OTP below to verify your account and complete the registration process:</p>
            <p style="text-align: center; font-size: 24px; font-weight: bold; background-color: #007bff; color: #ffffff; padding: 10px; border-radius: 5px; display: inline-block;">
              ${otp}
            </p>
            <p>This OTP is valid for a limited time. Do not share it with anyone.</p>
            <hr style="border: none; border-top: 1px solid #ddd;">
            <p style="color: #777; font-size: 12px;">If you did not request this, please ignore this email.</p>
            <p style="color: #777; font-size: 12px;">For any assistance, contact our support team.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({ message: "OTP sent successfully." });
    } catch (error) {
      console.error("Error generating OTP:", error);
      return res
        .status(500)
        .json({ error: "Error generating OTP", details: error.message });
    }
  });

  return router;
}

module.exports = getOtpForEmailVerification;
