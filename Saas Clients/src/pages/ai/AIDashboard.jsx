import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAIUsage } from "../../api/ai";
import {
  Search, FileText, Mail, Share2, Megaphone,
  Sparkles, TrendingUp, Zap, ArrowRight
} from "lucide-react";

const AI_TOOLS = [
  {
    id: "seo",
    title: "SEO Generator",
    description: "Generate SEO titles and meta descriptions that rank",
    icon: Search,
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    href: "/ai/seo",
    badge: "Popular",
  },
  {
    id: "blog",
    title: "Blog Writer",
    description: "Create long-form blog posts and article outlines",
    icon: FileText,
    color: "from-purple-500 to-indigo-500",
    bg: "bg-purple-50",
    iconColor: "text-purple-600",
    href: "/ai/blog",
  },
  {
    id: "email",
    title: "Email Content",
    description: "Write subject lines and full email campaigns",
    icon: Mail,
    color: "from-green-500 to-emerald-500",
    bg: "bg-green-50",
    iconColor: "text-green-600",
    href: "/ai/email",
  },
  {
    id: "social",
    title: "Social Media",
    description: "Create posts for LinkedIn, Twitter, Instagram & Facebook",
    icon: Share2,
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-50",
    iconColor: "text-pink-600",
    href: "/ai/social",
  },
  {
    id: "ad_copy",
    title: "Ad Copy",
    description: "High-converting copy for Google & Meta ads",
    icon: Megaphone,
    color: "from-orange-500 to-amber-500",
    bg: "bg-orange-50",
    iconColor: "text-orange-600",
    href: "/ai/ads",
    badge: "New",
  },
];

export default function AIDashboard() {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    getAIUsage()
      .then((res) => setUsage(res.data.data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-purple-100">
            <Sparkles size={18} className="text-purple-600" />
          </div>
          <span className="text-sm font-semibold text-purple-600 uppercase tracking-wider">AI Content Suite</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">AI Dashboard</h1>
        <p className="text-gray-500 mt-1">Generate high-quality content in seconds with Claude AI</p>
      </div>

      {/* Usage Stats */}
      {usage && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Zap}
            label="This Month"
            value={usage.totalRequests}
            unit="generations"
            color="purple"
          />
          <StatCard
            icon={TrendingUp}
            label="Blog Posts"
            value={usage.byFeature?.blog?.requests || 0}
            unit="created"
            color="indigo"
          />
          <StatCard
            icon={Mail}
            label="Emails"
            value={usage.byFeature?.email?.requests || 0}
            unit="written"
            color="green"
          />
          <StatCard
            icon={Search}
            label="SEO Titles"
            value={usage.byFeature?.seo_title?.requests || 0}
            unit="generated"
            color="blue"
          />
        </div>
      )}

      {/* Tools Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Content Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AI_TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, unit, color }) {
  const colors = {
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className={`inline-flex p-2 rounded-lg ${colors[color]} mb-3`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label} · {unit}</p>
    </div>
  );
}

function ToolCard({ tool }) {
  const Icon = tool.icon;
  return (
    <Link
      to={tool.href}
      className="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${tool.bg}`}>
          <Icon size={20} className={tool.iconColor} />
        </div>
        {tool.badge && (
          <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
            {tool.badge}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{tool.title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-4">{tool.description}</p>
      <div className="flex items-center gap-1 text-sm font-medium text-purple-600 group-hover:gap-2 transition-all">
        Open tool <ArrowRight size={14} />
      </div>
    </Link>
  );
}
