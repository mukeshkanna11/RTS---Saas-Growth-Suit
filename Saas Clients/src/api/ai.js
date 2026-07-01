import api from "./axios";

export const generateAIContent = (feature, inputData) =>
  api.post("/ai/generate", { feature, ...inputData });

export const getAIHistory = (params) =>
  api.get("/ai/history", { params });

export const getAIUsage = () =>
  api.get("/ai/usage");

export const deleteAIHistory = (id) =>
  api.delete(`/ai/history/${id}`);
