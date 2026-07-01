import { useEffect } from "react";
import { Clock, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAIHistory } from "../../hooks/useAI";

const FEATURE_LABELS = {
  seo_title: "SEO Title",
  meta_description: "Meta Description",
  blog: "Blog Post",
  email: "Email",
  social: "Social Post",
  ad_copy: "Ad Copy",
};

export default function AIHistoryPanel({ feature }) {
  const { items, loading, page, totalPages, load, remove } = useAIHistory(feature);

  useEffect(() => {
    load(1);
  }, [feature]);

  if (loading && items.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock size={36} className="text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">No history yet</p>
        <p className="text-sm text-gray-400 mt-1">Your generated content will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item._id} className="group rounded-xl border border-gray-200 bg-white p-4 hover:border-purple-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full mb-2">
                  {FEATURE_LABELS[item.feature] || item.feature}
                </span>
                <p className="text-sm text-gray-800 line-clamp-2 leading-relaxed">{item.output}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(item.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
              <button
                onClick={() => remove(item._id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => load(page - 1)}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => load(page + 1)}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
