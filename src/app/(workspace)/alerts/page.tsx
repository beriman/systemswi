"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Severity = "critical" | "high" | "medium" | "low";
type AlertItem = {
  id: string;
  category: string;
  severity: Severity;
  title: string;
  detail: string;
  owner: string;
  dueDate?: string;
  amount?: number;
  source: string;
  actionUrl: string;
};

type AlertsResponse = {
  source: string;
  generatedAt: string;
  summary: {
    total: number;
    actionable: number;
    bySeverity: Record<Severity, number>;
    byCategory: Record<string, number>;
  };
  alerts: AlertItem[];
};

const severityClass: Record<Severity, string> = {
  critical: "bg-red-500/15 text-red-200 ring-red-400/30",
  high: "bg-orange-500/15 text-orange-200 ring-orange-400/30",
  medium: "bg-amber-500/15 text-amber-100 ring-amber-400/30",
  low: "bg-emerald-500/15 text-emerald-100 ring-emerald-400/30",
};

const categoryIcon: Record<string, string> = {
  inventory: "📦",
  event: "🎪",
  finance: "💰",
  procurement: "🧾",
  compliance: "✅",
};

const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
      <p className="text-sm text-[#6b9e8f]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/45">{hint}</p>
    </div>
  );
}

export default function AlertsPage() {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");

  async function loadAlerts() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/alerts", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Gagal membaca alert");
      setData(json);
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  const categories = useMemo(() => Object.keys(data?.summary.byCategory || {}), [data?.summary.byCategory]);
  const visibleAlerts = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.alerts;
    if (["critical", "high", "medium", "low"].includes(filter)) return data.alerts.filter((alert) => alert.severity === filter);
    return data.alerts.filter((alert) => alert.category === filter);
  }, [data, filter]);

  return (
    <main className="min-h-screen bg-[#080c0a] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] bg-gradient-to-br from-red-500/20 via-white/[0.04] to-[#0D9488]/20 p-8 shadow-xl ring-1 ring-white/10">
          <p className="text-sm uppercase tracking-[0.35em] text-[#6b9e8f]">Operational Alert Center</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold">Alerts & Next Actions</h1>
              <p className="mt-3 max-w-3xl text-white/65">
                Konsolidasi alert dari Google Sheets: low stock, tenant/sponsor follow-up, deadline event,
                over budget, sisa setoran saham, PO/QC procurement, dan compliance/batch traceability. Data dibaca real-time tanpa mengubah sheet.
              </p>
            </div>
            <button
              onClick={() => loadAlerts()}
              className="rounded-full bg-[#0D9488] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0f766e]"
            >
              {loading ? "Refreshing…" : "Refresh Sheets"}
            </button>
          </div>
        </header>

        {message && <div className="rounded-2xl bg-white/[0.06] p-4 text-sm text-white/80 ring-1 ring-white/10">{message}</div>}

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Total Alert" value={String(data?.summary.total || 0)} hint="semua sumber Sheets" />
          <MetricCard label="Critical" value={String(data?.summary.bySeverity.critical || 0)} hint="perlu tindakan segera" />
          <MetricCard label="High" value={String(data?.summary.bySeverity.high || 0)} hint="prioritas minggu ini" />
          <MetricCard label="Actionable" value={String(data?.summary.actionable || 0)} hint="medium ke atas" />
        </section>

        <section className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Filter Alert</h2>
              <p className="text-sm text-white/45">{data?.source || "Google Sheets"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["all", "critical", "high", "medium", ...categories].map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-4 py-2 text-sm ring-1 ${filter === item ? "bg-white text-[#080c0a] ring-white" : "bg-black/20 text-white/70 ring-white/10 hover:bg-white/10"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {loading && !data ? (
            <div className="rounded-3xl bg-white/[0.04] p-6 text-white/60 ring-1 ring-white/10">Loading alert dari Sheets…</div>
          ) : visibleAlerts.length ? visibleAlerts.map((alert) => (
            <article key={alert.id} className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-white/35">{categoryIcon[alert.category] || "🔔"} {alert.category}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{alert.title}</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${severityClass[alert.severity]}`}>{alert.severity}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/65">{alert.detail}</p>
              <div className="mt-4 grid gap-2 text-sm text-white/55 sm:grid-cols-2">
                <p><span className="text-white/35">Owner:</span> {alert.owner}</p>
                <p><span className="text-white/35">Source:</span> {alert.source}</p>
                {alert.dueDate && <p><span className="text-white/35">Due:</span> {alert.dueDate}</p>}
                {alert.amount ? <p><span className="text-white/35">Amount:</span> {rupiah(alert.amount)}</p> : null}
              </div>
              <Link href={alert.actionUrl} className="mt-5 inline-flex rounded-full bg-[#F97316] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ea580c]">
                Buka modul terkait
              </Link>
            </article>
          )) : (
            <div className="rounded-3xl bg-white/[0.04] p-6 text-white/60 ring-1 ring-white/10">Tidak ada alert untuk filter ini.</div>
          )}
        </section>

        <p className="text-xs text-white/35">Last generated: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString("id-ID") : "-"}</p>
      </div>
    </main>
  );
}
