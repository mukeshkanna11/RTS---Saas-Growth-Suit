import { useEffect, useState, useCallback } from "react";
import API from "../api";

export default function useCRM() {
  const [state, setState] = useState({
    contacts: [],
    deals: [],
    activities: [],
    notes: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [c, d, a, n] = await Promise.all([
        API.get("/crm/contacts"),
        API.get("/crm/deals"),
        API.get("/crm/activities"),
        API.get("/crm/notes"),
      ]);

      setState({
        contacts: c.data?.data || [],
        deals: d.data?.data || [],
        activities: a.data?.data || [],
        notes: n.data?.data || [],
      });

    } catch (err) {
      console.error("CRM load error:", err);
      setError(err.message || "Failed to load CRM data");

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, loading, error, refresh: load };
}