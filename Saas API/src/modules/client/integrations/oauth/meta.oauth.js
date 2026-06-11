const axios = require("axios");

exports.getAuthUrl = () => {
  const clientId =
    process.env.META_APP_ID;

  const redirectUri =
    process.env.META_REDIRECT_URI;

  return `https://www.facebook.com/v23.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=pages_show_list,instagram_basic,instagram_manage_messages,whatsapp_business_management,whatsapp_business_messaging`;
};

exports.exchangeCode = async (
  code
) => {
  const response = await axios.get(
    "https://graph.facebook.com/v23.0/oauth/access_token",
    {
      params: {
        client_id:
          process.env.META_APP_ID,

        client_secret:
          process.env.META_APP_SECRET,

        redirect_uri:
          process.env.META_REDIRECT_URI,

        code,
      },
    }
  );

  return response.data;
};