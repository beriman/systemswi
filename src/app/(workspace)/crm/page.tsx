"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CrmContact = {
  id: string;
  type: "customer" | "tenant" | "sponsor";
  name: string;
  whatsapp: string;
  email: string;
  segment: string;
  status: string;
  source: string;
  totalValue: number;
  lastContact: string;
  followUpDate: string;
  notes: string;
  eventId?: string;
  boothNumber?: string;
  tier?: string;
  paymentStatus?: string;
};

type CrmSummary = {
  totalContacts: number;
  customers: number;
  tenants: number;
  sponsors: number;
  overdueFollowUps: number;
  dueTodayFollowUps: number;
  upcomingFollowUps: number;
  totalValue: number;
  byType: Record<string, number>;
  bySegment: Record<string, number>;
  byStatus: Record<string, number>;
};

type FollowUpGroup = { overdue: CrmContact[]; dueToday: CrmContact[]; upcoming: CrmContact[] };

type CrmPayload = {
  success?: boolean;
  sourceStatus?: string;
  warning?: string;
  contacts: CrmContact[];
  summary: CrmSummary;
  followUps: FollowUpGroup;
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v || 0);

const CONTACT_TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  customer: { label: "Customer", color: "bg-blue-600", icon: "👤" },
  tenant: { label: "Tenant", color: "bg-purple-600", icon: "🏪" },
  sponsor: { label: "Sponsor", color: "bg-amber-600", icon: "🤝" },
};

const STATUS_META: Record<string, { label: string; variant: string }> = {
  paid: { label: "Lunas", variant: "default" as const },
  pending: { label: "Pending", variant: "outline" as const },
  partial: { label: "Partial", variant: "secondary" as const },
  "invoice-sent": { label: "Invoice", variant: "secondary" as const },
  cancelled: { label: "Batal", variant: "destructive" as const },
  active: { label: "Aktif", variant: "default" as const },
  new: { label: "Baru", variant: "outline" as const },
  regular: { label: "Reguler", variant: "outline" as const },
  loyal: { label: "Loyal", variant: "default" as const },
  vip: { label: "VIP", variant: "default" as const },
  tenant: { label: "Tenant", variant: "secondary" as const },
  sponsor: { label: "Sponsor", variant: "secondary" as const },
  overdue: { label: "Overdue", variant: "destructive" as const },
  due_today: { label: "Hari Ini", variant: "secondary" as const },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: status, variant: "outline" as const };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function TypeBadge({ type }: { type: string }) {
  const meta = CONTACT_TYPE_META[type] || { label: type, color: "bg-gray-500", icon: "❓" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white ${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

export default function CrmPage() {
  const [data, setData] = useState<CrmPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Memuat Unified CRM...");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "customer" | "tenant" | "sponsor">("all");

  // WhatsApp composer state
  const [waContact, setWaContact] = useState<CrmContact | null>(null);
  const [waMessage, setWaMessage] = useState("");
  const [waPreview, setWaPreview] = useState<{ waLink: string | null; note: string } | null>(null);
  const [waSending, setWaSending] = useState(false);

  // Communication log form
  const [logContact, setLogContact] = useState<CrmContact | null>(null);
  const [logType, setLogType] = useState("follow_up");
  const [logChannel, setLogChannel] = useState("WhatsApp");
  const [logNotes, setLogNotes] = useState("");
  const [logFollowUp, setLogFollowUp] = useState("");

  const contacts = useMemo(() => {
    const needle = query.toLowerCase();
    return (data?.contacts || []).filter((c) => {
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      return [c.name, c.whatsapp, c.email, c.segment, c.notes, c.boothNumber, c.tier]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [data, query, typeFilter]);

  async function loadCrm() {
    setLoading(true);
    try {
      const res = await fetch("/api/crm", { cache: "no-store" });
      const payload: CrmPayload = await res.json();
      setData(payload);
      setStatus(payload.warning || `CRM siap — ${payload.summary.totalContacts} kontak dari ${payload.contacts.length} total`);
    } catch (error) {
      setStatus(`Gagal memuat CRM: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCrm(); }, []);

  const handleWaPreview = useCallback(async () => {
    if (!waContact || !waMessage.trim()) return;
    setWaSending(true);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "whatsapp-preview",
          contactId: waContact.id,
          contactName: waContact.name,
          whatsapp: waContact.whatsapp,
          message: waMessage,
          type: "manual",
        }),
      });
      const payload = await res.json();
      setWaPreview({ waLink: payload.waLink, note: payload.note });
    } catch (error) {
      setWaPreview({ waLink: null, note: `Gagal: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setWaSending(false);
    }
  }, [waContact, waMessage]);

  const handleLogCommunication = useCallback(async () => {
    if (!logContact) return;
    try {
      await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log-communication",
          contactId: logContact.id,
          contactName: logContact.name,
          type: logType,
          channel: logChannel,
          summary: logNotes,
          followUpDate: logFollowUp,
        }),
      });
      setStatus(`✅ Communication logged untuk ${logContact.name}`);
      setLogContact(null);
      setLogNotes("");
      setLogFollowUp("");
    } catch (error) {
      setStatus(`⚠️ Gagal log: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [logContact, logType, logChannel, logNotes, logFollowUp]);

  const selectContact = (c: CrmContact) => {
    setWaContact(c);
    setWaPreview(null);
    setWaMessage("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">CRM Terpadu</p>
          <h1 className="text-3xl font-bold">🤝 Unified CRM & Communication Hub</h1>
          <p className="text-muted-foreground">
            Customer + Tenant + Sponsor dalam satu tampilan. WhatsApp preview & communication log.
          </p>
        </div>
        <Button onClick={loadCrm} disabled={loading}>{loading ? "Memuat..." : "Refresh CRM"}</Button>
      </div>

      {data?.sourceStatus === "degraded" || data?.sourceStatus === "error" ? (
        <Card className="border-orange-500/40 bg-orange-500/10">
          <CardHeader>
            <CardTitle>Google Workspace perlu re-auth</CardTitle>
            <CardDescription>{data.warning || status}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
        <Metric title="Total Kontak" value={data?.summary.totalContacts || 0} />
        <Metric title="Customer" value={data?.summary.customers || 0} />
        <Metric title="Tenant" value={data?.summary.tenants || 0} />
        <Metric title="Sponsor" value={data?.summary.sponsors || 0} />
        <Metric title="Follow-up Overdue" value={data?.summary.overdueFollowUps || 0} tone="red" />
        <Metric title="Follow-up Hari Ini" value={data?.summary.dueTodayFollowUps || 0} tone="orange" />
        <Metric title="Total Value" value={formatCurrency(data?.summary.totalValue || 0)} />
      </div>

      {/* Segment Distribution */}
      {data?.summary.bySegment && Object.keys(data.summary.bySegment).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Distribusi Kontak per Segment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(data.summary.bySegment).map(([seg, count]) => {
                const pct = data?.summary.totalContacts ? Math.round((count / data.summary.totalContacts) * 100) : 0;
                return (
                  <div key={seg} className="flex-1 min-w-[100px]">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium">{seg}</span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts">📋 Semua Kontak</TabsTrigger>
          <TabsTrigger value="followups">⏰ Follow-ups</TabsTrigger>
          <TabsTrigger value="whatsapp">💬 WhatsApp Composer</TabsTrigger>
          <TabsTrigger value="log">📝 Communication Log</TabsTrigger>
        </TabsList>

        {/* TAB: All Contacts */}
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Directory</CardTitle>
              <CardDescription>{status}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 flex-wrap">
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, WA, email, segment..." className="max-w-sm" />
                <div className="flex gap-1">
                  {(["all", "customer", "tenant", "sponsor"] as const).map((t) => (
                    <Button key={t} size="sm" variant={typeFilter === t ? "default" : "outline"} onClick={() => setTypeFilter(t)}>
                      {t === "all" ? "Semua" : CONTACT_TYPE_META[t]?.label || t}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-left">
                    <tr>
                      <th className="p-3">Kontak</th>
                      <th className="p-3">Tipe</th>
                      <th className="p-3">Segment</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Value</th>
                      <th className="p-3">Follow-up</th>
                      <th className="p-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.length === 0 ? (
                      <tr><td className="p-6 text-center text-muted-foreground" colSpan={7}>Belum ada data / source degraded.</td></tr>
                    ) : contacts.map((c) => (
                      <tr key={`${c.type}-${c.id}`} className="border-t hover:bg-muted/30">
                        <td className="p-3">
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.whatsapp} · {c.email}</div>
                        </td>
                        <td className="p-3"><TypeBadge type={c.type} /></td>
                        <td className="p-3"><Badge variant="outline">{c.segment}</Badge></td>
                        <td className="p-3"><StatusBadge status={c.status} /></td>
                        <td className="p-3 text-right">{formatCurrency(c.totalValue)}</td>
                        <td className="p-3 text-xs">{c.followUpDate || "—"}</td>
                        <td className="p-3">
                          <Button size="sm" variant="outline" onClick={() => { selectContact(c); }}>💬 WA</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Follow-ups */}
        <TabsContent value="followups" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <FollowUpCard title="🔴 Overdue" contacts={data?.followUps.overdue || []} tone="red" onSelect={selectContact} />
            <FollowUpCard title="🟡 Hari Ini" contacts={data?.followUps.dueToday || []} tone="orange" onSelect={selectContact} />
            <FollowUpCard title="🔵 7 Hari Ke Depan" contacts={data?.followUps.upcoming || []} tone="blue" onSelect={selectContact} />
          </div>
        </TabsContent>

        {/* TAB: WhatsApp Composer */}
        <TabsContent value="whatsapp" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>💬 Compose WhatsApp</CardTitle>
                <CardDescription>
                  Pilih kontak dari tabel atau ketik manual. Preview pesan sebelum kirim via wa.me.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {waContact ? (
                  <div className="rounded-lg border p-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{waContact.name}</div>
                        <div className="text-xs text-muted-foreground">{waContact.whatsapp} · <TypeBadge type={waContact.type} /></div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setWaContact(null)}>✕</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Pilih kontak dari tabel (klik 💬 WA) atau isi manual:</p>
                )}
                <div className="grid gap-2">
                  <Label>Nama</Label>
                  <Input value={waContact?.name || ""} onChange={(e) => setWaContact({ ...(waContact || blankContact()), name: e.target.value })} placeholder="Nama kontak" />
                </div>
                <div className="grid gap-2">
                  <Label>WhatsApp</Label>
                  <Input value={waContact?.whatsapp || ""} onChange={(e) => setWaContact({ ...(waContact || blankContact()), whatsapp: e.target.value })} placeholder="62812..." />
                </div>
                <div className="grid gap-2">
                  <Label>Pesan</Label>
                  <Textarea
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    placeholder="Halo {nama}, terima kasih sudah tertaq dengan SWI..."
                    rows={5}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["Halo, terima kasih sudah menghubungi SWI! 🌿", "Info terbaru: Fragrantions Expo 2026 akan segera hadir! 🎉", "Pembayaran Anda sudah kami terima. Terima kasih! ✅"].map((t, i) => (
                    <Button key={i} size="sm" variant="outline" onClick={() => setWaMessage(t)}>Template {i + 1}</Button>
                  ))}
                </div>
                <Button onClick={handleWaPreview} disabled={waSending || !waMessage.trim()} className="w-full">
                  {waSending ? "Generating..." : "Preview & Generate Link"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview & Send</CardTitle>
                <CardDescription>Preview pesan dan buka WhatsApp via wa.me link.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {waPreview ? (
                  <>
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>📱</span>
                        <span>Ke: {waContact?.name} ({waContact?.whatsapp})</span>
                      </div>
                      <div className="rounded-lg bg-white dark:bg-gray-800 p-3 text-sm whitespace-pre-wrap border">
                        {waMessage}
                      </div>
                      <p className="text-xs text-muted-foreground">{waPreview.note}</p>
                    </div>
                    {waPreview.waLink ? (
                      <div className="flex gap-2">
                        <a href={waPreview.waLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button className="w-full bg-green-600 hover:bg-green-700">📱 Buka WhatsApp</Button>
                        </a>
                        <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(waPreview.waLink || ""); }}>Copy Link</Button>
                      </div>
                    ) : (
                      <p className="text-sm text-orange-500">{waPreview.note}</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                    Pilih kontak dan ketik pesan, lalu klik Preview.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Communication Log */}
        <TabsContent value="log" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📝 Log Communication</CardTitle>
              <CardDescription>Catat interaksi manual (WhatsApp call, meeting, email) untuk audit trail.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {logContact ? (
                <div className="rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{logContact.name}</div>
                      <div className="text-xs text-muted-foreground">{logContact.whatsapp} · <TypeBadge type={logContact.type} /></div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setLogContact(null)}>✕</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Pilih kontak dari tabel Follow-ups atau Contact Directory.</p>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Tipe</Label>
                  <select className="rounded-md border bg-background px-3 py-2" value={logType} onChange={(e) => setLogType(e.target.value)}>
                    <option value="follow_up">Follow-up</option>
                    <option value="purchase">Purchase</option>
                    <option value="meeting">Meeting</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Channel</Label>
                  <select className="rounded-md border bg-background px-3 py-2" value={logChannel} onChange={(e) => setLogChannel(e.target.value)}>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                    <option value="Call">Call</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Catatan</Label>
                <Textarea value={logNotes} onChange={(e) => setLogNotes(e.target.value)} placeholder="Ringkasan interaksi..." rows={3} />
              </div>
              <div className="grid gap-2">
                <Label>Follow-up Date (optional)</Label>
                <Input type="date" value={logFollowUp} onChange={(e) => setLogFollowUp(e.target.value)} />
              </div>
              <Button onClick={handleLogCommunication} disabled={!logContact} className="w-full">
                Log Communication
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function blankContact(): CrmContact {
  return { id: "", type: "customer", name: "", whatsapp: "", email: "", segment: "", status: "", source: "", totalValue: 0, lastContact: "", followUpDate: "", notes: "" };
}

function Metric({ title, value, tone = "default" }: { title: string; value: string | number; tone?: "default" | "red" | "orange" }) {
  const cls = tone === "red" ? "border-red-500/40 bg-red-500/10" : tone === "orange" ? "border-orange-500/40 bg-orange-500/10" : "";
  return (
    <Card className={cls}>
      <CardHeader className="pb-2"><CardDescription>{title}</CardDescription></CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  );
}

function FollowUpCard({ title, contacts, tone, onSelect }: { title: string; contacts: CrmContact[]; tone: string; onSelect: (c: CrmContact) => void }) {
  const borderCls = tone === "red" ? "border-red-500/30" : tone === "orange" ? "border-orange-500/30" : "border-blue-500/30";
  return (
    <Card className={borderCls}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title} ({contacts.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada follow-up.</p>
        ) : contacts.map((c) => (
          <div key={`${c.type}-${c.id}-${c.followUpDate}`} className="rounded-lg border p-3 hover:bg-muted/30">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-medium text-sm">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.whatsapp} · <TypeBadge type={c.type} /></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{c.followUpDate}</span>
                <Button size="sm" variant="outline" onClick={() => onSelect(c)}>💬</Button>
              </div>
            </div>
            {c.notes && <p className="mt-1 text-xs text-muted-foreground">{c.notes}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
