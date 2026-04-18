/**
 * Send email using Microsoft Graph API
 * (Safe minimal implementation)
 */

const axios = require("axios");

async function sendGraphEmail({ to, subject, body, accessToken }) {
  try {
    await axios.post(
      `https://graph.microsoft.com/v1.0/users/${process.env.SENDER_EMAIL}/sendMail`,
      {
        message: {
          subject,
          body: {
            contentType: "Text",
            content: body,
          },
          toRecipients: [
            {
              emailAddress: {
                address: to,
              },
            },
          ],
        },
        saveToSentItems: true,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Graph email sent to:", to);
    return true;
  } catch (error) {
    console.error("❌ Graph Email Error:", error.message);
    return false;
  }
}

module.exports = sendGraphEmail;