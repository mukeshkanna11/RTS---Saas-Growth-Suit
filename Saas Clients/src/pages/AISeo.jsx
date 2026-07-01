import { useState } from "react";
import axios from "axios";

export default function AISeo() {
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generateSEO = async () => {
    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/v1/seo/seo-title",
        {
          keyword,
        }
      );

      setResult(res.data.data);
    } catch (err) {
      setResult("Error generating SEO content");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>AI SEO Title Generator 🚀</h2>

      <input
        type="text"
        placeholder="Enter keyword"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ padding: "10px", width: "300px" }}
      />

      <button onClick={generateSEO} style={{ marginLeft: "10px" }}>
        {loading ? "Generating..." : "Generate"}
      </button>

      <div style={{ marginTop: "20px" }}>
        <h3>Result:</h3>
        <p>{result}</p>
      </div>
    </div>
  );
}