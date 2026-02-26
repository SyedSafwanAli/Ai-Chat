"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { GeneralInfoTab, type BusinessFormData } from "@/components/business-settings/general-info-tab";
import { ServicesTab } from "@/components/business-settings/services-tab";
import { FAQsTab } from "@/components/business-settings/faqs-tab";
import { LeadKeywordsTab } from "@/components/business-settings/lead-keywords-tab";
import { WhatsAppTab } from "@/components/business-settings/whatsapp-tab";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  Building2,
  ListChecks,
  HelpCircle,
  Tag,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
} from "lucide-react";

const tabs = [
  { id: "general",   label: "General Info",   icon: Building2,    description: "Business details & AI tone" },
  { id: "services",  label: "Services",        icon: ListChecks,   description: "Manage your service catalog" },
  { id: "faqs",      label: "FAQs",            icon: HelpCircle,   description: "Common customer questions" },
  { id: "keywords",  label: "Lead Keywords",   icon: Tag,          description: "Auto-detect lead signals" },
  { id: "whatsapp",  label: "WhatsApp",        icon: MessageCircle, description: "Connect your WhatsApp number" },
];

export default function BusinessSettingsPage() {
  const [activeTab,   setActiveTab]   = useState("general");
  const [toast,       setToast]       = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isSaving,    setIsSaving]    = useState(false);
  const [generalData, setGeneralData] = useState<BusinessFormData | null>(null);
  const [isDirty,     setIsDirty]     = useState(false);
  const [resetKey,    setResetKey]    = useState(0); // re-mount GeneralInfoTab to reset

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLoad = (data: BusinessFormData) => {
    setGeneralData(data);  // populate without marking dirty
  };

  const handleChange = (data: BusinessFormData) => {
    setGeneralData(data);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!generalData) return;
    setIsSaving(true);
    try {
      await api.put("/settings/business", generalData);
      setIsDirty(false);
      showToast("success", "Settings saved successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save settings.";
      showToast("error", msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Re-mount GeneralInfoTab so it re-fetches from DB (true reset)
    setResetKey((k) => k + 1);
    setIsDirty(false);
    setToast(null);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== "general") setIsDirty(false);
  };

  return (
    <MainLayout
      pageTitle="Business Settings"
      pageDescription="Configure your AI knowledge base"
    >
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl text-white animate-in slide-in-from-top-2",
            toast.type === "success" ? "bg-gray-900" : "bg-rose-600"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-white flex-shrink-0" />
          )}
          <p className="text-sm font-semibold">{toast.msg}</p>
          <button onClick={() => setToast(null)} className="ml-2 text-gray-300 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="pb-24">
        {/* Tab navigation */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-1.5 shadow-card">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-3 text-left transition-all duration-200",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-white" : "text-gray-400")} />
                  <div className="min-w-0">
                    <p className={cn("text-xs font-semibold truncate", isActive ? "text-white" : "text-gray-700")}>
                      {tab.label}
                    </p>
                    <p className={cn("text-[10px] truncate hidden sm:block", isActive ? "text-blue-100" : "text-gray-400")}>
                      {tab.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card min-h-[400px]">
          {activeTab === "general"  && <GeneralInfoTab key={resetKey} onLoad={handleLoad} onChange={handleChange} />}
          {activeTab === "services" && <ServicesTab />}
          {activeTab === "faqs"     && <FAQsTab />}
          {activeTab === "keywords" && <LeadKeywordsTab />}
          {activeTab === "whatsapp" && <WhatsAppTab />}
        </div>
      </div>

      {/* Sticky Save Bar — only shown for General Info tab */}
      {activeTab === "general" && (
        <div
          className="fixed bottom-0 right-0 left-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-6 py-3 flex items-center justify-between shadow-lg"
          style={{ paddingLeft: "calc(240px + 1.5rem)" }}
        >
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isDirty ? "You have unsaved changes" : "General Information"}
            </p>
            <p className="text-xs text-gray-400">
              {isDirty
                ? "Save to update your AI knowledge base."
                : "Edit fields above, then click Save Changes."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              disabled={!isDirty || isSaving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
