import { useState } from "react";
import { Megaphone, ChevronDown } from "lucide-react";
import { useAIGenerate } from "../../hooks/useAI";
import AIOutputBox from "../../components/ai/AIOutputBox";
import AIHistoryPanel from "../../components/ai/AIHistoryPanel";

const PLATFORMS = ["Google Ads", "Meta (Facebook/Instagram)", "LinkedIn Ads", "Twitter Ads"];
const GOALS = ["Drive conversions", "Generate leads", "Increase brand awareness", "Drive website traffic", "Promote a sale/offer"];

export default function AdCopyGenerator() {
  const [product, setProduct] = useState("");
  const [platform, setPlatform] = useState("Google Ads");
  const [goal, setGoal] = useState("Drive conversions");
  const [audience, setAudience] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const { generate, output, loading, error } = useAIGenerate();

  const handleGenerate = () => {
    if (!product.trim()) return;
    generate("ad_copy", { product, platform, goal, targetAudience: audience, tone: "persuasive" });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <a href="/ai" className="hover:text-purple-600">AI Suite</a>
            <span>/</span>
            <span className="text-gray-800 font-medium">Ad Copy</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Ad Copy Generator</h1>
          <p className="text-gray-500 mt-1">Generate high-converting ad copy for Google and Meta ads</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Product / Service <span className="text-red-500">*</span>
                </label>
                <input type="text" value={product} onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. AI-powered CRM software for small businesses"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Platform</label>
                  <div className="relative">
                    <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 pr-8 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                      {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign Goal</label>
                  <div className="relative">
                    <select value={goal} onChange={(e) => setGoal(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 pr-8 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                      {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Target Audience <span className="text-gray-400 text-xs font-normal">(optional but recommended)</span>
                </label>
                <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. Small business owners aged 30-50 in India"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-sm text-orange-700 font-medium">
                💡 Tip: The more specific your product description and target audience, the better the ad copy. Include your unique selling point (USP).
              </p>
            </div>

            <button onClick={handleGenerate} disabled={loading || !product.trim()}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {loading ? "Writing ad copy..." : "✨ Generate Ad Copy"}
            </button>

            {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
            <AIOutputBox output={output} loading={loading} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-fit">
            <button onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-between w-full mb-4">
              <h3 className="font-semibold text-gray-800">History</h3>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showHistory ? "rotate-180" : ""}`} />
            </button>
            {showHistory ? <AIHistoryPanel feature="ad_copy" /> : (
              <p className="text-sm text-gray-400 text-center py-6">Click to view history</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
