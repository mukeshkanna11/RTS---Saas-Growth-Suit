const { google } =
  require("googleapis");

const oauth2Client =
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

exports.getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
};

exports.exchangeCode = async (
  code
) => {
  const { tokens } =
    await oauth2Client.getToken(code);

  return tokens;
};