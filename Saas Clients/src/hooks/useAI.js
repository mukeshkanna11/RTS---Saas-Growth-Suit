import { useState } from "react";
import { generateAIContent, getAIHistory, deleteAIHistory } from "../api/ai";

export function useAIGenerate() {
  const [output, setOutput] = useState("");
  const [historyId, setHistoryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async (feature, inputData) => {
    setLoading(true);
    setError(null);
    setOutput("");
    try {
      const res = await generateAIContent(feature, inputData);
      setOutput(res.data.data.output);
      setHistoryId(res.data.data.historyId);
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Generation failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setOutput("");
    setHistoryId(null);
    setError(null);
  };

  return { generate, output, historyId, loading, error, reset };
}

export function useAIHistory(feature) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await getAIHistory({ feature, page: p, limit: 10 });
      setItems(res.data.items);
      setTotalPages(res.data.totalPages);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    await deleteAIHistory(id);
    setItems((prev) => prev.filter((i) => i._id !== id));
  };

  return { items, loading, page, totalPages, load, remove };
}
