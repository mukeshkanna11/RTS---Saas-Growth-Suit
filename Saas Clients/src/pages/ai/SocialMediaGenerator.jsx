import { useState } from "react";
import { Share2, ChevronDown } from "lucide-react";
import { useAIGenerate } from "../../hooks/useAI";
import AIOutputBox from "../../components/ai/AIOutputBox";
import AIHistoryPanel from "../../components/ai/AIHistoryPanel";

const PLATFORMS = [
  { id: "LinkedIn", label: "LinkedIn", color: "bg-blue-600", text: "text-blue-600", border: "border-blue-600" },
  { id: "Twitter/X", label: "Twitter / X", color: "bg-gray-900", text: "text-gray-900", border: "border-gray-900" },
  { id: "Instagram", label: "Instagram", color: "bg-gradient-to-r from-pink-500 to-purple-500", text: "text-pink-600", border: "border-pink-500" },
  { id: "Facebook", label: "Facebook", color: "bg-blue-500", text: "text-blue-500", border: "border-blue-500" },
];

export default function SocialMediaGenerator() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("LinkedIn");
  const [tone, setTone] = useState("professional");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const { generate, output, loading, error } = useAIGenerate();

  const handleGenerate = () => {
    if (!topic.trim()) return;
    generate("social", { topic, platform, tone, includeHashtags });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <a href="/ai" className="hover:text-purple-600">AI Suite</a>
            <span>/</span>
            <span className="text-gray-800 font-medium">Social Media</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Social Media Generator</h1>
          <p className="text-gray-500 mt-1">Create platform-native posts that drive real engagement</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* Platform Selector */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Select Platform</label>
              <div className="grid grid-cols-2 gap-3">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                      platform === p.id
                        ? `${p.border} ${p.text} bg-gray-50`
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Topic or Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                  placeholder="e.g. We just launched a new AI feature in our SaaS platform..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tone</label>
                  <div className="relative">
                    <select value={tone} onChange={(e) => setTone(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 pr-8 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 capitalize">
                      {["professional", "casual", "inspirational", "humorous", "educational"].map((t) => (
                        <option key={t} value={t} className="capitalize">{t}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none mt-6">
                  <div
                    onClick={() => setIncludeHashtags(!includeHashtags)}
                    className={`w-10 h-5 rounded-full transition-colors ${includeHashtags ? "bg-purple-600" : "bg-gray-300"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${includeHashtags ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Hashtags</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? `Creating ${platform} posts...` : `✨ Generate ${platform} Posts`}
            </button>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
            )}

            <AIOutputBox output={output} loading={loading} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-fit">
            <button onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-between w-full mb-4">
              <h3 className="font-semibold text-gray-800">History</h3>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showHistory ? "rotate-180" : ""}`} />
            </button>
            {showHistory ? <AIHistoryPanel feature="social" /> : (
              <p className="text-sm text-gray-400 text-center py-6">Click to view history</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
