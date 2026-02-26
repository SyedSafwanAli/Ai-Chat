"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Clock, DollarSign, X, Check, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Service {
  id: number;
  name: string;
  price: string;
  description: string;
  duration: string;
}

interface ServiceCardProps {
  service: Service;
  onEdit: (s: Service) => void;
  onDelete: (id: number) => void;
}

function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-200 hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">{service.name}</h4>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">{service.description}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-emerald-600">
              <DollarSign className="h-3 w-3" />
              <span className="text-sm font-bold">{service.price}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="h-3 w-3" />
              <span className="text-xs">{service.duration}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(service)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(service.id)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ServiceFormProps {
  service?: Service;
  onSave: (s: Service) => void;
  onCancel: () => void;
}

function ServiceForm({ service, onSave, onCancel }: ServiceFormProps) {
  const [form, setForm] = useState<Service>(
    service ?? { id: 0, name: "", price: "", description: "", duration: "" }
  );

  return (
    <div className="rounded-xl border-2 border-blue-200 bg-blue-50/30 p-5">
      <h4 className="text-sm font-semibold text-gray-900 mb-4">
        {service ? "Edit Service" : "New Service"}
      </h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700">Service Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Haircut & Styling"
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700">Price *</label>
          <input
            type="text"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="e.g. $35"
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700">Duration</label>
          <input
            type="text"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            placeholder="e.g. 45 min"
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-700">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short description of the service..."
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm resize-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 justify-end">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
        <button
          onClick={() => form.name && onSave(form)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <Check className="h-3.5 w-3.5" />
          Save Service
        </button>
      </div>
    </div>
  );
}

export function ServicesTab() {
  const [services,    setServices]    = useState<Service[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [editingId,   setEditingId]   = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    api.get<{ services: Service[] }>("/services")
      .then((data) => setServices(data.services))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (s: Service) => {
    try {
      if (editingId !== null) {
        const res = await api.put<{ service: Service }>(`/services/${s.id}`, {
          name: s.name, price: s.price, description: s.description, duration: s.duration,
        });
        setServices((prev) => prev.map((item) => (item.id === res.service.id ? res.service : item)));
        setEditingId(null);
      } else {
        const res = await api.post<{ service: Service }>("/services", {
          name: s.name, price: s.price, description: s.description, duration: s.duration,
        });
        setServices((prev) => [...prev, res.service]);
        setShowAddForm(false);
      }
    } catch {
      // form stays open for retry
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete<unknown>(`/services/${id}`);
      setServices((prev) => prev.filter((s) => s.id !== id));
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
          <p className="text-sm font-medium text-gray-900">Your Services</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {services.length} service{services.length !== 1 ? "s" : ""} — the AI uses these to answer customer pricing questions
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditingId(null); }}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Service
        </button>
      </div>

      {showAddForm && (
        <ServiceForm
          onSave={handleSave}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((service) =>
          editingId === service.id ? (
            <div key={service.id} className="sm:col-span-2">
              <ServiceForm
                service={service}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={(s) => { setEditingId(s.id); setShowAddForm(false); }}
              onDelete={handleDelete}
            />
          )
        )}
      </div>

      {services.length === 0 && !showAddForm && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
          <p className="text-sm text-gray-400">No services yet</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            + Add your first service
          </button>
        </div>
      )}
    </div>
  );
}
