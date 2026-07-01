import { useState } from "react";
import { Copy, Check, Trash2 } from "lucide-react";

export default function AIOutputBox({ output, onDelete, loading }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="mt-6 rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce" />
          <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.15s]" />
          <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.3s]" />
          <span className="text-sm text-purple-600 font-medium">AI is generating...</span>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-purple-100 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-purple-100 rounded animate-pulse w-full" />
          <div className="h-4 bg-purple-100 rounded animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  if (!output) return null;

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-sm font-semibold text-gray-700">AI Output</span>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <div className="p-4">
        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">{output}</pre>
      </div>
    </div>
  );
}
