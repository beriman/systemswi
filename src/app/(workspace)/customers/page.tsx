"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

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

type CustomerPayload = {
  source?: string;
  sourceStatus?: string;
  warning?: string;
  customers: Customer[];
  interactions: Interaction[];
  summary: {
    totalCustomers: number;
    consentedCustomers: number;
    needsConsentReview: number;
    totalClv: number;
    bySegment: Record<string, number>;
    recentInteractions: Interaction[];
    followUps: FollowUp[];
    followUpSummary: {
      overdue: number;
      dueToday: number;
      upcoming7Days: number;
    };
  };
};

const emptyForm = {
  name: "",
  whatsapp: "",
  interest: "",
  source: "WhatsApp",
  consent: "TBA",
  totalPurchases: "0",
  clv: "0",
  recommendedFormula: "TBA",
  notes: "",
  followUpDate: "",
};

const emptyInteractionForm = {
  customerId: "",
  whatsapp: "",
  type: "follow_up",
  channel: "WhatsApp",
  summary: "",
  value: "0",
  followUpDate: "",
  pic: "HemuHemu/OWL",
};

const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
}).format(value || 0);

export default function CustomersPage() {
  const [data, setData] = useState<CustomerPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Memuat Customer CRM dari Google Sheets...");
  const [form, setForm] = useState(emptyForm);
  const [interactionForm, setInteractionForm] = useState(emptyInteractionForm);
  const [query, setQuery] = useState("");

  const customers = useMemo(() => {
    const needle = query.toLowerCase();
    return (data?.customers || []).filter((customer) =>
      [customer.name, customer.whatsapp, customer.interest, customer.source, customer.segment]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [data, query]);

  async function loadCustomers() {
    setLoading(true);
    try {
      const response = await fetch("/api/customers", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Gagal memuat customer CRM");
      setData(payload);
      setStatus(payload.warning || `Customer CRM siap — source: ${payload.source || "SQLite + Google Sheets"}`);
    } catch (error) {
      setStatus(`Gagal memuat CRM: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function submitCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Menyinkronkan customer ke Google Sheets...");
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert-customer",
          ...form,
          totalPurchases: Number(form.totalPurchases || 0),
          clv: Number(form.clv || 0),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || payload?.details || "Gagal menyimpan customer");
      setStatus(`✅ Customer tersinkron: ${payload.customer?.name}. Audit: ${payload.auditStatus}`);
      setForm(emptyForm);
      await loadCustomers();
    } catch (error) {
      setStatus(`⚠️ ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function submitInteraction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Mencatat interaction/follow-up ke Google Sheets...");
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record-interaction",
          ...interactionForm,
          value: Number(interactionForm.value || 0),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || payload?.details || "Gagal menyimpan interaction");
      setStatus(`✅ Interaction tercatat: ${payload.interactionId}. Audit: ${payload.auditStatus}`);
      setInteractionForm(emptyInteractionForm);
      await loadCustomers();
    } catch (error) {
      setStatus(`⚠️ ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">CRM / WhatsApp Sync</p>
          <h1 className="text-3xl font-bold">👥 Customer Database</h1>
          <p className="text-muted-foreground">
            Sinkronisasi customer intake dari WhatsApp/manual ke Google Sheets dengan guardrail consent dan follow-up.
          </p>
        </div>
        <Button onClick={loadCustomers} disabled={loading}>{loading ? "Memuat..." : "Refresh Sheets"}</Button>
      </div>

      {data?.sourceStatus === "degraded" || data?.sourceStatus === "blocked" ? (
        <Card className="border-orange-500/40 bg-orange-500/10">
          <CardHeader>
            <CardTitle>Google Workspace perlu re-auth</CardTitle>
            <CardDescription>{data.warning || status}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Metric title="Total Customer" value={data?.summary.totalCustomers || 0} />
        <Metric title="Consent Ya" value={data?.summary.consentedCustomers || 0} />
        <Metric title="Perlu Review Consent" value={data?.summary.needsConsentReview || 0} tone="orange" />
        <Metric title="Total CLV" value={formatCurrency(data?.summary.totalClv || 0)} />
        <Metric title="Follow-up Overdue" value={data?.summary.followUpSummary?.overdue || 0} tone="orange" />
        <Metric title="Follow-up 7 Hari" value={data?.summary.followUpSummary?.upcoming7Days || 0} />
      </div>

      {/* Segment Distribution */}
      {data?.summary.bySegment && Object.keys(data.summary.bySegment).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Distribusi Segment Customer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(data.summary.bySegment).map(([segment, count]) => {
                const colors: Record<string, string> = {
                  vip: "bg-purple-500", loyal: "bg-emerald-500", regular: "bg-blue-500", new: "bg-amber-500",
                };
                const pct = data?.summary.totalCustomers ? Math.round((count / data.summary.totalCustomers) * 100) : 0;
                return (
                  <div key={segment} className="flex-1 min-w-[100px]">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium">{segment}</span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${colors[segment] || "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <Card>
          <CardHeader>
            <CardTitle>Input / Update Customer</CardTitle>
            <CardDescription>Isi data terverifikasi saja. Jika consent belum jelas, pilih TBA.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submitCustomer}>
              <Field label="Nama" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
              <Field label="WhatsApp" value={form.whatsapp} onChange={(value) => setForm({ ...form, whatsapp: value })} placeholder="62812..." required />
              <Field label="Minat" value={form.interest} onChange={(value) => setForm({ ...form, interest: value })} placeholder="Kelas parfumer / produk / Fragrantions" />
              <Field label="Sumber" value={form.source} onChange={(value) => setForm({ ...form, source: value })} />
              <div className="grid gap-2">
                <Label>Consent follow-up</Label>
                <select className="rounded-md border bg-background px-3 py-2" value={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.value })}>
                  <option value="TBA">TBA / belum diverifikasi</option>
                  <option value="yes">Ya</option>
                  <option value="no">Tidak</option>
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Total Purchase" type="number" value={form.totalPurchases} onChange={(value) => setForm({ ...form, totalPurchases: value })} />
                <Field label="CLV (Rp)" type="number" value={form.clv} onChange={(value) => setForm({ ...form, clv: value })} />
              </div>
              <Field label="Rekomendasi Formula" value={form.recommendedFormula} onChange={(value) => setForm({ ...form, recommendedFormula: value })} />
              <div className="grid gap-2">
                <Label>Catatan</Label>
                <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Preferensi aroma, status follow-up, bukti consent" />
              </div>
              <Button type="submit" className="w-full">Sync Customer</Button>
            </form>
          </CardContent>
        </Card>

          <Card>
            <CardHeader>
              <CardTitle>Catat Interaction / Follow-up</CardTitle>
              <CardDescription>Gunakan untuk follow-up tenant/customer, purchase, atau WhatsApp manual. Write tetap ke Customer_Interactions + audit.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submitInteraction}>
                <div className="grid gap-2">
                  <Label>Customer</Label>
                  <select
                    className="rounded-md border bg-background px-3 py-2"
                    value={interactionForm.customerId}
                    onChange={(event) => setInteractionForm({ ...interactionForm, customerId: event.target.value })}
                  >
                    <option value="">Pilih customer atau isi WhatsApp</option>
                    {(data?.customers || []).map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name} — {customer.whatsapp}</option>
                    ))}
                  </select>
                </div>
                <Field label="WhatsApp fallback" value={interactionForm.whatsapp} onChange={(value) => setInteractionForm({ ...interactionForm, whatsapp: value })} placeholder="Jika customer belum dipilih" />
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Tipe" value={interactionForm.type} onChange={(value) => setInteractionForm({ ...interactionForm, type: value })} placeholder="follow_up / purchase" />
                  <Field label="Channel" value={interactionForm.channel} onChange={(value) => setInteractionForm({ ...interactionForm, channel: value })} />
                </div>
                <Field label="Value (Rp, optional)" type="number" value={interactionForm.value} onChange={(value) => setInteractionForm({ ...interactionForm, value: value })} />
                <Field label="Follow-up berikutnya" type="date" value={interactionForm.followUpDate} onChange={(value) => setInteractionForm({ ...interactionForm, followUpDate: value })} />
                <div className="grid gap-2">
                  <Label>Summary</Label>
                  <Textarea value={interactionForm.summary} onChange={(event) => setInteractionForm({ ...interactionForm, summary: event.target.value })} placeholder="Ringkasan interaksi, kebutuhan, atau next step" required />
                </div>
                <Button type="submit" className="w-full">Record Interaction</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Master</CardTitle>
              <CardDescription>{status}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, WA, minat, sumber..." />
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-left">
                    <tr>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Segment</th>
                      <th className="p-3">Minat</th>
                      <th className="p-3">Consent</th>
                      <th className="p-3 text-right">CLV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr><td className="p-6 text-center text-muted-foreground" colSpan={5}>Belum ada data / source degraded.</td></tr>
                    ) : customers.map((customer) => (
                      <tr key={customer.id} className="border-t">
                        <td className="p-3">
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-xs text-muted-foreground">{customer.whatsapp} · {customer.id}</div>
                        </td>
                        <td className="p-3"><Badge variant="outline">{customer.segment}</Badge></td>
                        <td className="p-3">{customer.interest || "TBA"}</td>
                        <td className="p-3"><ConsentBadge value={customer.consent} /></td>
                        <td className="p-3 text-right">{formatCurrency(customer.clv)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow-up Tracker</CardTitle>
              <CardDescription>Prioritas dari Customer_Interactions berdasarkan tanggal follow-up. Tidak mengirim pesan otomatis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.summary.followUps || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada follow-up date tercatat.</p>
              ) : data?.summary.followUps.map((item) => (
                <div key={`${item.interactionId}-${item.dueDate}`} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.channel} · PIC {item.pic}</div>
                    </div>
                    <FollowUpBadge status={item.status} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.summary || "TBA"}</p>
                  <p className="text-xs text-muted-foreground">Due: {item.dueDate} · type: {item.type}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Interactions</CardTitle>
              <CardDescription>Riwayat intake/follow-up dari Customer_Interactions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.summary.recentInteractions || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada interaction tercatat.</p>
              ) : data?.summary.recentInteractions.map((interaction) => (
                <div key={interaction.interactionId} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{interaction.name}</div>
                    <Badge variant="outline">{interaction.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{interaction.summary || "TBA"}</p>
                  <p className="text-xs text-muted-foreground">{interaction.timestamp} · follow-up: {interaction.followUpDate}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ title, value, tone = "default" }: { title: string; value: string | number; tone?: "default" | "orange" }) {
  return (
    <Card className={tone === "orange" ? "border-orange-500/40 bg-orange-500/10" : undefined}>
      <CardHeader className="pb-2"><CardDescription>{title}</CardDescription></CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} />
    </div>
  );
}

function ConsentBadge({ value }: { value: string }) {
  const normalized = value?.toLowerCase();
  if (normalized === "yes") return <Badge className="bg-emerald-600">Ya</Badge>;
  if (normalized === "no") return <Badge variant="destructive">Tidak</Badge>;
  return <Badge variant="outline">TBA</Badge>;
}

function FollowUpBadge({ status }: { status: FollowUp["status"] }) {
  if (status === "overdue") return <Badge variant="destructive">Overdue</Badge>;
  if (status === "due_today") return <Badge className="bg-orange-600">Hari ini</Badge>;
  return <Badge variant="outline">Upcoming</Badge>;
}
