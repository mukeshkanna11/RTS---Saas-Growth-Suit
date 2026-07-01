import { useState } from "react";
import { Mail, ChevronDown } from "lucide-react";
import { useAIGenerate } from "../../hooks/useAI";
import AIOutputBox from "../../components/ai/AIOutputBox";
import AIHistoryPanel from "../../components/ai/AIHistoryPanel";

export default function EmailGenerator() {
  const [activeFeature, setActiveFeature] = useState("email_subject");
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState("professional");
  const [audience, setAudience] = useState("subscribers");
  const [showHistory, setShowHistory] = useState(false);

  const { generate, output, loading, error, reset } = useAIGenerate();

  const handleGenerate = () => {
    if (!topic.trim()) return;
    generate(activeFeature, { topic, goal, tone, targetAudience: audience });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <a href="/ai" className="hover:text-purple-600">AI Suite</a>
            <span>/</span>
            <span className="text-gray-800 font-medium">Email Content</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Email Content Generator</h1>
          <p className="text-gray-500 mt-1">Write subject lines and full email campaigns that convert</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-1 flex shadow-sm">
              {[
                { id: "email_subject", label: "Subject Lines" },
                { id: "email", label: "Full Email Body" },
              ].map((f) => (
                <button key={f.id} onClick={() => { setActiveFeature(f.id); reset(); }}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeFeature === f.id ? "bg-purple-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Topic <span className="text-red-500">*</span>
                </label>
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. New product launch announcement"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>

              {activeFeature === "email" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Goal</label>
                  <input type="text" value={goal} onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Get readers to sign up for a free trial"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tone</label>
                  <div className="relative">
                    <select value={tone} onChange={(e) => setTone(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 pr-8 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 capitalize">
                      {["professional", "friendly", "urgent", "casual", "inspiring"].map((t) => (
                        <option key={t} value={t} className="capitalize">{t}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Audience</label>
                  <input value={audience} onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. SaaS founders"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
            </div>

            <button onClick={handleGenerate} disabled={loading || !topic.trim()}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {loading ? "Writing email..." : `✨ ${activeFeature === "email_subject" ? "Generate Subject Lines" : "Write Email"}`}
            </button>

            {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
            <AIOutputBox output={output} loading={loading} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-fit">
            <button onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-between w-full mb-4">
              <h3 className="font-semibold text-gray-800">History</h3>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showHistory ? "rotate-180" : ""}`} />
            </button>
            {showHistory ? <AIHistoryPanel feature="email" /> : (
              <p className="text-sm text-gray-400 text-center py-6">Click to view history</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
