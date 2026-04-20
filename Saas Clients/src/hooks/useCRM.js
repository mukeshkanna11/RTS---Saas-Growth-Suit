import { useEffect, useState } from "react";
import API from "../api";

export default function useCRM() {
  const [state, setState] = useState({
    contacts: [],
    deals: [],
    activities: [],
    notes: [],
  });

  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);

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
      console.log("CRM load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { ...state, loading, refresh: load };
}