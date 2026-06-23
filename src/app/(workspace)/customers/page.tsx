"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// ── Types ──

type Customer = {
  id: string;
  name: string;
  whatsapp: string;
  segment: string;
  interest: string;
  source: string;
  consent: string;
  lastContact: string;
  totalPurchases: number;
  clv: number;
  recommendedFormula: string;
  notes: string;
  updatedAt: string;
};

type Interaction = {
  timestamp: string;
  interactionId: string;
  customerId: string;
  name: string;
  type: string;
  channel: string;
  summary: string;
  value: number;
  followUpDate: string;
  pic: string;
};

type FollowUp = Interaction & {
  dueDate: string;
  status: "overdue" | "due_today" | "upcoming";
};

type Summary = {
  totalCustomers: number;
  consentedCustomers: number;
  needsConsentReview: number;
  totalClv: number;
  bySegment: Record<string, number>;
  recentInteractions: Interaction[];
  followUps: FollowUp[];
  followUpSummary: { overdue: number; dueToday: number; upcoming7Days: number };
};

type CustomerPayload = {
  source?: string;
  sourceStatus?: string;
  warning?: string;
  customers: Customer[];
  interactions: Interaction[];
  summary: Summary;
};

type SegmentData = {
  totalCustomers: number;
  totalClv: number;
  segments: {
    vip: { count: number; customers: Customer[]; totalClv: number; criteria: string };
    loyal: { count: number; customers: Customer[]; totalClv: number; criteria: string };
    regular: { count: number; customers: Customer[]; totalClv: number; criteria: string };
    new: { count: number; customers: Customer[]; totalClv: number; criteria: string };
  };
  bySegment: Record<string, number>;
};

// ── Helpers ──

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

const SEGMENT_META: Record<string, { color: string; label: string; icon: string }> = {
  vip: { color: "bg-purple-600", label: "VIP", icon: "👑" },
  loyal: { color: "bg-emerald-600", label: "Loyal", icon: "💚" },
  regular: { color: "bg-blue-600", label: "Regular", icon: "🔵" },
  new: { color: "bg-amber-500", label: "New", icon: "🆕" },
};

const emptyCustomerForm = {
  name: "", whatsapp: "", interest: "", source: "WhatsApp",
  consent: "TBA", totalPurchases: "0", clv: "0",
  recommendedFormula: "TBA", notes: "", followUpDate: "",
};

const emptyInteractionForm = {
  type: "follow_up", channel: "WhatsApp", summary: "", value: "0",
  followUpDate: "", pic: "HemuHemu/OWL",
};

// ── Main Component ──

export default function CustomersPage() {
  const [data, setData] = useState<CustomerPayload | null>(null);
  const [segments, setSegments] = useState<SegmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Memuat Customer 360...");

  // Forms
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [interactionForm, setInteractionForm] = useState(emptyInteractionForm);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerInteractions, setCustomerInteractions] = useState<Interaction[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);

  // Filters
  const [query, setQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<"all" | "vip" | "loyal" | "regular" | "new">("all");

  // Filtered customers (server-side filtering via API; this is just a pass-through)
  const filteredCustomers = useMemo(() => {
    return data?.customers || [];
  }, [data]);

  // ── Data Loading ──

  async function loadAll() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (segmentFilter !== "all") params.set("segment", segmentFilter);
      const qs = params.toString();
      
      const [crmRes, segRes] = await Promise.all([
        fetch(`/api/customers${qs ? `?${qs}` : ""}`, { cache: "no-store" }),
        fetch("/api/customers/segments", { cache: "no-store" }),
      ]);
      const crm: CustomerPayload = await crmRes.json();
      const seg: SegmentData = await segRes.json();
      setData(crm);
      setSegments(seg);
      const src = crm.source || "SQLite + Google Sheets";
      const filterNote = crm.totalBeforeFilter !== undefined && crm.totalBeforeFilter !== crm.customers.length
        ? ` (${crm.customers.length} dari ${crm.totalBeforeFilter} customer)` 
        : "";
      setStatus(crm.warning || `Customer 360 siap — source: ${src}${filterNote}`);
    } catch (error) {
      setStatus(`Gagal memuat: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  // Reload when search/filter changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => { loadAll(); }, 300);
    return () => clearTimeout(timer);
  }, [query, segmentFilter]);

  // ── Customer Detail ──

  async function selectCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setLoadingInteractions(true);
    setCustomerInteractions([]);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, { cache: "no-store" });
      const payload = await res.json();
      if (payload.interactions) {
        setCustomerInteractions(payload.interactions);
      }
    } catch {
      // ignore
    } finally {
      setLoadingInteractions(false);
    }
  }

  // ── Form Submissions ──

  async function submitCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Menyinkronkan customer...");
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert-customer",
          ...customerForm,
          totalPurchases: Number(customerForm.totalPurchases || 0),
          clv: Number(customerForm.clv || 0),
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || payload?.details || "Gagal menyimpan");
      setStatus(`✅ Customer tersinkron: ${payload.customer?.name}`);
      setCustomerForm(emptyCustomerForm);
      await loadAll();
    } catch (error) {
      setStatus(`⚠️ ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function submitInteraction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCustomer) {
      setStatus("⚠️ Pilih customer terlebih dahulu");
      return;
    }
    setStatus("Mencatat interaction...");
    try {
      // Use the dedicated interactions endpoint
      const res = await fetch(`/api/customers/${selectedCustomer.id}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...interactionForm,
          value: Number(interactionForm.value || 0),
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || payload?.details || "Gagal mencatat");
      setStatus(`✅ Interaction tercatat: ${payload.interaction?.interactionId}`);
      setInteractionForm(emptyInteractionForm);
      await loadAll();
      if (selectedCustomer) selectCustomer(payload.customer || selectedCustomer);
    } catch (error) {
      setStatus(`⚠️ ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ── Render Helpers ──

  const topCustomers = useMemo(() => {
    return [...(data?.customers || [])].sort((a, b) => b.clv - a.clv).slice(0, 5);
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">CRM / Customer 360</p>
          <h1 className="text-3xl font-bold">👥 Customer 360</h1>
          <p className="text-muted-foreground">
            Customer relationship management lengkap — master data, interactions, segmentation.
          </p>
        </div>
        <Button onClick={loadAll} disabled={loading}>
          {loading ? "Memuat..." : "Refresh Data"}
        </Button>
      </div>

      {/* Degraded warning */}
      {data?.sourceStatus === "degraded" || data?.sourceStatus === "blocked" ? (
        <Card className="border-orange-500/40 bg-orange-500/10">
          <CardHeader>
            <CardTitle>Google Workspace perlu re-auth</CardTitle>
            <CardDescription>{data.warning || status}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {/* ── Tabs ── */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="list">📋 Customer List</TabsTrigger>
          <TabsTrigger value="detail">🔍 Customer Detail</TabsTrigger>
          <TabsTrigger value="segments">🎯 Segments</TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════
            TAB 1: DASHBOARD
        ════════════════════════════════════════════ */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Metric title="Total Customer" value={data?.summary.totalCustomers || 0} />
            <Metric title="VIP" value={data?.summary.bySegment?.vip || 0} tone="purple" />
            <Metric title="Regular" value={data?.summary.bySegment?.regular || 0} tone="blue" />
            <Metric title="New" value={data?.summary.bySegment?.new || 0} tone="amber" />
            <Metric title="Total CLV" value={formatCurrency(data?.summary.totalClv || 0)} />
            <Metric title="Follow-up Overdue" value={data?.summary.followUpSummary?.overdue || 0} tone="red" />
          </div>

          {/* Segment Distribution */}
          {data?.summary.bySegment && Object.keys(data.summary.bySegment).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Distribusi Segment Customer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(data.summary.bySegment).map(([seg, count]) => {
                    const meta = SEGMENT_META[seg] || { color: "bg-gray-400", label: seg, icon: "?" };
                    const pct = data?.summary.totalCustomers ? Math.round((count / data.summary.totalCustomers) * 100) : 0;
                    return (
                      <div key={seg} className="flex-1 min-w-[120px]">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize font-medium">{meta.icon} {meta.label}</span>
                          <span className="text-muted-foreground">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${meta.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>🏆 Top Customers by CLV</CardTitle>
              <CardDescription>Customer dengan nilai lifetime tertinggi</CardDescription>
            </CardHeader>
            <CardContent>
              {topCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada data customer.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60 text-left">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Segment</th>
                        <th className="p-3 text-right">Purchases</th>
                        <th className="p-3 text-right">CLV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCustomers.map((c, i) => (
                        <tr key={c.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => selectCustomer(c)}>
                          <td className="p-3 font-medium">{i + 1}</td>
                          <td className="p-3">
                            <div className="font-medium">{c.name}</div>
                            <div className="text-xs text-muted-foreground">{c.whatsapp}</div>
                          </td>
                          <td className="p-3"><SegmentBadge segment={c.segment} /></td>
                          <td className="p-3 text-right">{c.totalPurchases}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(c.clv)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Interactions */}
          <Card>
            <CardHeader>
              <CardTitle>💬 Recent Interactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.summary.recentInteractions || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada interaction tercatat.</p>
              ) : data?.summary.recentInteractions.map((ix) => (
                <div key={ix.interactionId} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{ix.name}</div>
                    <Badge variant="outline">{ix.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{ix.summary || "TBA"}</p>
                  <p className="text-xs text-muted-foreground">{ix.timestamp} · {ix.channel}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════
            TAB 2: CUSTOMER LIST
        ════════════════════════════════════════════ */}
        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            {/* Add Customer Form */}
            <Card>
              <CardHeader>
                <CardTitle>➕ Add / Update Customer</CardTitle>
                <CardDescription>Data terverifikasi. Jika consent belum jelas, pilih TBA.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={submitCustomer}>
                  <Field label="Nama" value={customerForm.name} onChange={(v) => setCustomerForm({ ...customerForm, name: v })} required />
                  <Field label="WhatsApp" value={customerForm.whatsapp} onChange={(v) => setCustomerForm({ ...customerForm, whatsapp: v })} placeholder="62812..." required />
                  <Field label="Minat" value={customerForm.interest} onChange={(v) => setCustomerForm({ ...customerForm, interest: v })} placeholder="Kelas parfumer / produk" />
                  <Field label="Sumber" value={customerForm.source} onChange={(v) => setCustomerForm({ ...customerForm, source: v })} />
                  <div className="grid gap-2">
                    <Label>Consent follow-up</Label>
                    <select className="rounded-md border bg-background px-3 py-2" value={customerForm.consent}
                      onChange={(e) => setCustomerForm({ ...customerForm, consent: e.target.value })}>
                      <option value="TBA">TBA / belum diverifikasi</option>
                      <option value="yes">Ya</option>
                      <option value="no">Tidak</option>
                    </select>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Total Purchase" type="number" value={customerForm.totalPurchases} onChange={(v) => setCustomerForm({ ...customerForm, totalPurchases: v })} />
                    <Field label="CLV (Rp)" type="number" value={customerForm.clv} onChange={(v) => setCustomerForm({ ...customerForm, clv: v })} />
                  </div>
                  <Field label="Rekomendasi Formula" value={customerForm.recommendedFormula} onChange={(v) => setCustomerForm({ ...customerForm, recommendedFormula: v })} />
                  <div className="grid gap-2">
                    <Label>Catatan</Label>
                    <Textarea value={customerForm.notes} onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })} placeholder="Preferensi aroma, status follow-up" />
                  </div>
                  <Button type="submit" className="w-full">Sync Customer</Button>
                </form>
              </CardContent>
            </Card>

            {/* Customer Table */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Master</CardTitle>
                <CardDescription>{status}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, WA, minat..." className="max-w-sm" />
                  <div className="flex gap-1">
                    {(["all", "vip", "loyal", "regular", "new"] as const).map((s) => (
                      <Button key={s} size="sm" variant={segmentFilter === s ? "default" : "outline"}
                        onClick={() => setSegmentFilter(s)}>
                        {s === "all" ? "Semua" : SEGMENT_META[s]?.label || s}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60 text-left">
                      <tr>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Segment</th>
                        <th className="p-3">Minat</th>
                        <th className="p-3">Consent</th>
                        <th className="p-3 text-right">CLV</th>
                        <th className="p-3">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.length === 0 ? (
                        <tr><td className="p-6 text-center text-muted-foreground" colSpan={6}>
                          {loading ? "Memuat..." : "Belum ada data / source degraded."}
                        </td></tr>
                      ) : filteredCustomers.map((c) => (
                        <tr key={c.id} className="border-t hover:bg-muted/30">
                          <td className="p-3">
                            <div className="font-medium">{c.name}</div>
                            <div className="text-xs text-muted-foreground">{c.whatsapp} · {c.id}</div>
                          </td>
                          <td className="p-3"><SegmentBadge segment={c.segment} /></td>
                          <td className="p-3">{c.interest || "TBA"}</td>
                          <td className="p-3"><ConsentBadge value={c.consent} /></td>
                          <td className="p-3 text-right">{formatCurrency(c.clv)}</td>
                          <td className="p-3">
                            <Button size="sm" variant="outline" onClick={() => selectCustomer(c)}>Lihat</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════
            TAB 3: CUSTOMER DETAIL
        ════════════════════════════════════════════ */}
        <TabsContent value="detail" className="space-y-4">
          {!selectedCustomer ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Pilih customer dari tab Customer List untuk melihat detail.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
              {/* Profile Card */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{selectedCustomer.name}</CardTitle>
                      <SegmentBadge segment={selectedCustomer.segment} />
                    </div>
                    <CardDescription>{selectedCustomer.id}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">WhatsApp</span><span>{selectedCustomer.whatsapp}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Minat</span><span>{selectedCustomer.interest || "TBA"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Sumber</span><span>{selectedCustomer.source || "TBA"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Consent</span><ConsentBadge value={selectedCustomer.consent} /></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Last Contact</span><span>{selectedCustomer.lastContact || "TBA"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Purchases</span><span>{selectedCustomer.totalPurchases}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">CLV</span><span className="font-medium">{formatCurrency(selectedCustomer.clv)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Rekomendasi Formula</span><span>{selectedCustomer.recommendedFormula || "TBA"}</span></div>
                    {selectedCustomer.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-muted-foreground text-xs mb-1">Catatan:</p>
                        <p>{selectedCustomer.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Log Interaction Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>📝 Log Interaction</CardTitle>
                    <CardDescription>Catat interaksi baru untuk {selectedCustomer.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={submitInteraction}>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Tipe" value={interactionForm.type} onChange={(v) => setInteractionForm({ ...interactionForm, type: v })} placeholder="follow_up / purchase" />
                        <Field label="Channel" value={interactionForm.channel} onChange={(v) => setInteractionForm({ ...interactionForm, channel: v })} />
                      </div>
                      <Field label="Value (Rp)" type="number" value={interactionForm.value} onChange={(v) => setInteractionForm({ ...interactionForm, value: v })} />
                      <Field label="Follow-up Date" type="date" value={interactionForm.followUpDate} onChange={(v) => setInteractionForm({ ...interactionForm, followUpDate: v })} />
                      <div className="grid gap-2">
                        <Label>Summary</Label>
                        <Textarea value={interactionForm.summary} onChange={(e) => setInteractionForm({ ...interactionForm, summary: e.target.value })} placeholder="Ringkasan interaksi..." required />
                      </div>
                      <Button type="submit" className="w-full">Record Interaction</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Interaction Timeline */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Interaction Timeline</CardTitle>
                      <CardDescription>
                        {customerInteractions.length} interaction{customerInteractions.length !== 1 ? "s" : ""} tercatat
                      </CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => selectCustomer(selectedCustomer)}>
                      {loadingInteractions ? "Memuat..." : "Refresh"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingInteractions ? (
                    <p className="text-sm text-muted-foreground">Memuat interactions...</p>
                  ) : customerInteractions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada interaction tercatat untuk customer ini.</p>
                  ) : customerInteractions.map((ix) => (
                    <div key={ix.interactionId} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">{ix.type}</div>
                        <Badge variant="outline">{ix.channel}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{ix.summary || "TBA"}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>🕐 {ix.timestamp}</span>
                        {ix.value > 0 && <span>💰 {formatCurrency(ix.value)}</span>}
                        {ix.followUpDate && ix.followUpDate !== "TBA" && <span>📅 Follow-up: {ix.followUpDate}</span>}
                        <span>👤 {ix.pic}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════
            TAB 4: SEGMENTS
        ════════════════════════════════════════════ */}
        <TabsContent value="segments" className="space-y-4">
          {/* Segment Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            {(["vip", "loyal", "regular", "new"] as const).map((seg) => {
              const meta = SEGMENT_META[seg];
              const segData = segments?.segments?.[seg];
              return (
                <Card key={seg} className={seg === "vip" ? "border-purple-500/40" : seg === "new" ? "border-amber-500/40" : ""}>
                  <CardHeader className="pb-2">
                    <CardDescription>{meta.icon} {meta.label} Customers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{segData?.count || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Criteria: {segData?.criteria || "—"}</p>
                    <p className="text-xs text-muted-foreground">CLV: {formatCurrency(segData?.totalClv || 0)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Per-segment tables */}
          {(["vip", "loyal", "regular", "new"] as const).map((seg) => {
            const meta = SEGMENT_META[seg];
            const segData = segments?.segments?.[seg];
            const customers = segData?.customers || [];
            return (
              <Card key={seg}>
                <CardHeader>
                  <CardTitle>{meta.icon} {meta.label} Customers ({segData?.count || 0})</CardTitle>
                  <CardDescription>Criteria: {segData?.criteria || "—"} · Total CLV: {formatCurrency(segData?.totalClv || 0)}</CardDescription>
                </CardHeader>
                <CardContent>
                  {customers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada customer di segmen ini.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/60 text-left">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">WhatsApp</th>
                            <th className="p-3">Minat</th>
                            <th className="p-3 text-right">Purchases</th>
                            <th className="p-3 text-right">CLV</th>
                            <th className="p-3">Last Contact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customers.map((c, i) => (
                            <tr key={c.id} className="border-t hover:bg-muted/30">
                              <td className="p-3">{i + 1}</td>
                              <td className="p-3">
                                <div className="font-medium">{c.name}</div>
                                <div className="text-xs text-muted-foreground">{c.id}</div>
                              </td>
                              <td className="p-3">{c.whatsapp}</td>
                              <td className="p-3">{c.interest || "TBA"}</td>
                              <td className="p-3 text-right">{c.totalPurchases}</td>
                              <td className="p-3 text-right font-medium">{formatCurrency(c.clv)}</td>
                              <td className="p-3">{c.lastContact || "TBA"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Status bar */}
      {status && (
        <div className="text-xs text-muted-foreground text-center py-2">{status}</div>
      )}
    </div>
  );
}

// ── Shared Components ──

function Metric({ title, value, tone = "default" }: { title: string; value: string | number; tone?: "default" | "purple" | "blue" | "amber" | "red" | "orange" }) {
  const cls = {
    default: "",
    purple: "border-purple-500/40 bg-purple-500/10",
    blue: "border-blue-500/40 bg-blue-500/10",
    amber: "border-amber-500/40 bg-amber-500/10",
    red: "border-red-500/40 bg-red-500/10",
    orange: "border-orange-500/40 bg-orange-500/10",
  }[tone];
  return (
    <Card className={cls}>
      <CardHeader className="pb-2"><CardDescription>{title}</CardDescription></CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} />
    </div>
  );
}

function SegmentBadge({ segment }: { segment: string }) {
  const meta = SEGMENT_META[segment] || { color: "bg-gray-500", label: segment, icon: "?" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white ${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

function ConsentBadge({ value }: { value: string }) {
  const v = value?.toLowerCase();
  if (v === "yes") return <Badge className="bg-emerald-600 text-white">Ya</Badge>;
  if (v === "no") return <Badge variant="destructive">Tidak</Badge>;
  return <Badge variant="outline">TBA</Badge>;
}
