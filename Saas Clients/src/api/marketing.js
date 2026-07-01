import API from "./axios";

export const generateAIContent = ({ contentType, topic, tone, context }) =>
  API.post("/marketing/ai-content", { contentType, topic, tone, context });

export const generateSEOTitle = ({ keyword, tone, targetAudience, type }) =>
  API.post("/marketing/seo-title", { keyword, tone, targetAudience, type });
