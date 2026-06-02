import { useEffect, useState } from "react";
import axios from "axios";

export default function ClientDashboard() {
  const [dashboard, setDashboard] =
    useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token =
        localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/v1/client/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDashboard(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!dashboard)
    return <p>Loading...</p>;

  return (
    <div>

      <h1>
        Client Dashboard
      </h1>

      <div>
        <h3>Impressions</h3>
        <h2>
          {
            dashboard.overview
              .impressions
          }
        </h2>
      </div>

      <div>
        <h3>Clicks</h3>
        <h2>
          {dashboard.overview.clicks}
        </h2>
      </div>

      <div>
        <h3>Conversions</h3>
        <h2>
          {
            dashboard.overview
              .conversions
          }
        </h2>
      </div>

      <div>
        <h3>Budget Used</h3>

        <h2>
          ₹
          {
            dashboard.budget.spent
          }
        </h2>

        <p>
          of ₹
          {
            dashboard.budget
              .allocated
          }
        </p>
      </div>

    </div>
  );
}