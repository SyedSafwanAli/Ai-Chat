"use client";

import { useState, useEffect } from "react";
import { MapPin, Phone, Clock, MessageSquare, Globe, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export interface WorkingHoursDay {
  day: string;
  from: string;
  to: string;
  active: boolean;
}

export interface BusinessFormData {
  name: string;
  phone: string;
  website: string;
  address: string;
  category: string;
  tone: string;
  working_hours: WorkingHoursDay[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_WORKING_HOURS: WorkingHoursDay[] = DAYS.map((day, i) => ({
  day,
  from: "09:00",
  to: "18:00",
  active: i < 6,
}));

function parseWorkingHours(raw: unknown): WorkingHoursDay[] {
  if (Array.isArray(raw) && raw.length > 0) return raw as WorkingHoursDay[];
  return DEFAULT_WORKING_HOURS;
}

interface Props {
  onLoad?:   (data: BusinessFormData) => void;  // called once when data fetched from DB
  onChange?: (data: BusinessFormData) => void;  // called only on user edits
}

const CATEGORIES = [
  "Beauty & Wellness",
  "Restaurant & Food",
  "Retail & Shopping",
  "Healthcare",
  "Education",
  "Other",
];

const TONES = [
  { value: "professional", label: "Professional", desc: "Formal and business-like",   emoji: "👔" },
  { value: "friendly",     label: "Friendly",     desc: "Warm and approachable",      emoji: "😊" },
  { value: "casual",       label: "Casual",       desc: "Relaxed and conversational", emoji: "✌️" },
];

export function GeneralInfoTab({ onLoad, onChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<BusinessFormData>({
    name: "", phone: "", website: "", address: "", category: "Beauty & Wellness", tone: "friendly",
    working_hours: DEFAULT_WORKING_HOURS,
  });

  useEffect(() => {
    api.get<{ business: BusinessFormData & { working_hours?: unknown } }>("/settings/business")
      .then((data) => {
        const b = data.business;
        const loaded: BusinessFormData = {
          name:          b.name     || "",
          phone:         b.phone    || "",
          website:       b.website  || "",
          address:       b.address  || "",
          category:      b.category || "Beauty & Wellness",
          tone:          b.tone     || "friendly",
          working_hours: parseWorkingHours(b.working_hours),
        };
        setForm(loaded);
        onLoad?.(loaded);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (patch: Partial<BusinessFormData>) => {
    const next = { ...form, ...patch };
    setForm(next);
    onChange?.(next);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Business Identity */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Business Identity
        </h4>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Business Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <p className="text-[10px] text-gray-400">Shown to customers in AI responses</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Business Category
            </label>
            <select
              value={form.category}
              onChange={(e) => update({ category: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Contact Information
        </h4>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              <span className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-gray-400" />
                WhatsApp Number
              </span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update({ phone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-gray-400" />
                Website (Optional)
              </span>
            </label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => update({ website: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-gray-400" />
                Business Address
              </span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => update({ address: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Working Hours */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          <span className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Working Hours
          </span>
        </h4>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          {form.working_hours.map((row, idx) => (
            <div
              key={row.day}
              className={`flex items-center gap-4 px-4 py-3 ${idx !== 0 ? "border-t border-gray-100" : ""} ${!row.active ? "opacity-50" : ""}`}
            >
              <div className="w-28 flex-shrink-0">
                <p className="text-sm font-medium text-gray-700">{row.day}</p>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={row.from}
                  disabled={!row.active}
                  onChange={(e) => {
                    const next = form.working_hours.map((d, i) => i === idx ? { ...d, from: e.target.value } : d);
                    update({ working_hours: next });
                  }}
                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="time"
                  value={row.to}
                  disabled={!row.active}
                  onChange={(e) => {
                    const next = form.working_hours.map((d, i) => i === idx ? { ...d, to: e.target.value } : d);
                    update({ working_hours: next });
                  }}
                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={row.active}
                    onChange={(e) => {
                      const next = form.working_hours.map((d, i) => i === idx ? { ...d, active: e.target.checked } : d);
                      update({ working_hours: next });
                    }}
                  />
                  <div className="h-5 w-9 rounded-full bg-gray-200 peer-checked:bg-blue-600 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <span className="text-xs text-gray-500">Open</span>
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* AI Tone */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-3 w-3" />
            AI Response Tone
          </span>
        </h4>
        <div className="grid gap-3 sm:grid-cols-3">
          {TONES.map((tone) => (
            <label key={tone.value} className="cursor-pointer" onClick={() => update({ tone: tone.value })}>
              <div className={`rounded-xl border-2 p-4 transition-all ${form.tone === tone.value ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                <div className="text-2xl mb-2">{tone.emoji}</div>
                <p className="text-sm font-semibold text-gray-900">{tone.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{tone.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* AI Language */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Language Settings
        </h4>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">Primary Language</label>
            <select className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer">
              <option>English</option>
              <option>Arabic (العربية)</option>
              <option>French</option>
              <option>Spanish</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Auto-detect Customer Language
            </label>
            <div className="flex items-center gap-3 mt-2">
              <label className="relative cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="h-5 w-9 rounded-full bg-gray-200 peer-checked:bg-blue-600 transition-colors" />
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </label>
              <span className="text-sm text-gray-600">Enabled — AI responds in customer's language</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
