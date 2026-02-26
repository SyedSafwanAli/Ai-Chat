"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

interface FAQItemProps {
  faq: FAQ;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function FAQItem({ faq, isOpen, onToggle, onEdit, onDelete }: FAQItemProps) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden transition-all duration-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <HelpCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900 truncate pr-4">{faq.question}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </span>
          <span
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-400 ml-1" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400 ml-1" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
          <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

interface FAQFormProps {
  faq?: FAQ;
  onSave: (faq: FAQ) => void;
  onCancel: () => void;
}

function FAQForm({ faq, onSave, onCancel }: FAQFormProps) {
  const [form, setForm] = useState<FAQ>(
    faq ?? { id: 0, question: "", answer: "" }
  );

  return (
    <div className="rounded-xl border-2 border-blue-200 bg-blue-50/30 p-5 space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">
        {faq ? "Edit FAQ" : "New FAQ"}
      </h4>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-700">Question *</label>
        <input
          type="text"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          placeholder="e.g. What are your working hours?"
          className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-700">Answer *</label>
        <textarea
          value={form.answer}
          onChange={(e) => setForm({ ...form, answer: e.target.value })}
          placeholder="Provide a clear, helpful answer..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm resize-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
        <button
          onClick={() => form.question && form.answer && onSave(form)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <Check className="h-3.5 w-3.5" /> Save FAQ
        </button>
      </div>
    </div>
  );
}

export function FAQsTab() {
  const [faqs,        setFAQs]        = useState<FAQ[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [openId,      setOpenId]      = useState<number | null>(null);
  const [editingId,   setEditingId]   = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    api.get<{ faqs: FAQ[] }>("/faqs")
      .then((data) => {
        setFAQs(data.faqs);
        if (data.faqs.length > 0) setOpenId(data.faqs[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (faq: FAQ) => {
    try {
      if (editingId !== null) {
        const res = await api.put<{ faq: FAQ }>(`/faqs/${faq.id}`, {
          question: faq.question, answer: faq.answer,
        });
        setFAQs((prev) => prev.map((f) => (f.id === res.faq.id ? res.faq : f)));
        setEditingId(null);
      } else {
        const res = await api.post<{ faq: FAQ }>("/faqs", {
          question: faq.question, answer: faq.answer,
        });
        setFAQs((prev) => [...prev, res.faq]);
        setShowAddForm(false);
      }
    } catch {
      // form stays open for retry
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete<unknown>(`/faqs/${id}`);
      setFAQs((prev) => prev.filter((f) => f.id !== id));
      if (openId === id) setOpenId(null);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Frequently Asked Questions</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {faqs.length} FAQ{faqs.length !== 1 ? "s" : ""} — helps AI respond accurately to common queries
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditingId(null); }}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Add FAQ
        </button>
      </div>

      {showAddForm && (
        <FAQForm onSave={handleSave} onCancel={() => setShowAddForm(false)} />
      )}

      <div className="space-y-2">
        {faqs.map((faq) =>
          editingId === faq.id ? (
            <FAQForm
              key={faq.id}
              faq={faq}
              onSave={handleSave}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <FAQItem
              key={faq.id}
              faq={faq}
              isOpen={openId === faq.id}
              onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
              onEdit={() => { setEditingId(faq.id); setShowAddForm(false); }}
              onDelete={() => handleDelete(faq.id)}
            />
          )
        )}
      </div>

      {faqs.length === 0 && !showAddForm && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
          <HelpCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No FAQs yet</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            + Add your first FAQ
          </button>
        </div>
      )}
    </div>
  );
}
