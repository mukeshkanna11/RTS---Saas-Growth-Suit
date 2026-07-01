import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { useAIGenerate } from "../../hooks/useAI";
import AIOutputBox from "../../components/ai/AIOutputBox";
import AIHistoryPanel from "../../components/ai/AIHistoryPanel";

const TONES = ["professional", "casual", "friendly", "authoritative", "witty"];
const AUDIENCES = ["general", "beginners", "professionals", "students", "business owners", "developers"];

export default function SEOGenerator() {
  const [activeFeature, setActiveFeature] = useState("seo_title");
  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [tone, setTone] = useState("professional");
  const [audience, setAudience] = useState("general");
  const [showHistory, setShowHistory] = useState(false);

  const { generate, output, loading, error, reset } = useAIGenerate();

  const handleGenerate = () => {
    if (!keyword.trim()) return;
    generate(activeFeature, { keyword, title, tone, targetAudience: audience });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <a href="/ai" className="hover:text-purple-600">AI Suite</a>
            <span>/</span>
            <span className="text-gray-800 font-medium">SEO Generator</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Content Generator</h1>
          <p className="text-gray-500 mt-1">Generate SEO-optimized titles and meta descriptions for any keyword</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-5">

            {/* Feature Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-1 flex shadow-sm">
              {[
                { id: "seo_title", label: "Title Generator" },
                { id: "meta_description", label: "Meta Description" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setActiveFeature(f.id); reset(); }}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeFeature === f.id
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Keyword Input */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Primary Keyword <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    placeholder="e.g. best CRM software for startups"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {activeFeature === "meta_description" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Page Title <span className="text-gray-400 text-xs font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your page title for context"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Tone"
                  value={tone}
                  onChange={setTone}
                  options={TONES}
                />
                <SelectField
                  label="Target Audience"
                  value={audience}
                  onChange={setAudience}
                  options={AUDIENCES}
                />
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !keyword.trim()}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Generating with AI..." : "✨ Generate"}
            </button>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Output */}
            <AIOutputBox output={output} loading={loading} />
          </div>

          {/* Right: History */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-fit">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full mb-4"
            >
              <h3 className="font-semibold text-gray-800">History</h3>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${showHistory ? "rotate-180" : ""}`}
              />
            </button>
            {showHistory && <AIHistoryPanel feature={activeFeature === "seo_title" ? "seo_title" : "meta_description"} />}
            {!showHistory && (
              <p className="text-sm text-gray-400 text-center py-6">Click to view your generation history</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-4 py-2.5 pr-9 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent capitalize"
        >
          {options.map((opt) => (
            <option key={opt} value={opt} className="capitalize">{opt}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}
