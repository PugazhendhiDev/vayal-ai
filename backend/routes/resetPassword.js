const express = require("express");
const router = express.Router();

function resetPassword(admin, transporter, appName, myEmail) {
  router.post("/api/resetPassword", async (req, res) => {
    const email = req.body.email;
    try {
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      try {
        const resetLink = await admin.auth().generatePasswordResetLink(email);

        const mailOptions = {
          from: myEmail,
          to: email,
          subject: `${appName}: Password Reset Request`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p>Hi,</p>
              <p>You requested a password reset for your account. Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetLink}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 5px; font-weight: bold;">Reset Password</a>
              </p>
              <p>If you didn’t request this, you can ignore this email. Your password will remain unchanged.</p>
              <hr style="border: none; border-top: 1px solid #ddd;">
              <p style="color: #777; font-size: 12px;">If you're having trouble clicking the button, copy and paste the following link into your browser:</p>
              <p style="word-break: break-all; font-size: 12px;"><a href="${resetLink}">${resetLink}</a></p>
              <p style="color: #777; font-size: 12px;">If you need further assistance, please contact our support team.</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Password reset email sent." });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  return router;
}

module.exports = resetPassword;
