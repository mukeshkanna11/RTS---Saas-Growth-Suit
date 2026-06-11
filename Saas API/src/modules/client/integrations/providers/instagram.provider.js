const axios = require("axios");

class InstagramProvider {
  async getProfile({
    accessToken,
    accountId,
  }) {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v23.0/${accountId}`,
        {
          params: {
            fields:
              "id,username,followers_count,media_count",
            access_token: accessToken,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        error?.response?.data?.error?.message ||
          "Instagram fetch failed"
      );
    }
  }

  async testConnection({
    accessToken,
    accountId,
  }) {
    try {
      const profile =
        await this.getProfile({
          accessToken,
          accountId,
        });

      return {
        success: true,
        profile,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

module.exports = new InstagramProvider();