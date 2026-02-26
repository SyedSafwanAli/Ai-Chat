"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { X, Plus, Tag, Lightbulb, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Keyword {
  id: number;
  keyword: string;
}

const SUGGESTED_KEYWORDS = [
  "buy", "order", "purchase", "reserve", "enquire",
  "quote", "estimate", "promo", "deal", "offer",
  "schedule", "visit", "consultation", "trial", "free",
];

export function LeadKeywordsTab() {
  const [keywords,    setKeywords]    = useState<Keyword[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [inputValue,  setInputValue]  = useState("");
  const [error,       setError]       = useState("");

  useEffect(() => {
    api.get<{ keywords: Keyword[] }>("/keywords")
      .then((data) => setKeywords(data.keywords))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addKeyword = async (kw: string) => {
    const trimmed = kw.trim().toLowerCase();
    if (!trimmed) return;
    if (keywords.some((k) => k.keyword === trimmed)) {
      setError(`"${trimmed}" already exists`);
      setTimeout(() => setError(""), 2000);
      return;
    }
    try {
      const res = await api.post<{ keyword: Keyword }>("/keywords", { keyword: trimmed });
      setKeywords((prev) => [...prev, res.keyword]);
      setInputValue("");
      setError("");
    } catch {
      setError("Failed to add keyword");
      setTimeout(() => setError(""), 2000);
    }
  };

  const removeKeyword = async (id: number) => {
    try {
      await api.delete<unknown>(`/keywords/${id}`);
      setKeywords((prev) => prev.filter((k) => k.id !== id));
    } catch {}
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(inputValue);
    } else if (e.key === "Backspace" && !inputValue && keywords.length > 0) {
      removeKeyword(keywords[keywords.length - 1].id);
    }
  };

  const keywordStrings = keywords.map((k) => k.keyword);
  const suggestions = SUGGESTED_KEYWORDS.filter((s) => !keywordStrings.includes(s));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-gray-900 mb-1">Lead Detection Keywords</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          When a customer message contains any of these keywords, the AI will flag the conversation
          as a potential lead and notify you.
        </p>
      </div>

      {/* Tag Input Area */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          <span className="flex items-center gap-1.5">
            <Tag className="h-3 w-3 text-gray-400" />
            Keywords ({keywords.length})
          </span>
        </label>

        <div
          className={cn(
            "min-h-[120px] w-full rounded-xl border-2 bg-white p-3 flex flex-wrap gap-2 content-start",
            "focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20",
            "transition-all duration-150",
            error ? "border-rose-300" : "border-gray-300"
          )}
          onClick={() => document.getElementById("keyword-input")?.focus()}
        >
          {keywords.map((kw) => (
            <span
              key={kw.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700 group"
            >
              {kw.keyword}
              <button
                onClick={(e) => { e.stopPropagation(); removeKeyword(kw.id); }}
                className="rounded-full p-0.5 hover:bg-blue-200 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          <input
            id="keyword-input"
            type="text"
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setError(""); }}
            onKeyDown={handleKeyDown}
            placeholder={keywords.length === 0 ? "Type a keyword and press Enter..." : "Add more..."}
            className="flex-1 min-w-[140px] border-0 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        {error && (
          <p className="mt-1.5 text-xs text-rose-500">{error}</p>
        )}

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] text-gray-400">
            Press <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px]">Enter</kbd> or{" "}
            <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px]">,</kbd> to add a keyword.
            Press <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px]">Backspace</kbd> to remove last.
          </p>
          <button
            onClick={() => addKeyword(inputValue)}
            disabled={!inputValue.trim()}
            className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>
      </div>

      {/* Suggested Keywords */}
      {suggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <p className="text-xs font-semibold text-gray-700">Suggested Keywords</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 10).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => addKeyword(suggestion)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 bg-gray-50 px-3 py-1 text-xs text-gray-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-150"
              >
                <Plus className="h-2.5 w-2.5" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-1">How Lead Detection Works</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              When a customer sends a message containing any of your keywords (e.g., "booking", "price"),
              the AI will automatically classify them as a lead, add them to your Leads panel,
              and optionally alert you for immediate follow-up.
            </p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-700">Lead Detection Settings</p>
        <div className="space-y-3">
          {[
            { label: "Notify me when a new lead is detected", checked: true },
            { label: "Auto-assign hot status for high-value keywords", checked: true },
            { label: "Send follow-up reminder after 2 hours of no response", checked: false },
          ].map((setting, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0">
                <input type="checkbox" className="sr-only peer" defaultChecked={setting.checked} />
                <div className="h-5 w-9 rounded-full bg-gray-200 peer-checked:bg-blue-600 transition-colors" />
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </div>
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{setting.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
