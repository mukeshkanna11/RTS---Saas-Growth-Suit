const axios = require("axios");

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// ===============================
// FORMAT PHONE NUMBER (INDIA SAFE)
// ===============================
const formatPhone = (to) => {
  if (!to) return null;

  // remove spaces, +, -
  let number = to.toString().replace(/\D/g, "");

  // if India number without country code
  if (number.length === 10) {
    number = "91" + number;
  }

  return number;
};

// ===============================
// SEND WHATSAPP MESSAGE
// ===============================
exports.sendWhatsApp = async ({ to, message }) => {
  try {
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      throw new Error("WhatsApp API not configured");
    }

    const formattedNumber = formatPhone(to);

    if (!formattedNumber) {
      throw new Error("Invalid phone number");
    }

    const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: formattedNumber,
        type: "text",
        text: {
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📲 WhatsApp sent to:", formattedNumber);

    return response.data;
  } catch (err) {
    console.error(
      "❌ WhatsApp Error:",
      err.response?.data || err.message
    );
    throw err;
  }
};