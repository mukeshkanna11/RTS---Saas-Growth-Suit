import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Search, Sparkles, Copy, Check, Loader2, ChevronDown,
  LayoutList, FileText, Tag, Clock, Target, Zap, BarChart3,
  Globe, ArrowRight, Star, RefreshCw, Lightbulb, Hash, Award,
  Rocket, CheckCircle2, BookOpen, ShoppingCart, Megaphone,
  MousePointer2, Eye, Brain, ChevronRight, BarChart2,
  AlertCircle, Crosshair, Layers,
} from "lucide-react";
import API from "../api/axios";

// ─────────────────────────────────────────────────────────────────────────────
// STATIC CONFIG DATA
// ─────────────────────────────────────────────────────────────────────────────

const KPI_STATS = [
  {
    label: "Titles Generated", value: 2847, suffix: "", growth: "+12.5%",
    icon: FileText, trendColor: "bg-cyan-400",
    badge: "bg-cyan-500/10 text-cyan-400", iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400", glow: "from-cyan-500/10",
  },
  {
    label: "Avg SEO Score", value: 94, suffix: "/100", growth: "+3.2%",
    icon: BarChart3, trendColor: "bg-violet-400",
    badge: "bg-violet-500/10 text-violet-400", iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400", glow: "from-violet-500/10",
  },
  {
    label: "Hours Saved", value: 128, suffix: "h", growth: "+24%",
    icon: Clock, trendColor: "bg-blue-400",
    badge: "bg-blue-500/10 text-blue-400", iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400", glow: "from-blue-500/10",
  },
  {
    label: "Avg. CTR", value: 84, suffix: "%", growth: "+1.8%", display: "8.4%",
    icon: MousePointer2, trendColor: "bg-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-400", iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400", glow: "from-emerald-500/10",
  },
];

const SEARCH_INTENTS = [
  { id: "informational", label: "Informational", desc: "Users seeking knowledge", icon: BookOpen, active: "border-blue-500/40 bg-blue-500/10 text-blue-300" },
  { id: "commercial",    label: "Commercial",    desc: "Researching to buy",    icon: ShoppingCart, active: "border-violet-500/40 bg-violet-500/10 text-violet-300" },
  { id: "transactional", label: "Transactional", desc: "Ready to purchase",     icon: Zap, active: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" },
  { id: "navigational",  label: "Navigational",  desc: "Seeking a specific site", icon: Crosshair, active: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
];

const TEMPLATES = [
  { id: "product-launch", label: "Product Launch",  desc: "Drive traffic to new releases", keyword: "best [product] for [audience] 2024", icon: Rocket,       tag: "Popular" },
  { id: "ecommerce",      label: "E-commerce",      desc: "Optimize product pages",        keyword: "buy [product] online",             icon: ShoppingCart, tag: null     },
  { id: "blog-seo",       label: "Blog Article",    desc: "SEO-optimized blog titles",     keyword: "how to [achieve goal]",            icon: FileText,     tag: "Popular" },
  { id: "saas",           label: "SaaS Landing",    desc: "Convert visitors to trials",    keyword: "best [software] for [business]",  icon: Globe,        tag: "Hot"    },
  { id: "local",          label: "Local Business",  desc: "Rank for local searches",       keyword: "best [service] in [city]",         icon: Target,       tag: null     },
  { id: "social-proof",   label: "Social Proof",    desc: "Reviews & testimonials",        keyword: "[brand] reviews [year]",           icon: Star,         tag: null     },
];

const AI_TIPS = [
  "Include your primary keyword in the first 30 characters of your title",
  "Use power words like 'Ultimate', 'Complete', 'Proven' to increase CTR",
  "Keep titles between 50–60 chars to avoid Google truncation",
  "Meta descriptions should include a clear CTA to improve click-through rates",
  "Numbers in titles (e.g. '7 Ways') consistently outperform plain titles",
];

const RECOMMENDED_PROMPTS = [
  "best CRM software for startups 2024",
  "how to increase SaaS revenue fast",
  "affordable email marketing tools",
  "project management software comparison",
  "cloud storage solutions for small business",
];

const TONES = ["Professional", "Casual", "Authoritative", "Friendly", "Witty"];

// ─────────────────────────────────────────────────────────────────────────────
// PURE HELPERS  (existing logic preserved exactly)
// ─────────────────────────────────────────────────────────────────────────────

function parseNumberedList(text = "") {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const parsed = lines.map((l) => l.replace(/^\d+[.)]\s*/, "").trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : [text.trim()];
}

function getDifficulty(keyword = "") {
  const words = keyword.trim().split(/\s+/).filter(Boolean).length;
  if (words <= 1) return { label: "Very High", score: 91, color: "red",    bar: "bg-red-500",    text: "text-red-400",    badge: "bg-red-500/10 border-red-500/20 text-red-400"    };
  if (words === 2) return { label: "High",      score: 73, color: "orange", bar: "bg-orange-500", text: "text-orange-400", badge: "bg-orange-500/10 border-orange-500/20 text-orange-400" };
  if (words <= 3)  return { label: "Medium",    score: 49, color: "yellow", bar: "bg-yellow-500", text: "text-yellow-400", badge: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" };
  return                  { label: "Low",       score: 27, color: "green",  bar: "bg-emerald-500",text: "text-emerald-400",badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" };
}

function getOpportunityScore(keyword = "") {
  const words = keyword.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(40 + words * 13, 97);
}

function getKeywordSuggestions(kw = "") {
  if (!kw.trim()) return [];
  const base = kw.trim();
  return [
    `best ${base}`,
    `top ${base} 2024`,
    `how to use ${base}`,
    `affordable ${base}`,
    `${base} for beginners`,
    `${base} guide`,
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Animated number counter tied to viewport entry
function AnimatedCounter({ target, suffix = "", display }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const steps = 60;
    const inc = target / steps;
    let cur = 0;
    const id = setInterval(() => {
      cur += inc;
      if (cur >= target) { setCount(target); clearInterval(id); }
      else setCount(Math.floor(cur));
    }, 1800 / steps);
    return () => clearInterval(id);
  }, [inView, target]);

  return <span ref={ref}>{display || `${count}${suffix}`}</span>;
}

// Copy to clipboard button
function CopyButton({ text, small = false }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <motion.button
      onClick={handle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-1.5 font-medium rounded-lg border transition-all ${
        copied
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10"
      } ${small ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs"}`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </motion.button>
  );
}

// SEO difficulty progress bar
function DifficultyMeter({ keyword }) {
  const d = getDifficulty(keyword);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Keyword Difficulty</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${d.badge}`}>{d.label}</span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${d.score}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className={`h-full rounded-full ${d.bar}`}
        />
      </div>
      <p className="text-[10px] text-gray-600">{d.score}/100 · longer keywords = lower difficulty</p>
    </div>
  );
}

// Google SERP simulation card
function SERPPreview({ title, meta, keyword }) {
  if (!title) return null;
  const safeTitle = title.length > 60 ? title.slice(0, 57) + "…" : title;
  const safeMeta  = meta
    ? (meta.length > 155 ? meta.slice(0, 152) + "…" : meta)
    : `Find comprehensive information about ${keyword}. Discover expert tips and insights to help you get started today.`;
  const slug = (keyword || "article").toLowerCase().replace(/\s+/g, "-");

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-blue-500/10"><Eye size={13} className="text-blue-400" /></div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">SERP Preview</span>
        </div>
        <span className="text-xs text-gray-600">How it looks on Google</span>
      </div>

      <div className="p-4">
        {/* Google-style result card */}
        <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] p-4 space-y-1.5">
          {/* favicon + url */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
              <Globe size={9} className="text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-300 leading-none">yourdomain.com</p>
              <p className="text-[10px] text-gray-600">yourdomain.com › blog › {slug}</p>
            </div>
          </div>
          {/* blue title link */}
          <p className="text-[#60a5fa] text-[15px] font-medium leading-snug hover:underline cursor-pointer">
            {safeTitle}
          </p>
          {/* description */}
          <p className="text-sm text-gray-400 leading-relaxed">{safeMeta}</p>
        </div>

        {/* char health bars */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[
            { label: "Title", current: title.length, max: 60, okColor: "bg-emerald-500", warnColor: "bg-red-500" },
            { label: "Meta",  current: (meta || "").length, max: 160, okColor: "bg-emerald-500", warnColor: "bg-orange-500" },
          ].map((bar) => {
            const pct  = Math.min((bar.current / bar.max) * 100, 100);
            const ok   = bar.current <= bar.max;
            return (
              <div key={bar.label} className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">{bar.label} length</span>
                  <span className={ok ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
                    {bar.current}/{bar.max} {ok ? "✓" : "↑"}
                  </span>
                </div>
                <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full rounded-full ${ok ? bar.okColor : bar.warnColor}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// Interactive SEO checklist
function SEOChecklist({ titles, metas }) {
  const [manual, setManual] = useState({});
  const toggle = (id) => setManual((p) => ({ ...p, [id]: !p[id] }));

  const items = [
    { id: "kw-in-title",  label: "Primary keyword in title",       auto: titles.length > 0 },
    { id: "title-len",    label: "Title is under 60 characters",   auto: titles.some((t) => t.length <= 60) },
    { id: "meta-gen",     label: "Meta description generated",     auto: metas.length > 0  },
    { id: "numbers",      label: "Title includes a number",        auto: titles.some((t) => /\d/.test(t)) },
    { id: "cta",          label: "Meta contains a call-to-action", auto: false },
    { id: "unique",       label: "Title is unique and specific",   auto: false },
  ];

  const doneCount = items.filter((i) => i.auto || manual[i.id]).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-emerald-500/10">
            <CheckCircle2 size={13} className="text-emerald-400" />
          </div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">SEO Checklist</span>
        </div>
        <span className="text-xs font-bold text-emerald-400">{doneCount}/{items.length}</span>
      </div>

      {/* Score bar */}
      <div className="px-4 pt-3">
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${(doneCount / items.length) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full bg-emerald-500"
          />
        </div>
      </div>

      <div className="p-4 space-y-1.5">
        {items.map((item) => {
          const done = item.auto || manual[item.id];
          return (
            <div
              key={item.id}
              onClick={() => !item.auto && toggle(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer select-none ${
                done ? "bg-emerald-500/[0.05]" : "hover:bg-white/[0.03]"
              }`}
            >
              <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${
                done ? "bg-emerald-500 border-emerald-500" : "border-white/20"
              }`}>
                {done && <Check size={9} className="text-white" />}
              </div>
              <span className={`text-xs leading-snug ${done ? "text-gray-300" : "text-gray-500"}`}>{item.label}</span>
              {item.auto && done && (
                <span className="ml-auto text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">AUTO</span>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SEOTool() {
  // ── State: existing (not changed) ──────────────────────────────────────────
  const [keyword,      setKeyword]      = useState("");
  const [audience,     setAudience]     = useState("");
  const [tone,         setTone]         = useState("Professional");
  const [generateMeta, setGenerateMeta] = useState(true);
  const [titles,       setTitles]       = useState([]);
  const [metas,        setMetas]        = useState([]);
  const [rawTitle,     setRawTitle]     = useState("");
  const [rawMeta,      setRawMeta]      = useState("");
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [loadingMeta,  setLoadingMeta]  = useState(false);
  const [error,        setError]        = useState("");
  const [hasResult,    setHasResult]    = useState(false);

  // ── State: new UI-only ─────────────────────────────────────────────────────
  const [searchIntent,      setSearchIntent]      = useState("informational");
  const [showSmartOptions,  setShowSmartOptions]  = useState(false);
  const [selectedTemplate,  setSelectedTemplate]  = useState(null);
  const [showSuggestions,   setShowSuggestions]   = useState(false);

  const isLoading          = loadingTitle || loadingMeta;
  const diff               = getDifficulty(keyword);
  const opportunityScore   = getOpportunityScore(keyword);
  const keywordSuggestions = getKeywordSuggestions(keyword);

  const handleTemplateSelect = (tmpl) => {
    setSelectedTemplate(tmpl.id);
    setKeyword(tmpl.keyword);
    setShowSuggestions(false);
  };

  // ── Core API logic (preserved exactly) ─────────────────────────────────────
  const handleGenerate = async () => {
    if (!keyword.trim()) { setError("Please enter a keyword."); return; }
    setError("");
    setTitles([]);
    setMetas([]);
    setHasResult(false);

    setLoadingTitle(true);
    try {
      const res = await API.post("/marketing/seo-title", {
        keyword: keyword.trim(),
        tone,
        targetAudience: audience.trim() || undefined,
      });
      const d = res.data?.data;
      const raw = (d && typeof d === "object" ? d.result : d) || res.data?.result || res.data?.title || "";
      setRawTitle(raw);
      setTitles(parseNumberedList(raw));
      setHasResult(true);
    } catch (err) {
      setError(err.message || "Failed to generate SEO titles. Please try again.");
    } finally {
      setLoadingTitle(false);
    }

    if (generateMeta) {
      setLoadingMeta(true);
      try {
        const res = await API.post("/marketing/seo-title", {
          keyword: keyword.trim(),
          tone,
          targetAudience: audience.trim() || undefined,
          type: "meta_description",
        });
        const dm = res.data?.data;
        const raw = (dm && typeof dm === "object" ? dm.result : dm) || res.data?.result || "";
        setRawMeta(raw);
        setMetas(parseNumberedList(raw));
      } catch {
        // meta descriptions are additive — fail silently
      } finally {
        setLoadingMeta(false);
      }
    }
  };

  const handleExportAll = () => {
    const lines = [];
    if (keyword) lines.push(`Keyword: ${keyword}\n`);
    if (titles.length) {
      lines.push("=== SEO TITLE SUGGESTIONS ===");
      titles.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
    }
    if (metas.length) {
      lines.push("\n=== META DESCRIPTIONS ===");
      metas.forEach((m, i) => lines.push(`${i + 1}. ${m}`));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seo-${keyword.trim().replace(/\s+/g, "-").slice(0, 40)}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden">

      {/* ── Ambient background glows ───────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[700px] h-[500px] bg-cyan-500/[0.055] rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] bg-violet-500/[0.05] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-20 w-[400px] h-[400px] bg-blue-500/[0.04] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">

        {/* ══════════════════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════════════════ */}
        <section className="relative px-6 lg:px-10 pt-8 pb-10 border-b border-white/[0.06] overflow-hidden">

          {/* Floating decorative chips */}
          <motion.div
            animate={{ y: [-10, 8, -10], rotate: [0, 4, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-8 right-12 hidden lg:flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 backdrop-blur-xl"
          >
            <Search size={20} className="text-cyan-400" />
          </motion.div>

          <motion.div
            animate={{ y: [6, -10, 6], rotate: [0, -5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            className="absolute top-20 right-40 hidden lg:flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 backdrop-blur-xl"
          >
            <Sparkles size={14} className="text-violet-400" />
          </motion.div>

          <motion.div
            animate={{ y: [-6, 10, -6] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-6 right-64 hidden xl:flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 backdrop-blur-xl"
          >
            <Award size={13} className="text-emerald-400" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-3xl"
          >
            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full border bg-cyan-500/10 border-cyan-500/25 text-cyan-400 text-xs font-semibold"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <Brain size={12} />
              AI SEO Engine · Claude Sonnet
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.13 }}
              className="text-[2rem] lg:text-[2.6rem] font-extrabold leading-[1.15] tracking-tight mb-4"
            >
              Dominate Search Rankings{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                with AI-Powered
              </span>
              <br />SEO Content
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="text-gray-400 text-base leading-relaxed mb-7 max-w-xl"
            >
              Generate titles and meta descriptions that rank on page 1 — backed by
              data-driven prompts and Claude AI. Trusted by 10,000+ marketers worldwide.
            </motion.p>

            {/* Hero stat row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="flex flex-wrap gap-x-8 gap-y-3"
            >
              {[
                { icon: BarChart3,     value: "2.4M+", label: "Titles Generated",  color: "text-cyan-400"    },
                { icon: Star,          value: "98%",   label: "Satisfaction Rate", color: "text-violet-400"  },
                { icon: Globe,         value: "47",    label: "Languages",         color: "text-blue-400"    },
                { icon: Award,         value: "#1",    label: "Ranked Results",    color: "text-emerald-400" },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.26 + i * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <s.icon size={13} className={s.color} />
                  <span className="font-bold text-white text-sm">{s.value}</span>
                  <span className="text-gray-500 text-xs">{s.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            KPI CARDS
        ══════════════════════════════════════════════════════════════════ */}
        <section className="px-6 lg:px-10 py-6 border-b border-white/[0.06]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {KPI_STATS.map((stat, i) => {
              const Icon = stat.icon;
              const bars = [3, 5, 4, 7, 5, 8, 7, 9, 8, 10];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -3, transition: { duration: 0.18 } }}
                  className={`relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl p-5 group`}
                >
                  {/* hover glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-xl ${stat.iconBg} border border-white/[0.06]`}>
                        <Icon size={15} className={stat.iconColor} />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.badge}`}>
                        {stat.growth}
                      </span>
                    </div>

                    <p className="text-2xl font-extrabold text-white mb-0.5">
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} display={stat.display} />
                    </p>
                    <p className="text-xs text-gray-500">{stat.label}</p>

                    {/* sparkline */}
                    <div className="flex items-end gap-0.5 mt-3 h-7">
                      {bars.map((h, j) => (
                        <motion.div
                          key={j}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: 0.5 + j * 0.035, duration: 0.3 }}
                          style={{ height: `${h * 8}%`, originY: 1 }}
                          className={`flex-1 rounded-sm ${stat.trendColor} opacity-30 group-hover:opacity-50 transition-opacity`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            MAIN CONTENT  (2-col + sidebar)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="px-6 lg:px-10 py-7">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* ── Left + Center column ──────────────────────────────────── */}
            <div className="xl:col-span-2 space-y-5">

              {/* ── Template Library ── */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-violet-400" />
                    <span className="text-sm font-semibold text-gray-200">Popular Templates</span>
                  </div>
                  <span className="text-xs text-gray-600">Click to auto-fill keyword</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TEMPLATES.map((tmpl, i) => {
                    const Icon = tmpl.icon;
                    const active = selectedTemplate === tmpl.id;
                    return (
                      <motion.button
                        key={tmpl.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.27 + i * 0.04 }}
                        onClick={() => handleTemplateSelect(tmpl)}
                        whileHover={{ y: -2, transition: { duration: 0.14 } }}
                        className={`relative text-left p-3.5 rounded-xl border transition-all ${
                          active
                            ? "border-cyan-500/35 bg-cyan-500/10"
                            : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.045] hover:border-white/[0.12]"
                        }`}
                      >
                        {tmpl.tag && (
                          <span className="absolute top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20">
                            {tmpl.tag}
                          </span>
                        )}
                        <div className={`w-fit p-1.5 rounded-lg mb-2.5 ${active ? "bg-cyan-500/20" : "bg-white/[0.04]"}`}>
                          <Icon size={13} className={active ? "text-cyan-400" : "text-gray-400"} />
                        </div>
                        <p className="text-xs font-semibold text-gray-200 leading-tight">{tmpl.label}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{tmpl.desc}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* ── Configuration Card ── */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <Search size={14} className="text-cyan-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-200">SEO Configuration</span>
                  </div>
                  {keyword && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className={`font-semibold ${diff.text}`}>{diff.label}</span>
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-5">

                  {/* Search Intent */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-3">
                      Search Intent
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SEARCH_INTENTS.map((intent) => {
                        const Icon = intent.icon;
                        const isActive = searchIntent === intent.id;
                        return (
                          <button
                            key={intent.id}
                            onClick={() => setSearchIntent(intent.id)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isActive
                                ? intent.active
                                : "border-white/[0.07] bg-white/[0.02] text-gray-500 hover:bg-white/[0.04] hover:text-gray-300"
                            }`}
                          >
                            <Icon size={13} className="mb-1.5" />
                            <p className="text-[11px] font-semibold">{intent.label}</p>
                            <p className="text-[9px] opacity-70 mt-0.5 leading-tight">{intent.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Keyword input */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">
                      Primary Keyword <span className="text-red-400 normal-case font-normal">*</span>
                    </label>
                    <div className="relative">
                      <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => { setKeyword(e.target.value); setSelectedTemplate(null); }}
                        onKeyDown={(e) => e.key === "Enter" && !isLoading && handleGenerate()}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                        placeholder="e.g. best CRM software for startups"
                        className="w-full pl-10 pr-28 py-3.5 bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 rounded-xl text-sm outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/[0.08] transition-all"
                      />
                      {keyword && (
                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${diff.badge}`}>
                          {diff.label}
                        </span>
                      )}
                    </div>

                    {/* Suggestions dropdown */}
                    <AnimatePresence>
                      {showSuggestions && keyword.trim().length > 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="mt-2 rounded-xl border border-white/[0.08] bg-[#0c1220] shadow-2xl overflow-hidden"
                        >
                          <p className="px-3 py-2 text-[9px] font-extrabold text-gray-600 uppercase tracking-widest border-b border-white/[0.05]">
                            Keyword Suggestions
                          </p>
                          {keywordSuggestions.map((s, i) => (
                            <button
                              key={i}
                              onMouseDown={() => { setKeyword(s); setShowSuggestions(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-400 hover:bg-white/[0.04] hover:text-white transition-colors text-left"
                            >
                              <Hash size={10} className="text-gray-700 flex-shrink-0" />
                              {s}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Inline difficulty + opportunity display */}
                  <AnimatePresence>
                    {keyword.trim() && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                          <DifficultyMeter keyword={keyword} />
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Opportunity Score</span>
                              <span className="text-xs font-bold text-emerald-400">{opportunityScore}/100</span>
                            </div>
                            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${opportunityScore}%` }}
                                transition={{ duration: 0.85, ease: "easeOut" }}
                                className="h-full rounded-full bg-emerald-500"
                              />
                            </div>
                            <p className="text-[10px] text-gray-600">
                              {opportunityScore >= 70 ? "High opportunity keyword ✓" : "Consider a more specific keyword"}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tone + Audience row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Tone</label>
                      <div className="relative">
                        <select
                          value={tone}
                          onChange={(e) => setTone(e.target.value)}
                          className="w-full appearance-none px-4 py-3 bg-white/[0.04] border border-white/[0.08] text-white rounded-xl text-sm outline-none focus:border-cyan-500/50 transition-all pr-9"
                        >
                          {TONES.map((t) => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">
                        Target Audience{" "}
                        <span className="font-normal normal-case text-gray-700">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        placeholder="e.g. startup founders, SMB owners"
                        className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 rounded-xl text-sm outline-none focus:border-cyan-500/50 transition-all"
                      />
                    </div>
                  </div>

                  {/* Smart Options (collapsible) */}
                  <div>
                    <button
                      onClick={() => setShowSmartOptions(!showSmartOptions)}
                      className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors group"
                    >
                      <ChevronRight
                        size={13}
                        className={`transition-transform ${showSmartOptions ? "rotate-90" : ""}`}
                      />
                      <Zap size={12} className="text-violet-400" />
                      <span>Smart Options</span>
                      <span className="text-gray-700">· Brand Voice, CTA, Content Goal</span>
                    </button>
                    <AnimatePresence>
                      {showSmartOptions && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                            {[
                              { label: "Brand Voice",   placeholder: "e.g. Bold, Innovative",  icon: Megaphone     },
                              { label: "Content Goal",  placeholder: "e.g. Drive signups",      icon: Target        },
                              { label: "Call To Action",placeholder: "e.g. Get started free",   icon: MousePointer2 },
                            ].map((opt) => (
                              <div key={opt.label}>
                                <label className="flex items-center gap-1.5 text-[9px] font-extrabold text-gray-600 uppercase tracking-widest mb-1.5">
                                  <opt.icon size={9} className="text-violet-400" />
                                  {opt.label}
                                </label>
                                <input
                                  type="text"
                                  placeholder={opt.placeholder}
                                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] text-white placeholder-gray-700 rounded-lg text-xs outline-none focus:border-violet-500/40 transition-all"
                                />
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Meta toggle */}
                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <button
                      onClick={() => setGenerateMeta(!generateMeta)}
                      className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors ${
                        generateMeta ? "bg-cyan-500" : "bg-white/10"
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                        generateMeta ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                    <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">
                      Generate Meta Descriptions
                    </span>
                    <span className="text-xs text-gray-600">3 variations · 150–160 chars</span>
                  </label>
                </div>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
                  >
                    <AlertCircle size={15} className="flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generate button */}
              <motion.button
                onClick={handleGenerate}
                disabled={isLoading || !keyword.trim()}
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="relative w-full py-4 rounded-xl font-bold text-sm overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
                <div className="relative flex items-center justify-center gap-2 text-white">
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" />Generating SEO Content with AI...</>
                  ) : (
                    <><Sparkles size={16} />Generate SEO Content<ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </div>
              </motion.button>

              {/* Loading skeleton */}
              <AnimatePresence>
                {isLoading && titles.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
                        <div className="h-2.5 w-32 bg-white/[0.05] rounded-full animate-pulse" />
                        {[0.92, 0.74, 0.84].map((w, j) => (
                          <div key={j} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-white/[0.04] animate-pulse flex-shrink-0" />
                            <div className="h-10 rounded-xl bg-white/[0.04] animate-pulse" style={{ width: `${w * 100}%` }} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── OUTPUT SECTION ──────────────────────────────────────── */}
              <AnimatePresence>
                {hasResult && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

                    {/* Output header bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm font-semibold text-gray-200">AI Generated Results</span>
                        <span className="text-xs text-gray-600">·&nbsp;
                          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleGenerate}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-gray-400 hover:text-white transition-all"
                        >
                          <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                          Regenerate
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleExportAll}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 hover:text-cyan-300 transition-all"
                        >
                          <LayoutList size={12} />
                          Export
                        </motion.button>
                        <CopyButton text={[rawTitle, rawMeta].filter(Boolean).join("\n\n---\n\n")} />
                      </div>
                    </div>

                    {/* SERP Preview */}
                    {titles.length > 0 && (
                      <SERPPreview title={titles[0]} meta={metas[0] || ""} keyword={keyword} />
                    )}

                    {/* SEO Titles card */}
                    {titles.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-lg bg-cyan-500/10"><LayoutList size={13} className="text-cyan-400" /></div>
                            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">SEO Title Suggestions</span>
                            <span className="text-xs text-gray-600">({titles.length} options)</span>
                          </div>
                          <CopyButton text={rawTitle} small />
                        </div>

                        <div className="p-4 space-y-2.5">
                          {titles.map((title, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -14 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.07 }}
                              className="group flex items-start justify-between gap-3 p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.055] border border-white/[0.05] hover:border-cyan-500/20 transition-all"
                            >
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-white/[0.05] border border-white/[0.1] text-gray-500 text-[9px] font-extrabold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-gray-200 leading-relaxed">{title}</p>
                                  <div className="flex items-center flex-wrap gap-2.5 mt-1.5">
                                    <span className={`text-[10px] font-semibold ${title.length <= 60 ? "text-emerald-400" : "text-orange-400"}`}>
                                      {title.length} chars {title.length <= 60 ? "✓" : "⚠ too long"}
                                    </span>
                                    {/\d/.test(title) && <span className="text-[10px] text-cyan-400">Has numbers ✓</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                                <CopyButton text={title} small />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Meta Descriptions card */}
                    {metas.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                        className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-lg bg-violet-500/10"><FileText size={13} className="text-violet-400" /></div>
                            <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Meta Descriptions</span>
                            <span className="text-xs text-gray-600">({metas.length} variations)</span>
                          </div>
                          <CopyButton text={rawMeta} small />
                        </div>

                        <div className="p-4 space-y-2.5">
                          {metas.map((meta, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -14 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.07 }}
                              className="group flex items-start justify-between gap-3 p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.055] border border-white/[0.05] hover:border-violet-500/20 transition-all"
                            >
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-white/[0.05] border border-white/[0.1] text-gray-500 text-[9px] font-extrabold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-gray-300 leading-relaxed">{meta}</p>
                                  <span className={`text-[10px] font-semibold mt-1.5 block ${meta.length <= 160 ? "text-emerald-400" : "text-orange-400"}`}>
                                    {meta.length} chars {meta.length <= 160 ? "✓" : "⚠ too long"}
                                  </span>
                                </div>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                                <CopyButton text={meta} small />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* SEO Checklist */}
                    <SEOChecklist titles={titles} metas={metas} />

                    {/* Pro tip */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                    >
                      <Tag size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Keep titles under{" "}
                        <span className="text-gray-300 font-semibold">60 characters</span> and meta descriptions under{" "}
                        <span className="text-gray-300 font-semibold">160 characters</span> to avoid truncation in Google search results.
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Sticky right sidebar ──────────────────────────────────── */}
            <div className="space-y-4 xl:sticky xl:top-5 xl:self-start">

              {/* AI Tips */}
              <motion.div
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                  <div className="p-1 rounded-lg bg-amber-500/10">
                    <Lightbulb size={13} className="text-amber-400" />
                  </div>
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">SEO Tips</span>
                </div>
                <div className="p-4 space-y-3">
                  {AI_TIPS.map((tip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.06 }}
                      className="flex items-start gap-2.5"
                    >
                      <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-400 leading-relaxed">{tip}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Recommended Prompts */}
              <motion.div
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.42 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                  <div className="p-1 rounded-lg bg-violet-500/10">
                    <Sparkles size={13} className="text-violet-400" />
                  </div>
                  <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Try These</span>
                </div>
                <div className="p-3 space-y-1">
                  {RECOMMENDED_PROMPTS.map((prompt, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.46 + i * 0.05 }}
                      onClick={() => setKeyword(prompt)}
                      whileHover={{ x: 3 }}
                      className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-white/[0.04] text-left group transition-all"
                    >
                      <Hash size={10} className="text-gray-700 flex-shrink-0 group-hover:text-violet-400 transition-colors" />
                      <span className="text-xs text-gray-500 group-hover:text-gray-200 transition-colors leading-snug">{prompt}</span>
                      <ChevronRight size={10} className="ml-auto text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Character guide */}
              <motion.div
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.48 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                  <div className="p-1 rounded-lg bg-blue-500/10">
                    <BarChart2 size={13} className="text-blue-400" />
                  </div>
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Char Guide</span>
                </div>
                <div className="p-4 space-y-3.5">
                  {[
                    { label: "Title Tag",        ideal: "50–60",   fill: 0.82, color: "bg-cyan-500"   },
                    { label: "Meta Description", ideal: "150–160", fill: 0.78, color: "bg-violet-500" },
                    { label: "H1 Heading",       ideal: "20–70",   fill: 0.55, color: "bg-blue-500"   },
                  ].map((r) => (
                    <div key={r.label} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{r.label}</span>
                        <span className="text-[10px] font-semibold text-gray-300">{r.ideal} chars</span>
                      </div>
                      <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${r.color} opacity-50`} style={{ width: `${r.fill * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* AI status */}
              <motion.div
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.53 }}
                className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] backdrop-blur-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-400">Claude AI · Online</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Model:{" "}
                  <span className="text-gray-300 font-medium">claude-sonnet-4-6</span>
                  <br />Optimised for SEO accuracy and high-CTR copy.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
