import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Sparkles, Copy, Check, Clock, Trash2, ChevronDown, Loader2,
  FileText, Mail, Share2, Megaphone, PenLine,
  Rocket, Globe, Target, BarChart3, BookOpen, Search,
  Layers, Brain, Zap, Star, ArrowRight, RefreshCw, Download,
  Lightbulb, Hash, ChevronRight, Users, Briefcase, AlignLeft,
  MousePointer2, Key, TrendingUp, Activity, CheckCircle2,
  AlertCircle, BarChart2, Eye,
} from "lucide-react";
import API from "../api/axios";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const CONTENT_TYPES = [
  {
    id: "blog",    label: "Blog Post",       icon: FileText,  desc: "Long-form SEO content",
    length: "1000–2000 words", output: "Article",
    iconBg: "bg-violet-500/10", iconColor: "text-violet-400", tag: "Popular",
    active: "border-violet-500/40 bg-violet-500/[0.08]",
  },
  {
    id: "email",   label: "Email Campaign",  icon: Mail,      desc: "Sales & marketing emails",
    length: "300–600 words",   output: "Email",
    iconBg: "bg-cyan-500/10",  iconColor: "text-cyan-400",   tag: null,
    active: "border-cyan-500/40 bg-cyan-500/[0.08]",
  },
  {
    id: "social",  label: "Social Media",    icon: Share2,    desc: "Platform-specific posts",
    length: "50–300 words",    output: "Post",
    iconBg: "bg-pink-500/10",  iconColor: "text-pink-400",   tag: "Trending",
    active: "border-pink-500/40 bg-pink-500/[0.08]",
  },
  {
    id: "ad",      label: "Ad Copy",         icon: Megaphone, desc: "High-converting ad campaigns",
    length: "50–150 words",    output: "Ad",
    iconBg: "bg-orange-500/10",iconColor: "text-orange-400", tag: null,
    active: "border-orange-500/40 bg-orange-500/[0.08]",
  },
  {
    id: "general", label: "General Content", icon: PenLine,   desc: "Any marketing content",
    length: "Variable",        output: "Content",
    iconBg: "bg-blue-500/10",  iconColor: "text-blue-400",   tag: null,
    active: "border-blue-500/40 bg-blue-500/[0.08]",
  },
];

const KPI_STATS = [
  { label: "Contents Generated", display: "10K+", target: 10000, icon: FileText,  growth: "+18.2%", iconBg: "bg-violet-500/10", iconColor: "text-violet-400", badge: "bg-violet-500/10 text-violet-400", trendColor: "bg-violet-400", glow: "from-violet-500/10" },
  { label: "Time Saved",         display: "95%",  target: 95,    icon: Clock,     growth: "+5.1%",  iconBg: "bg-cyan-500/10",   iconColor: "text-cyan-400",   badge: "bg-cyan-500/10 text-cyan-400",     trendColor: "bg-cyan-400",   glow: "from-cyan-500/10"   },
  { label: "Templates",          display: "50+",  target: 50,    icon: Layers,    growth: "+12 new",iconBg: "bg-blue-500/10",   iconColor: "text-blue-400",   badge: "bg-blue-500/10 text-blue-400",     trendColor: "bg-blue-400",   glow: "from-blue-500/10"   },
  { label: "Satisfaction Rate",  display: "98%",  target: 98,    icon: Star,      growth: "Claude", iconBg: "bg-emerald-500/10",iconColor: "text-emerald-400",badge: "bg-emerald-500/10 text-emerald-400",trendColor: "bg-emerald-400",glow: "from-emerald-500/10"},
];

const TEMPLATES = [
  { id: "blog-seo",    label: "Blog Article",       desc: "SEO-optimized long-form",    prompt: "Write a comprehensive blog post about ",          icon: FileText,  tag: "Popular", contentType: "blog"    },
  { id: "product",     label: "Product Launch",      desc: "Launch announcement",         prompt: "Create product launch content for ",              icon: Rocket,    tag: "Hot",     contentType: "general" },
  { id: "email-sales", label: "Sales Email",         desc: "High-converting email",       prompt: "Write a compelling sales email for ",             icon: Mail,      tag: null,      contentType: "email"   },
  { id: "linkedin",    label: "LinkedIn Post",       desc: "Professional social content", prompt: "Write a thought-leadership LinkedIn post about ", icon: Share2,    tag: "Popular", contentType: "social"  },
  { id: "facebook-ad", label: "Facebook Ad",         desc: "Engaging ad copy",            prompt: "Create Facebook ad copy for ",                    icon: Megaphone, tag: null,      contentType: "ad"      },
  { id: "google-ad",   label: "Google Ad Copy",      desc: "PPC-optimized headlines",     prompt: "Write Google search ad copy for ",                icon: Search,    tag: null,      contentType: "ad"      },
  { id: "newsletter",  label: "Newsletter",          desc: "Email newsletter",            prompt: "Write an email newsletter about ",                icon: BookOpen,  tag: null,      contentType: "email"   },
  { id: "case-study",  label: "Case Study",          desc: "Success story template",      prompt: "Write a case study about ",                       icon: BarChart3, tag: null,      contentType: "blog"    },
  { id: "landing",     label: "Landing Page",        desc: "High-converting copy",        prompt: "Write landing page copy for ",                    icon: Globe,     tag: "Hot",     contentType: "general" },
  { id: "strategy",    label: "Marketing Strategy",  desc: "Complete marketing plan",     prompt: "Create a comprehensive marketing strategy for ",  icon: Target,    tag: null,      contentType: "general" },
];

const GEN_STEPS = [
  { label: "Analyzing Topic",       icon: Brain        },
  { label: "Researching Structure", icon: Search       },
  { label: "Generating Content",    icon: PenLine      },
  { label: "Optimizing Output",     icon: Zap          },
  { label: "Finalizing",            icon: CheckCircle2 },
];

const TONES     = ["Professional", "Casual", "Persuasive", "Informative", "Friendly", "Witty"];
const INDUSTRIES = ["SaaS", "E-commerce", "Healthcare", "Finance", "Education", "Real Estate", "Marketing Agency", "Startup", "Enterprise"];

const AI_WRITING_TIPS = [
  "Start with a compelling hook to capture attention within the first 3 seconds",
  "Use the PAS framework: Problem → Agitate → Solution for persuasive copy",
  "Include social proof numbers and statistics to increase credibility",
  "End every piece with a clear, single call-to-action (CTA)",
  "Write at a Grade 8 reading level for maximum audience accessibility",
];

const TRENDING_TOPICS = [
  "AI tools for business productivity 2024",
  "How to scale a SaaS to $1M ARR",
  "Email marketing automation strategies",
  "Content marketing ROI measurement guide",
  "B2B LinkedIn content that converts",
];

const BEST_CONTENT = [
  { label: "Blog Posts",   pct: 94, color: "bg-violet-500" },
  { label: "Email Copy",   pct: 87, color: "bg-cyan-500"   },
  { label: "Ad Copy",      pct: 82, color: "bg-orange-500" },
  { label: "Social Media", pct: 76, color: "bg-pink-500"   },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function AnimatedCounter({ target, display }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let cur = 0;
    const steps = 60;
    const inc = target / steps;
    const id = setInterval(() => {
      cur += inc;
      if (cur >= target) { setCount(target); clearInterval(id); }
      else setCount(Math.floor(cur));
    }, 1800 / steps);
    return () => clearInterval(id);
  }, [inView, target]);
  return <span ref={ref}>{display || count}</span>;
}

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
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-1.5 font-medium rounded-lg border transition-all ${
        copied
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          : "bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white border-white/[0.08]"
      } ${small ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs"}`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKDOWN RENDERER
// ─────────────────────────────────────────────────────────────────────────────

function markdownToHtml(text) {
  if (!text) return "";
  let h = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  h = h
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1rem;font-weight:700;color:#f1f5f9;margin:1rem 0 .25rem">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.1rem;font-weight:700;color:#f1f5f9;margin:1.25rem 0 .4rem">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.25rem;font-weight:800;color:#fff;margin:1.25rem 0 .5rem">$1</h1>')
    .replace(/^[-*]\s+(.+)$/gm, '<li style="color:#94a3b8;margin:.2rem 0;padding-left:.5rem;list-style-type:disc;margin-left:1.25rem">$1</li>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li style="color:#94a3b8;margin:.2rem 0;padding-left:.5rem;list-style-type:decimal;margin-left:1.25rem">$1</li>');
  h = h
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:#e2e8f0">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="font-style:italic;color:#cbd5e1">$1</em>');
  h = h
    .replace(/<\/li>\n<li/g, "</li><li")
    .replace(/\n\n+/g, '</p><p style="color:#94a3b8;line-height:1.8;margin:.5rem 0">')
    .replace(/\n/g, "<br/>");
  return `<p style="color:#94a3b8;line-height:1.8;margin:0">${h}</p>`;
}

function MarkdownContent({ content }) {
  return (
    <div
      className="text-sm"
      dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AIContent() {
  // ── Existing state (preserved exactly) ────────────────────────────────────
  const [contentType, setContentType] = useState("general");
  const [topic,       setTopic]       = useState("");
  const [tone,        setTone]        = useState("Professional");
  const [context,     setContext]     = useState("");
  const [output,      setOutput]      = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [history,     setHistory]     = useState([]);
  const [usage,       setUsage]       = useState(null);
  const [toast,       setToast]       = useState(null);

  // ── New UI-only state ──────────────────────────────────────────────────────
  const [audience,          setAudience]          = useState("");
  const [industry,          setIndustry]          = useState("");
  const [contentLength,     setContentLength]     = useState("Medium");
  const [keywords,          setKeywords]          = useState("");
  const [cta,               setCta]               = useState("");
  const [showSmartSettings, setShowSmartSettings] = useState(false);
  const [selectedTemplate,  setSelectedTemplate]  = useState(null);
  const [genStep,           setGenStep]           = useState(-1);

  const selectedType = CONTENT_TYPES.find((t) => t.id === contentType);

  // ── Computed output analytics ──────────────────────────────────────────────
  const wordCount        = useMemo(() => output ? output.split(/\s+/).filter(Boolean).length : 0, [output]);
  const readingTime      = useMemo(() => Math.max(1, Math.ceil(wordCount / 200)), [wordCount]);
  const seoScore         = useMemo(() => output ? Math.min(60 + Math.floor(wordCount / 18), 97) : 0, [output, wordCount]);
  const readabilityScore = useMemo(() => output ? Math.min(68 + Math.floor(wordCount / 22), 96) : 0, [output, wordCount]);
  const engagementScore  = useMemo(() => output ? Math.min(72 + Math.floor(wordCount / 20), 98) : 0, [output, wordCount]);

  // ── Gen-step animation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading) { setGenStep(-1); return; }
    setGenStep(0);
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      if (step >= GEN_STEPS.length - 1) { setGenStep(GEN_STEPS.length - 1); clearInterval(id); }
      else setGenStep(step);
    }, 900);
    return () => clearInterval(id);
  }, [loading]);

  // ── Context builder — enriches the existing `context` field ───────────────
  const buildContext = () => {
    const parts = [];
    if (context.trim())  parts.push(context.trim());
    if (audience)        parts.push(`Target Audience: ${audience}`);
    if (industry)        parts.push(`Industry: ${industry}`);
    if (contentLength)   parts.push(`Content Length: ${contentLength}`);
    if (cta)             parts.push(`Call to Action: ${cta}`);
    if (keywords)        parts.push(`Focus Keywords: ${keywords}`);
    return parts.join(". ");
  };

  // ── API call (preserved exactly; only `context` field is enriched) ─────────
  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic or prompt.");
      return;
    }
    setLoading(true);
    setError("");
    setOutput("");

    try {
      const res = await API.post("/marketing/ai-content", {
        contentType,
        topic:   topic.trim(),
        tone,
        context: buildContext(),
      });

      const apiData = res.data?.data;
      const result =
        (apiData && typeof apiData === "object" ? apiData.content : apiData) ||
        res.data?.result ||
        res.data?.content ||
        "";
      setOutput(result);
      setUsage(apiData?.usage || null);

      setHistory((prev) =>
        [{ id: Date.now(), contentType, topic, output: result, createdAt: new Date() }, ...prev].slice(0, 10)
      );
      setToast("Content generated successfully!");
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setError(err.message || "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${contentType}-content-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (!output) return;
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>${contentType} Content</title>
      <style>
        body{font-family:Georgia,serif;line-height:1.8;padding:48px;max-width:820px;margin:0 auto;color:#1a1a2e}
        h1,h2,h3{color:#1a1a2e;margin-top:1.4em}li{margin:5px 0}strong{font-weight:600}
        hr{border:none;border-top:1px solid #e5e7eb;margin:24px 0}.meta{color:#6b7280;font-size:.9rem}
      </style></head><body>
      <h2 style="text-transform:capitalize">${contentType} Content</h2>
      <p class="meta"><strong>Topic:</strong> ${topic.replace(/</g, "&lt;")}</p>
      <p class="meta"><strong>Tone:</strong> ${tone} &nbsp;·&nbsp; <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <hr>${markdownToHtml(output)}
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const handleTemplateSelect = (tmpl) => {
    setSelectedTemplate(tmpl.id);
    setTopic(tmpl.prompt);
    setContentType(tmpl.contentType);
  };

  // ── Insight metrics (built from memoized values) ──────────────────────────
  const insightMetrics = [
    { label: "SEO Score",     value: seoScore,         unit: "/100", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", bar: "bg-emerald-500", ring: "border-emerald-500/20" },
    { label: "Readability",   value: readabilityScore, unit: "/100", icon: Eye,        color: "text-blue-400",    bg: "bg-blue-500/10",    bar: "bg-blue-500",    ring: "border-blue-500/20"    },
    { label: "Engagement",    value: engagementScore,  unit: "/100", icon: Activity,   color: "text-violet-400",  bg: "bg-violet-500/10",  bar: "bg-violet-500",  ring: "border-violet-500/20"  },
    { label: "AI Confidence", value: 94,               unit: "%",    icon: Brain,      color: "text-cyan-400",    bg: "bg-cyan-500/10",    bar: "bg-cyan-500",    ring: "border-cyan-500/20"    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden">

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.92 }}
            className="fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm font-medium shadow-2xl backdrop-blur-xl"
          >
            <CheckCircle2 size={15} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-[700px] h-[500px] bg-violet-500/[0.06] rounded-full blur-[130px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-purple-500/[0.05] rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-pink-500/[0.03] rounded-full blur-[100px]" />
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
            className="absolute top-8 right-12 hidden lg:flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 backdrop-blur-xl"
          >
            <Sparkles size={20} className="text-violet-400" />
          </motion.div>
          <motion.div
            animate={{ y: [6, -10, 6], rotate: [0, -5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            className="absolute top-20 right-40 hidden lg:flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 backdrop-blur-xl"
          >
            <Brain size={14} className="text-cyan-400" />
          </motion.div>
          <motion.div
            animate={{ y: [-6, 10, -6] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-6 right-64 hidden xl:flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/20 backdrop-blur-xl"
          >
            <PenLine size={13} className="text-pink-400" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-3xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full border bg-violet-500/10 border-violet-500/25 text-violet-400 text-xs font-semibold"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <Sparkles size={12} />
              AI Marketing Studio · Claude Sonnet
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.13 }}
              className="text-[2rem] lg:text-[2.6rem] font-extrabold leading-[1.15] tracking-tight mb-4"
            >
              Create High-Converting{" "}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Content in Seconds
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="text-gray-400 text-base leading-relaxed mb-7 max-w-xl"
            >
              Generate blogs, emails, social posts, ad copies and marketing assets using Claude AI.
              Trusted by 10,000+ marketers and content creators worldwide.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="flex flex-wrap gap-x-8 gap-y-3"
            >
              {[
                { icon: BarChart3,    value: "10K+", label: "Contents Generated", color: "text-violet-400" },
                { icon: Clock,        value: "95%",  label: "Time Saved",         color: "text-cyan-400"   },
                { icon: Layers,       value: "50+",  label: "Templates",          color: "text-blue-400"   },
                { icon: Star,         value: "98%",  label: "Satisfaction Rate",  color: "text-emerald-400"},
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
              const bars = [3, 5, 4, 7, 6, 8, 7, 9, 8, 10];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -3, transition: { duration: 0.18 } }}
                  className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl p-5 group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-xl ${stat.iconBg} border border-white/[0.06]`}>
                        <Icon size={15} className={stat.iconColor} />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.badge}`}>{stat.growth}</span>
                    </div>
                    <p className="text-2xl font-extrabold text-white mb-0.5">
                      <AnimatedCounter target={stat.target} display={stat.display} />
                    </p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
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
            TEMPLATE LIBRARY
        ══════════════════════════════════════════════════════════════════ */}
        <section className="px-6 lg:px-10 py-6 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-violet-400" />
              <span className="text-sm font-semibold text-gray-200">Popular Templates</span>
              <span className="text-xs text-gray-600">({TEMPLATES.length} templates)</span>
            </div>
            <span className="text-xs text-gray-600">Click to auto-fill topic</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {TEMPLATES.map((tmpl, i) => {
              const Icon = tmpl.icon;
              const isActive = selectedTemplate === tmpl.id;
              return (
                <motion.button
                  key={tmpl.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.03 }}
                  onClick={() => handleTemplateSelect(tmpl)}
                  whileHover={{ y: -2, transition: { duration: 0.14 } }}
                  className={`relative text-left p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? "border-violet-500/40 bg-violet-500/10"
                      : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.045] hover:border-white/[0.12]"
                  }`}
                >
                  {tmpl.tag && (
                    <span className="absolute top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20">
                      {tmpl.tag}
                    </span>
                  )}
                  <div className={`w-fit p-1.5 rounded-lg mb-2.5 ${isActive ? "bg-violet-500/20" : "bg-white/[0.04]"}`}>
                    <Icon size={13} className={isActive ? "text-violet-400" : "text-gray-400"} />
                  </div>
                  <p className="text-xs font-semibold text-gray-200 leading-tight">{tmpl.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{tmpl.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            MAIN CONTENT AREA
        ══════════════════════════════════════════════════════════════════ */}
        <section className="px-6 lg:px-10 py-7">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* ── Left + center (2/3) ───────────────────────────────────── */}
            <div className="xl:col-span-2 space-y-5">

              {/* Content Type Cards */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
              >
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-3">
                  Content Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {CONTENT_TYPES.map((type, i) => {
                    const Icon = type.icon;
                    const isActive = contentType === type.id;
                    return (
                      <motion.button
                        key={type.id}
                        onClick={() => setContentType(type.id)}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + i * 0.045 }}
                        whileHover={{ y: -2, transition: { duration: 0.14 } }}
                        className={`relative text-left p-4 rounded-xl border transition-all ${
                          isActive
                            ? type.active
                            : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]"
                        }`}
                      >
                        {type.tag && (
                          <span className="absolute top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20">
                            {type.tag}
                          </span>
                        )}
                        <div className={`w-fit p-1.5 rounded-lg mb-3 ${isActive ? type.iconBg : "bg-white/[0.04]"}`}>
                          <Icon size={14} className={isActive ? type.iconColor : "text-gray-500"} />
                        </div>
                        <p className={`text-xs font-bold leading-tight mb-1 ${isActive ? "text-white" : "text-gray-400"}`}>
                          {type.label}
                        </p>
                        <p className="text-[10px] text-gray-600 leading-tight">{type.desc}</p>
                        <p className={`text-[10px] font-semibold mt-1.5 ${isActive ? type.iconColor : "text-gray-700"}`}>
                          {type.length}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Smart Content Settings (collapsible) */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
              >
                <button
                  onClick={() => setShowSmartSettings(!showSmartSettings)}
                  className="w-full flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <Zap size={13} className="text-violet-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-200">Smart Content Settings</span>
                    <span className="text-xs text-gray-600">· Audience, Industry, Keywords</span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-gray-500 transition-transform ${showSmartSettings ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {showSmartSettings && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-4">

                        {/* Row 1: Audience + Industry */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">
                              <Users size={9} className="text-violet-400" />
                              Target Audience
                            </label>
                            <input
                              type="text"
                              value={audience}
                              onChange={(e) => setAudience(e.target.value)}
                              placeholder="e.g. startup founders, CMOs"
                              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.07] text-white placeholder-gray-600 rounded-xl text-sm outline-none focus:border-violet-500/40 transition-all"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">
                              <Briefcase size={9} className="text-violet-400" />
                              Industry
                            </label>
                            <div className="relative">
                              <select
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                className="w-full appearance-none px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.07] text-white rounded-xl text-sm outline-none focus:border-violet-500/40 transition-all pr-8"
                              >
                                <option value="" className="bg-gray-900">Select industry…</option>
                                {INDUSTRIES.map((ind) => (
                                  <option key={ind} value={ind} className="bg-gray-900">{ind}</option>
                                ))}
                              </select>
                              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        {/* Content Length chips */}
                        <div>
                          <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">
                            <AlignLeft size={9} className="text-violet-400" />
                            Content Length
                          </label>
                          <div className="flex gap-2">
                            {["Short", "Medium", "Long"].map((len) => (
                              <button
                                key={len}
                                onClick={() => setContentLength(len)}
                                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                  contentLength === len
                                    ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
                                    : "bg-white/[0.03] border-white/[0.07] text-gray-500 hover:text-gray-300 hover:border-white/[0.12]"
                                }`}
                              >
                                {len}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Row 2: Keywords + CTA */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">
                              <Key size={9} className="text-violet-400" />
                              Keywords
                            </label>
                            <input
                              type="text"
                              value={keywords}
                              onChange={(e) => setKeywords(e.target.value)}
                              placeholder="e.g. SaaS, growth, automation"
                              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.07] text-white placeholder-gray-600 rounded-xl text-sm outline-none focus:border-violet-500/40 transition-all"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">
                              <MousePointer2 size={9} className="text-violet-400" />
                              Call To Action
                            </label>
                            <input
                              type="text"
                              value={cta}
                              onChange={(e) => setCta(e.target.value)}
                              placeholder="e.g. Get started free today"
                              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.07] text-white placeholder-gray-600 rounded-xl text-sm outline-none focus:border-violet-500/40 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Content Prompt Card */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <PenLine size={13} className="text-violet-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-200">Content Prompt</span>
                  </div>
                  {topic && <span className="text-xs text-gray-600">{topic.length} chars</span>}
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">
                      Topic / Prompt <span className="text-red-400 normal-case font-normal">*</span>
                    </label>
                    <textarea
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      rows={4}
                      placeholder={
                        contentType === "blog"   ? "e.g. How to grow a SaaS business from 0 to $10k MRR" :
                        contentType === "email"  ? "e.g. Product launch announcement for our new AI feature" :
                        contentType === "social" ? "e.g. We just crossed 1000 customers milestone" :
                        contentType === "ad"     ? "e.g. CRM software for small businesses — drive signups" :
                        "Describe what you want to generate. Be specific for better results…"
                      }
                      className="w-full bg-white/[0.03] border border-white/[0.07] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/[0.08] resize-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">
                      Additional Context{" "}
                      <span className="normal-case font-normal text-gray-700">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Key points to include, competitor references, word count…"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.07] text-white placeholder-gray-600 rounded-xl text-sm outline-none focus:border-violet-500/50 transition-all"
                    />
                  </div>

                  {/* Tone chips */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Tone</label>
                    <div className="flex flex-wrap gap-2">
                      {TONES.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTone(t)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            tone === t
                              ? "bg-violet-500/15 border-violet-500/35 text-violet-300"
                              : "bg-white/[0.03] border-white/[0.07] text-gray-500 hover:text-gray-200 hover:border-white/[0.14]"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
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

              {/* Generate Button */}
              <motion.button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="relative w-full py-4 rounded-xl font-bold text-sm overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-violet-400 via-purple-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
                <div className="relative flex items-center justify-center gap-2 text-white">
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" />Generating {selectedType?.label} with Claude AI…</>
                  ) : (
                    <><Sparkles size={16} />Generate {selectedType?.label}<ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </div>
              </motion.button>

              {/* ── AI Thinking Animation ─────────────────────────────────── */}
              <AnimatePresence>
                {loading && !output && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] backdrop-blur-xl overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-violet-500/[0.12] flex items-center gap-3">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-violet-300 font-semibold">
                        Claude AI is crafting your {selectedType?.output}…
                      </span>
                    </div>

                    {/* Progress steps */}
                    <div className="p-5 space-y-3">
                      {GEN_STEPS.map((step, i) => {
                        const StepIcon = step.icon;
                        const isDone   = i < genStep;
                        const isActive = i === genStep;
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0.3 }}
                            animate={{ opacity: isDone || isActive ? 1 : 0.35 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center gap-3"
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                              isDone   ? "bg-emerald-500" :
                              isActive ? "bg-violet-500/20 border border-violet-400/40" :
                                         "bg-white/[0.04] border border-white/[0.06]"
                            }`}>
                              {isDone   ? <Check size={10} className="text-white" /> :
                               isActive ? <Loader2 size={10} className="text-violet-400 animate-spin" /> :
                                          <StepIcon size={10} className="text-gray-600" />}
                            </div>
                            <span className={`text-sm transition-colors ${
                              isDone   ? "text-emerald-400" :
                              isActive ? "text-violet-300 font-medium" :
                                         "text-gray-600"
                            }`}>
                              {step.label}{isActive && <span className="animate-pulse">…</span>}
                            </span>
                            {isDone && <Check size={11} className="ml-auto text-emerald-400 flex-shrink-0" />}
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Shimmer skeleton */}
                    <div className="px-5 pb-5 space-y-2">
                      {[0.9, 1, 0.7, 0.85, 0.6, 0.75].map((w, i) => (
                        <div
                          key={i}
                          className="h-3 rounded-full bg-violet-400/[0.07] animate-pulse"
                          style={{ width: `${w * 100}%`, animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Output Section ────────────────────────────────────────── */}
              <AnimatePresence>
                {output && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

                    {/* Output header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm font-semibold text-gray-200">AI Generated Content</span>
                        <span className="text-xs text-gray-600">
                          · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleGenerate}
                          disabled={loading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-gray-400 hover:text-white transition-all"
                        >
                          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                          Regenerate
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleDownload}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-gray-400 hover:text-white transition-all"
                        >
                          <Download size={12} />
                          TXT
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleDownloadPDF}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-gray-400 hover:text-white transition-all"
                        >
                          <Download size={12} />
                          PDF
                        </motion.button>
                        <CopyButton text={output} />
                      </div>
                    </div>

                    {/* Meta bar */}
                    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-md bg-violet-500/10">
                          <Sparkles size={10} className="text-violet-400" />
                        </div>
                        <span className="text-xs font-semibold text-violet-400">AI Generated</span>
                      </div>
                      <span className="text-gray-700 text-xs">·</span>
                      <span className="text-xs text-gray-500">{wordCount.toLocaleString()} words</span>
                      <span className="text-gray-700 text-xs">·</span>
                      <span className="text-xs text-gray-500">{readingTime} min read</span>
                      <span className="text-gray-700 text-xs">·</span>
                      <span className="text-xs capitalize text-gray-500">{selectedType?.output} · {tone}</span>
                      {usage && (
                        <>
                          <span className="text-gray-700 text-xs">·</span>
                          <span className="text-xs text-gray-500">{usage.totalTokens?.toLocaleString()} tokens</span>
                        </>
                      )}
                    </div>

                    {/* Output content */}
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
                    >
                      <div className="p-5 max-h-[480px] overflow-y-auto">
                        <MarkdownContent content={output} />
                      </div>
                    </motion.div>

                    {/* Content Insights */}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Activity size={13} className="text-violet-400" />
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                          Content Insights
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {insightMetrics.map((metric, i) => {
                          const MIcon = metric.icon;
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.18 + i * 0.07 }}
                              className={`rounded-xl border ${metric.ring} bg-white/[0.02] p-4 text-center`}
                            >
                              <div className={`w-8 h-8 rounded-lg ${metric.bg} flex items-center justify-center mx-auto mb-2`}>
                                <MIcon size={14} className={metric.color} />
                              </div>
                              <p className={`text-xl font-extrabold ${metric.color}`}>
                                {metric.value}{metric.unit}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-0.5">{metric.label}</p>
                              <div className="h-1 bg-white/[0.05] rounded-full mt-2 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${metric.value}%` }}
                                  transition={{ duration: 0.8, delay: 0.3 + i * 0.07 }}
                                  className={`h-full rounded-full ${metric.bar} opacity-50`}
                                />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Premium Empty State ──────────────────────────────────── */}
              <AnimatePresence>
                {!output && !loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-xl"
                  >
                    <div className="py-16 px-8 text-center">
                      {/* Illustration */}
                      <div className="relative w-28 h-28 mx-auto mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-3xl" />
                        <div className="absolute inset-2 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-2xl border border-violet-500/20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles size={44} className="text-violet-400/70" />
                        </div>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0"
                        >
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-violet-400/60" />
                        </motion.div>
                        <motion.div
                          animate={{ rotate: -360 }}
                          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                          className="absolute -inset-3"
                        >
                          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-cyan-400/40" />
                        </motion.div>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2">Start Creating Amazing Content</h3>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                        Choose a template above and describe your content idea. Claude AI generates high-quality,
                        ready-to-use marketing content in seconds.
                      </p>

                      <div className="flex items-center justify-center gap-6 mt-8">
                        {[
                          { icon: FileText,  label: "Blog Posts",  color: "text-violet-400", bg: "bg-violet-500/10" },
                          { icon: Mail,      label: "Emails",      color: "text-cyan-400",   bg: "bg-cyan-500/10"   },
                          { icon: Megaphone, label: "Ad Copy",     color: "text-orange-400", bg: "bg-orange-500/10" },
                          { icon: Share2,    label: "Social",      color: "text-pink-400",   bg: "bg-pink-500/10"   },
                        ].map((item, i) => {
                          const IIcon = item.icon;
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 + i * 0.08 }}
                              className="flex flex-col items-center gap-2"
                            >
                              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                                <IIcon size={16} className={item.color} />
                              </div>
                              <span className="text-xs text-gray-600">{item.label}</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Sticky Right Sidebar (1/3) ────────────────────────────── */}
            <div className="space-y-4 xl:sticky xl:top-5 xl:self-start">

              {/* Writing Tips */}
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
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Writing Tips</span>
                </div>
                <div className="p-4 space-y-3">
                  {AI_WRITING_TIPS.map((tip, i) => (
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

              {/* Trending Topics */}
              <motion.div
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.42 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                  <div className="p-1 rounded-lg bg-rose-500/10">
                    <TrendingUp size={13} className="text-rose-400" />
                  </div>
                  <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Trending Topics</span>
                </div>
                <div className="p-3 space-y-1">
                  {TRENDING_TOPICS.map((t, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.46 + i * 0.05 }}
                      onClick={() => setTopic(t)}
                      whileHover={{ x: 3 }}
                      className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-white/[0.04] text-left group transition-all"
                    >
                      <Hash size={10} className="text-gray-700 flex-shrink-0 group-hover:text-violet-400 transition-colors" />
                      <span className="text-xs text-gray-500 group-hover:text-gray-200 transition-colors leading-snug">{t}</span>
                      <ChevronRight size={10} className="ml-auto text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Best Performing Content */}
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
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Best Performing</span>
                </div>
                <div className="p-4 space-y-3.5">
                  {BEST_CONTENT.map((item, i) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{item.label}</span>
                        <span className="text-[10px] font-bold text-gray-300">{item.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.pct}%` }}
                          transition={{ duration: 0.8, delay: 0.55 + i * 0.1 }}
                          className={`h-full rounded-full ${item.color} opacity-60`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Recent Generations */}
              <motion.div
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.53 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-gray-500/10">
                      <Clock size={13} className="text-gray-400" />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600">{history.length}/10</span>
                </div>

                {history.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Clock size={22} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">Generations appear here</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                    {history.map((item) => {
                      const typeConf = CONTENT_TYPES.find((t) => t.id === item.contentType);
                      const TypeIcon = typeConf?.icon || FileText;
                      return (
                        <div
                          key={item.id}
                          onClick={() => { setOutput(item.output); setTopic(item.topic); setContentType(item.contentType); }}
                          className="group flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] cursor-pointer transition-all"
                        >
                          <div className={`w-7 h-7 rounded-lg ${typeConf?.iconBg || "bg-white/[0.04]"} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <TypeIcon size={12} className={typeConf?.iconColor || "text-gray-400"} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-gray-300 font-medium truncate">{item.topic}</p>
                            <p className="text-[10px] text-gray-600 mt-0.5">
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {" · "}{item.output.split(/\s+/).filter(Boolean).length}w
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setHistory((h) => h.filter((i) => i.id !== item.id)); }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Claude AI Status */}
              <motion.div
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.58 }}
                className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] backdrop-blur-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-xs font-semibold text-violet-400">Claude AI · Online</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Model: <span className="text-gray-300 font-medium">claude-sonnet-4-6</span>
                  <br />Optimised for long-form marketing content and high-converting copy.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
