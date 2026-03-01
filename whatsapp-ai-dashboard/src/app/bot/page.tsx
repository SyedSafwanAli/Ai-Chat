'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  Bot, Wifi, WifiOff, Package, HelpCircle, Tag, Zap,
  Settings, ChevronRight, RefreshCw, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessInfo {
  name: string;
  description: string;
  phone: string;
  address: string;
  working_hours: string;
}

interface WhatsAppStatus {
  connected: boolean;
  phone_number_id?: string;
}

interface BotData {
  business: BusinessInfo;
  whatsapp: WhatsAppStatus;
  serviceCount: number;
  faqCount: number;
  keywordCount: number;
  quickReplyCount: number;
}

function SetupItem({
  label, count, icon: Icon, href, color, bgColor, hint,
}: {
  label: string; count: number; icon: React.ElementType;
  href: string; color: string; bgColor: string; hint: string;
}) {
  const router = useRouter();
  const isConfigured = count > 0;

  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center gap-4 w-full rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-all text-left group"
    >
      <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', bgColor)}>
        <Icon className={cn('h-5 w-5', color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {isConfigured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
              <CheckCircle2 className="h-3 w-3" />
              {count} added
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              <AlertCircle className="h-3 w-3" />
              Not set up
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
    </button>
  );
}

export default function BotPage() {
  const router = useRouter();
  const [data,    setData]    = useState<BotData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [bizRes, waRes, svcRes, faqRes, kwRes, qrRes] = await Promise.allSettled([
        api.get<{ business: BusinessInfo }>('/settings/business'),
        api.get<{ connected: boolean; phone_number_id?: string }>('/whatsapp'),
        api.get<{ services: unknown[] }>('/services'),
        api.get<{ faqs: unknown[] }>('/faqs'),
        api.get<{ keywords: unknown[] }>('/keywords'),
        api.get<{ replies: unknown[] }>('/quick-replies'),
      ]);

      const biz = bizRes.status === 'fulfilled' ? bizRes.value.business : null;
      const wa  = waRes.status  === 'fulfilled' ? waRes.value           : { connected: false };
      const svc = svcRes.status === 'fulfilled' ? svcRes.value.services?.length ?? 0 : 0;
      const faq = faqRes.status === 'fulfilled' ? faqRes.value.faqs?.length     ?? 0 : 0;
      const kw  = kwRes.status  === 'fulfilled' ? kwRes.value.keywords?.length  ?? 0 : 0;
      const qr  = qrRes.status  === 'fulfilled' ? qrRes.value.replies?.length   ?? 0 : 0;

      setData({
        business: biz ?? { name: '—', description: '', phone: '', address: '', working_hours: '' },
        whatsapp: wa,
        serviceCount:    Number(svc),
        faqCount:        Number(faq),
        keywordCount:    Number(kw),
        quickReplyCount: Number(qr),
      });
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setupScore = !data ? 0 : [
    data.whatsapp.connected,
    data.serviceCount > 0,
    data.faqCount > 0,
    data.keywordCount > 0,
  ].filter(Boolean).length;

  return (
    <MainLayout pageTitle="Bot Overview" pageDescription="Your WhatsApp AI bot status and configuration">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bot Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">WhatsApp AI bot configuration summary</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : (
        <>
          {/* Status Banner */}
          <div className={cn(
            'rounded-2xl border p-5 mb-6 flex items-center gap-5',
            data?.whatsapp.connected
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          )}>
            <div className={cn(
              'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl',
              data?.whatsapp.connected ? 'bg-green-100' : 'bg-red-100'
            )}>
              {data?.whatsapp.connected
                ? <Wifi className="h-7 w-7 text-green-600" />
                : <WifiOff className="h-7 w-7 text-red-500" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-base font-bold',
                data?.whatsapp.connected ? 'text-green-800' : 'text-red-700'
              )}>
                {data?.whatsapp.connected ? 'Bot is Live — WhatsApp Connected' : 'Bot Offline — WhatsApp Not Connected'}
              </p>
              <p className={cn(
                'text-sm mt-0.5',
                data?.whatsapp.connected ? 'text-green-600' : 'text-red-500'
              )}>
                {data?.whatsapp.connected
                  ? `Phone ID: ${data?.whatsapp.phone_number_id || 'configured'} · Receiving and replying to messages`
                  : 'Go to Business Settings → WhatsApp tab to connect your Meta phone number.'
                }
              </p>
            </div>
            {!data?.whatsapp.connected && (
              <button
                onClick={() => router.push('/business-settings')}
                className="flex-shrink-0 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                Connect Now
              </button>
            )}
          </div>

          {/* Setup Progress */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Bot Setup Progress</h3>
              <span className="text-sm font-bold text-gray-700">{setupScore}/4 steps done</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  setupScore === 4 ? 'bg-green-500' : setupScore >= 2 ? 'bg-blue-500' : 'bg-amber-500'
                )}
                style={{ width: `${(setupScore / 4) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {setupScore === 4
                ? 'Great! Your bot is fully configured and ready to handle customer queries.'
                : 'Complete all steps below to make your bot more effective.'}
            </p>
          </div>

          {/* Setup Items */}
          <div className="space-y-3 mb-6">
            <SetupItem
              label="WhatsApp Connection"
              count={data?.whatsapp.connected ? 1 : 0}
              icon={data?.whatsapp.connected ? Wifi : WifiOff}
              href="/business-settings"
              color={data?.whatsapp.connected ? 'text-green-600' : 'text-gray-400'}
              bgColor={data?.whatsapp.connected ? 'bg-green-50' : 'bg-gray-50'}
              hint="Connect your Meta WhatsApp Business phone number"
            />
            <SetupItem
              label="Services / Products"
              count={data?.serviceCount ?? 0}
              icon={Package}
              href="/business-settings"
              color="text-blue-600"
              bgColor="bg-blue-50"
              hint="Add your services/products so the bot can answer pricing questions"
            />
            <SetupItem
              label="FAQs"
              count={data?.faqCount ?? 0}
              icon={HelpCircle}
              href="/business-settings"
              color="text-violet-600"
              bgColor="bg-violet-50"
              hint="Common questions the bot will answer automatically"
            />
            <SetupItem
              label="Lead Keywords"
              count={data?.keywordCount ?? 0}
              icon={Tag}
              href="/business-settings"
              color="text-amber-600"
              bgColor="bg-amber-50"
              hint="Words that indicate a customer is interested (e.g. 'price', 'order')"
            />
            <SetupItem
              label="Quick Replies"
              count={data?.quickReplyCount ?? 0}
              icon={Zap}
              href="/quick-replies"
              color="text-teal-600"
              bgColor="bg-teal-50"
              hint="Pre-written response templates you can send with one click"
            />
          </div>

          {/* Business Info Card */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Bot Identity</h3>
                <p className="text-xs text-gray-400">From Business Settings → General Info</p>
              </div>
              <button
                onClick={() => router.push('/business-settings')}
                className="ml-auto flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Business Name', value: data?.business.name },
                { label: 'Phone',         value: data?.business.phone || 'Not set' },
                { label: 'Address',       value: data?.business.address || 'Not set' },
                { label: 'Working Hours', value: data?.business.working_hours || 'Not set' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-xs font-medium text-gray-800 truncate">{value || '—'}</p>
                </div>
              ))}
            </div>
            {data?.business.description && (
              <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Business Description</p>
                <p className="text-xs text-gray-700 leading-relaxed">{data.business.description}</p>
              </div>
            )}
          </div>
        </>
      )}
    </MainLayout>
  );
}
