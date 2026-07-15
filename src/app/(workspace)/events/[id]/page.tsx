"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface EventDetail {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  description: string;
  pic: string;
  instagram: string;
  startDate: string;
  endDate: string;
  location: string;
  venue: string;
  budget: number;
  actualCost: number;
  revenue: number;
  tenantCount: number;
  sponsorCount: number;
  attendeeTarget: number;
  attendeeActual: number;
  notes: string;
  created: string;
  updated: string;
}

interface BudgetItem {
  id: string;
  category: string;
  itemName: string;
  plannedAmount: number;
  actualAmount: number;
  notes: string;
  created: string;
}

interface TimelineItem {
  id: string;
  phase: string;
  milestone: string;
  dueDate: string;
  completed: boolean;
  completedDate: string;
  notes: string;
  created: string;
}

interface TenantItem {
  id: string;
  brandName: string;
  contactPerson: string;
  boothNumber: string;
  packageType: string;
  fee: number;
  paymentStatus: string;
  paymentAmount: number;
}

interface SponsorItem {
  id: string;
  companyName: string;
  contactPerson: string;
  tier: string;
  sponsorshipAmount: number;
  inKindValue: number;
  paymentStatus: string;
}

interface CloseoutExpense {
  id: string;
  date: string;
  submitterName: string;
  category: string;
  description: string;
  amount: number;
  proofUrl: string;
  status: string;
  division: string;
  paymentMethod: string;
  shareholderDebtFlag: boolean;
}

interface CloseoutGovernanceAudit {
  logId: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  amount: number;
  division: string;
  before: string;
  after: string;
  reason: string;
  proofUrl: string;
  sourceModule: string;
}

interface CloseoutPurchaseOrder {
  id: string;
  date: string;
  supplierName: string;
  itemName: string;
  total: number;
  status: string;
  expectedDate: string;
  proofUrl: string;
  notes: string;
}

interface CloseoutSummary {
  plannedBudget: number;
  actualExpense: number;
  budgetVariance: number;
  budgetVariancePct: number;
  tenantRevenuePaid: number;
  tenantRevenueExpected: number;
  sponsorRevenuePaid: number;
  sponsorRevenueExpected: number;
  totalRevenuePaid: number;
  totalRevenueExpected: number;
  receivable: number;
  payable: number;
  payableFromExpenses?: number;
  payableFromPurchaseOrders?: number;
  purchaseOrderPayableCount?: number;
  finalProfitLoss: number;
  expensesWithoutProof: number;
  expensesNeedsProof: number;
  personalPaidExpenses: number;
  documentationStatus: string;
  mediaCount: number;
  mediaProofUrls: string[];
  lessonsLearned: string;
  governanceAuditCount: number;
  governanceAuditTrail: CloseoutGovernanceAudit[];
  expenseByCategory: { category: string; amount: number }[];
  expenses: CloseoutExpense[];
  purchaseOrders?: CloseoutPurchaseOrder[];
}

interface EventDetailData {
  event: EventDetail;
  budget: BudgetItem[];
  tenants: TenantItem[];
  sponsors: SponsorItem[];
  timeline: TimelineItem[];
  closeout?: CloseoutSummary;
}

interface EventMediaItem {
  id: string;
  type: string;
  title?: string;
  url?: string;
  caption?: string;
  source?: string;
  featured?: string;
  created?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    planning: "bg-blue-100 text-blue-700",
    "open-registration": "bg-green-100 text-green-700",
    ongoing: "bg-purple-100 text-purple-700",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
    postponed: "bg-yellow-100 text-yellow-700",
  };
  return styles[status] || "bg-gray-100 text-gray-700";
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    festival: "🎪 Festival",
    workshop: "🛠️ Workshop",
    webinar: "💻 Webinar",
    "pop-up": "🛍️ Pop-up",
    bazaar: "🏪 Bazaar",
    conference: "🎤 Conference",
    other: "📌 Lainnya",
  };
  return labels[type] || type;
}

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = use(params);
  const [data, setData] = useState<EventDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "timeline" | "budget" | "tenants" | "sponsors" | "media" | "closeout">("overview");
  const [todayMs] = useState(() => Date.now());

  // Timeline form
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [timelineSaving, setTimelineSaving] = useState(false);
  const [timelineMsg, setTimelineMsg] = useState<string | null>(null);

  // Budget form
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetMsg, setBudgetMsg] = useState<string | null>(null);

  // Media state
  const [mediaItems, setMediaItems] = useState<EventMediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [mediaSaving, setMediaSaving] = useState(false);
  const [mediaMsg, setMediaMsg] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Event tidak ditemukan");
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load media for this event
  const fetchMedia = useCallback(async () => {
    setMediaLoading(true);
    try {
      const res = await fetch(`/api/events/media?eventId=${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setMediaItems(json.media || []);
    } catch {
      setMediaItems([]);
    } finally {
      setMediaLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (tab !== "media") return;
    const timeout = window.setTimeout(() => {
      void fetchMedia();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [tab, fetchMedia]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchEvent();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [fetchEvent]);

  async function handleAddTimeline(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTimelineSaving(true);
    setTimelineMsg(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      phase: String(form.get("phase") || ""),
      milestone: String(form.get("milestone") || ""),
      dueDate: String(form.get("dueDate") || ""),
      notes: String(form.get("notes") || ""),
    };
    if (!payload.milestone) {
      setTimelineMsg("Milestone wajib diisi.");
      setTimelineSaving(false);
      return;
    }
    try {
      const res = await fetch(`/api/events/${id}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setTimelineMsg("✅ Milestone ditambahkan!");
      setShowTimelineForm(false);
      e.currentTarget.reset();
      await fetchEvent();
    } catch (err) {
      setTimelineMsg(`❌ Gagal: ${String(err).replace(/^Error:\s*/, "")}`);
    } finally {
      setTimelineSaving(false);
    }
  }

  async function handleToggleTimeline(timelineId: string, completed: boolean) {
    try {
      const res = await fetch(`/api/events/${id}/timeline`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: timelineId, completed: !completed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchEvent();
    } catch (err) {
      setTimelineMsg(`❌ Gagal update: ${String(err)}`);
    }
  }

  async function handleAddBudget(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBudgetSaving(true);
    setBudgetMsg(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      category: String(form.get("category") || ""),
      itemName: String(form.get("itemName") || ""),
      plannedAmount: Number(form.get("plannedAmount") || 0),
      actualAmount: Number(form.get("actualAmount") || 0),
      notes: String(form.get("notes") || ""),
    };
    if (!payload.itemName) {
      setBudgetMsg("Nama item wajib diisi.");
      setBudgetSaving(false);
      return;
    }
    try {
      const res = await fetch(`/api/events/${id}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setBudgetMsg("✅ Item budget ditambahkan!");
      setShowBudgetForm(false);
      e.currentTarget.reset();
      await fetchEvent();
    } catch (err) {
      setBudgetMsg(`❌ Gagal: ${String(err).replace(/^Error:\s*/, "")}`);
    } finally {
      setBudgetSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-muted-foreground mb-2">{error}</p>
        <Link href="/events"><Button variant="outline" className="mt-4">← Kembali ke Events</Button></Link>
      </div>
    );
  }

  if (!data) return null;

  const { event, budget, tenants, sponsors, timeline } = data;
  const closeout = data.closeout;
  const budgetUsed = event.budget > 0 ? Math.round((event.actualCost / event.budget) * 100) : 0;
  const daysUntilEvent = Math.ceil((new Date(event.startDate).getTime() - todayMs) / (1000 * 60 * 60 * 24));
  const totalPlannedBudget = budget.reduce((s, b) => s + b.plannedAmount, 0);
  const totalActualBudget = budget.reduce((s, b) => s + b.actualAmount, 0);
  const completedMilestones = timeline.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/events">
        <Button variant="ghost" size="sm">← Kembali ke Events</Button>
      </Link>

      {/* Event Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold">{event.name}</h2>
            <Badge className={getStatusBadge(event.status)}>{event.status}</Badge>
          </div>
          <p className="text-muted-foreground">{getTypeLabel(event.type)} · {event.location}{event.venue ? ` · ${event.venue}` : ""}</p>
          <p className="text-sm text-muted-foreground">📅 {formatDate(event.startDate)}{event.endDate !== event.startDate ? ` — ${formatDate(event.endDate)}` : ""}</p>
          <p className="text-sm text-muted-foreground">👤 PIC: {event.pic} · 📷 {event.instagram}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Hari ke Event</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysUntilEvent > 0 ? daysUntilEvent : "Selesai"}</div>
            <div className="text-xs text-muted-foreground">{daysUntilEvent > 0 ? "hari lagi" : "event telah berlangsung"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Budget</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(event.budget)}</div>
            <div className="text-xs text-muted-foreground">{budgetUsed}% terpakai ({formatCurrency(event.actualCost)})</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(event.revenue)}</div>
            <div className="text-xs text-muted-foreground">{event.tenantCount} tenant · {event.sponsorCount} sponsor</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Milestone</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedMilestones}/{timeline.length}</div>
            <div className="text-xs text-muted-foreground">tercapai</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b flex-wrap">
        {[
          { key: "overview", label: "📊 Overview" },
          { key: "timeline", label: "📋 Timeline" },
          { key: "budget", label: "💰 RAB" },
          { key: "tenants", label: "🏪 Tenants" },
          { key: "sponsors", label: "🤝 Sponsors" },
          { key: "media", label: "📸 Media" },
          { key: "closeout", label: "✅ Closeout GCG" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? "border-purple-600 text-purple-600" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Detail Event</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Tipe:</span><span>{getTypeLabel(event.type)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><Badge className={getStatusBadge(event.status)}>{event.status}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Lokasi:</span><span>{event.location}</span></div>
                {event.venue && <div className="flex justify-between"><span className="text-muted-foreground">Venue:</span><span>{event.venue}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Target Peserta:</span><span>{event.attendeeTarget.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">PIC:</span><span>{event.pic}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Instagram:</span><span>{event.instagram}</span></div>
              </div>
              {event.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Deskripsi:</p>
                  <p className="text-sm">{event.description}</p>
                </div>
              )}
              {event.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Catatan:</p>
                  <p className="text-sm">{event.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Progress Budget vs Revenue</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Budget Usage</span>
                    <span>{budgetUsed}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${budgetUsed > 100 ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${Math.min(budgetUsed, 100)}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{formatCurrency(event.actualCost)} / {formatCurrency(event.budget)}</div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Revenue vs Budget</span>
                    <span>{event.budget > 0 ? ((event.revenue / event.budget) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${event.budget > 0 ? Math.min((event.revenue / event.budget) * 100, 100) : 0}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{formatCurrency(event.revenue)} / {formatCurrency(event.budget)}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(event.revenue)}</div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(event.actualCost)}</div>
                    <div className="text-xs text-muted-foreground">Cost</div>
                  </div>
                </div>
                <div className="text-center pt-2 border-t">
                  <div className={`text-2xl font-bold ${event.revenue - event.actualCost >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(event.revenue - event.actualCost)}
                  </div>
                  <div className="text-xs text-muted-foreground">Profit/Loss</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "timeline" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">📋 Timeline & Milestones</h3>
            <Button onClick={() => setShowTimelineForm(!showTimelineForm)} size="sm">
              {showTimelineForm ? "Batal" : "+ Tambah Milestone"}
            </Button>
          </div>

          {timelineMsg && (
            <div className={`px-4 py-3 rounded-lg text-sm ${timelineMsg.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {timelineMsg}
              <button onClick={() => setTimelineMsg(null)} className="ml-3 text-xs underline">Tutup</button>
            </div>
          )}

          {showTimelineForm && (
            <Card>
              <CardHeader><CardTitle>Tambah Milestone</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddTimeline} className="grid gap-3 md:grid-cols-3">
                  <Label>
                    <span className="text-sm text-muted-foreground">Phase</span>
                    <select name="phase" className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
                      <option value="Konsep">Konsep</option>
                      <option value="Perencanaan">Perencanaan</option>
                      <option value="Venue Booking">Venue Booking</option>
                      <option value="Sponsorship">Sponsorship</option>
                      <option value="Tenant">Tenant</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Road to Fragrantions">Road to Fragrantions</option>
                      <option value="Final Preparation">Final Preparation</option>
                      <option value="Event Day">Event Day</option>
                      <option value="Settlement">Settlement</option>
                      <option value="Post-Event">Post-Event</option>
                    </select>
                  </Label>
                  <Label>
                    <span className="text-sm text-muted-foreground">Milestone</span>
                    <input name="milestone" placeholder="Nama milestone" className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" required />
                  </Label>
                  <Label>
                    <span className="text-sm text-muted-foreground">Due Date</span>
                    <input name="dueDate" type="date" className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                  </Label>
                  <Label className="md:col-span-2">
                    <span className="text-sm text-muted-foreground">Catatan</span>
                    <input name="notes" placeholder="Catatan tambahan" className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                  </Label>
                  <div className="flex items-end">
                    <Button type="submit" disabled={timelineSaving} className="w-full">
                      {timelineSaving ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {timeline.length > 0 ? (
            <div className="space-y-2">
              {timeline.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((ms) => (
                <Card key={ms.id} className={ms.completed ? "opacity-70" : ""}>
                  <CardContent className="py-3">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleTimeline(ms.id, ms.completed)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0 ${ms.completed ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400 hover:bg-gray-300"}`}
                      >
                        {ms.completed ? "✓" : ""}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{ms.phase}</span>
                          <span className={`font-medium text-sm ${ms.completed ? "line-through text-muted-foreground" : ""}`}>{ms.milestone}</span>
                        </div>
                        {ms.notes && <p className="text-xs text-muted-foreground mt-1">{ms.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-muted-foreground">{formatDate(ms.dueDate)}</div>
                        {ms.completed && ms.completedDate && (
                          <div className="text-xs text-green-600">✓ {formatDate(ms.completedDate)}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada milestone. Tambahkan milestone pertama!</CardContent></Card>
          )}
        </div>
      )}

      {tab === "budget" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">💰 RAB (Rencana Anggaran Biaya)</h3>
              <p className="text-sm text-muted-foreground">Total: {formatCurrency(totalPlannedBudget)} planned · {formatCurrency(totalActualBudget)} actual</p>
            </div>
            <Button onClick={() => setShowBudgetForm(!showBudgetForm)} size="sm">
              {showBudgetForm ? "Batal" : "+ Tambah Item"}
            </Button>
          </div>

          {budgetMsg && (
            <div className={`px-4 py-3 rounded-lg text-sm ${budgetMsg.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {budgetMsg}
              <button onClick={() => setBudgetMsg(null)} className="ml-3 text-xs underline">Tutup</button>
            </div>
          )}

          {showBudgetForm && (
            <Card>
              <CardHeader><CardTitle>Tambah Item Budget</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddBudget} className="grid gap-3 md:grid-cols-3">
                  <Label>
                    <span className="text-sm text-muted-foreground">Kategori</span>
                    <select name="category" className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
                      <option value="Venue">Venue</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Staff">Staff</option>
                      <option value="Catering">Catering</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Permit">Perizinan</option>
                      <option value="Insurance">Asuransi</option>
                      <option value="Dekorasi">Dekorasi</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </Label>
                  <Label>
                    <span className="text-sm text-muted-foreground">Nama Item</span>
                    <input name="itemName" placeholder="Nama item budget" className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" required />
                  </Label>
                  <Label>
                    <span className="text-sm text-muted-foreground">Jumlah Rencana</span>
                    <input name="plannedAmount" type="number" placeholder="0" className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                  </Label>
                  <Label>
                    <span className="text-sm text-muted-foreground">Jumlah Aktual</span>
                    <input name="actualAmount" type="number" placeholder="0" className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                  </Label>
                  <Label>
                    <span className="text-sm text-muted-foreground">Catatan</span>
                    <input name="notes" placeholder="Catatan" className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                  </Label>
                  <div className="flex items-end">
                    <Button type="submit" disabled={budgetSaving} className="w-full">
                      {budgetSaving ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {budget.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Rencana</TableHead>
                        <TableHead className="text-right">Aktual</TableHead>
                        <TableHead className="text-right">Selisih</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budget.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.category}</TableCell>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.plannedAmount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.actualAmount)}</TableCell>
                          <TableCell className={`text-right ${item.actualAmount - item.plannedAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                            {formatCurrency(item.actualAmount - item.plannedAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalPlannedBudget)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalActualBudget)}</TableCell>
                        <TableCell className={`text-right ${totalActualBudget - totalPlannedBudget > 0 ? "text-red-600" : "text-green-600"}`}>
                          {formatCurrency(totalActualBudget - totalPlannedBudget)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada item budget. Tambahkan item pertama!</CardContent></Card>
          )}
        </div>
      )}

      {tab === "tenants" && (
        <Card>
          <CardHeader>
            <CardTitle>🏪 Tenant Pipeline</CardTitle>
            <CardDescription>{tenants.length} tenant terdaftar</CardDescription>
          </CardHeader>
          <CardContent>
            {tenants.length > 0 ? (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brand</TableHead>
                      <TableHead>PIC</TableHead>
                      <TableHead>Booth</TableHead>
                      <TableHead>Paket</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Fee / Dibayar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.brandName}</TableCell>
                        <TableCell>{t.contactPerson}</TableCell>
                        <TableCell>{t.boothNumber || "TBA"}</TableCell>
                        <TableCell>{t.packageType}</TableCell>
                        <TableCell>
                          <Badge className={t.paymentStatus === "paid" ? "bg-green-100 text-green-700" : t.paymentStatus === "partial" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}>
                            {t.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(t.paymentAmount)} / {formatCurrency(t.fee)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>Belum ada tenant. Tambahkan dari tab Commercial di halaman Events.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "sponsors" && (
        <Card>
          <CardHeader>
            <CardTitle>🤝 Sponsor Pipeline</CardTitle>
            <CardDescription>{sponsors.length} sponsor terdaftar</CardDescription>
          </CardHeader>
          <CardContent>
            {sponsors.length > 0 ? (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sponsor</TableHead>
                      <TableHead>PIC</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Nilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sponsors.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.companyName}</TableCell>
                        <TableCell>{s.contactPerson}</TableCell>
                        <TableCell>{s.tier}</TableCell>
                        <TableCell>
                          <Badge className={s.paymentStatus === "paid" ? "bg-green-100 text-green-700" : s.paymentStatus === "partial" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}>
                            {s.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(s.sponsorshipAmount + s.inKindValue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>Belum ada sponsor. Tambahkan dari tab Commercial di halaman Events.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "media" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">📸 Event Media</h3>
              <p className="text-sm text-muted-foreground">Foto, video, dan dokumentasi event dari Instagram atau upload manual.</p>
            </div>
            <Button onClick={() => setShowMediaForm(!showMediaForm)} size="sm">
              {showMediaForm ? "Batal" : "+ Tambah Media"}
            </Button>
          </div>

          {mediaMsg && (
            <div className={`px-4 py-3 rounded-lg text-sm ${mediaMsg.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {mediaMsg}
              <button onClick={() => setMediaMsg(null)} className="ml-3 text-xs underline">Tutup</button>
            </div>
          )}

          {showMediaForm && (
            <Card>
              <CardHeader><CardTitle>Tambah Media</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setMediaSaving(true);
                  setMediaMsg(null);
                  const form = new FormData(e.currentTarget);
                  const payload = {
                    eventId: id,
                    type: String(form.get("type") || "image"),
                    title: String(form.get("title") || ""),
                    url: String(form.get("url") || ""),
                    caption: String(form.get("caption") || ""),
                    source: String(form.get("source") || "manual"),
                    featured: form.get("featured") === "on",
                  };
                  if (!payload.url && !payload.title) {
                    setMediaMsg("URL atau judul wajib diisi.");
                    setMediaSaving(false);
                    return;
                  }
                  try {
                    const res = await fetch("/api/events/media", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
                    setMediaMsg("✅ Media ditambahkan!");
                    setShowMediaForm(false);
                    e.currentTarget.reset();
                    await fetchMedia();
                  } catch (err) {
                    setMediaMsg(`❌ Gagal: ${String(err).replace(/^Error:\s*/, "")}`);
                  } finally {
                    setMediaSaving(false);
                  }
                }} className="grid gap-3 md:grid-cols-3">
                  <Label>
                    <span className="text-sm text-muted-foreground">Tipe</span>
                    <select name="type" className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
                      <option value="image">Foto</option>
                      <option value="video">Video</option>
                      <option value="reel">Reel</option>
                      <option value="story">Story</option>
                      <option value="post">Post</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </Label>
                  <Label>
                    <span className="text-sm text-muted-foreground">Judul</span>
                    <input name="title" placeholder="Judul media" className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                  </Label>
                  <Label>
                    <span className="text-sm text-muted-foreground">URL</span>
                    <input name="url" placeholder="https://..." className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                  </Label>
                  <Label className="md:col-span-2">
                    <span className="text-sm text-muted-foreground">Caption</span>
                    <input name="caption" placeholder="Caption / deskripsi media" className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                  </Label>
                  <Label>
                    <span className="text-sm text-muted-foreground">Sumber</span>
                    <select name="source" className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
                      <option value="manual">Manual</option>
                      <option value="instagram">Instagram</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="drive">Google Drive</option>
                    </select>
                  </Label>
                  <div className="flex items-end gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="featured" /> Featured
                    </label>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" disabled={mediaSaving} className="w-full">
                      {mediaSaving ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {mediaLoading ? (
            <div className="text-center py-10 text-muted-foreground">Memuat media...</div>
          ) : mediaItems.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mediaItems.map((m) => (
                <Card key={m.id} className={m.featured === "true" ? "ring-2 ring-primary" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{m.type}</span>
                      {m.featured === "true" && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">⭐ Featured</span>}
                    </div>
                    <CardTitle className="text-base">{m.title || "Tanpa Judul"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {m.url && (
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                        🔗 {m.url.length > 60 ? m.url.slice(0, 60) + "..." : m.url}
                      </a>
                    )}
                    {m.caption && <p className="text-sm text-muted-foreground">{m.caption}</p>}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>📷 {m.source}</span>
                      <span>{m.created}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada media. Tambahkan foto/video dokumentasi event.</CardContent></Card>
          )}
        </div>
      )}

      {tab === "closeout" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">✅ Event Closeout Report</h3>
            <p className="text-sm text-muted-foreground">Ringkasan RAB vs actual, revenue, piutang, bukti expense, dan catatan GCG. Semua angka berasal dari sheet event/expense; data kosong ditampilkan sebagai 0 atau Belum dicatat.</p>
          </div>

          {closeout ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Budget vs Actual</CardTitle></CardHeader>
                  <CardContent>
                    <div className={closeout.budgetVariance < 0 ? "text-2xl font-bold text-red-600" : "text-2xl font-bold text-green-600"}>{formatCurrency(closeout.budgetVariance)}</div>
                    <div className="text-xs text-muted-foreground">Actual {formatCurrency(closeout.actualExpense)} / Budget {formatCurrency(closeout.plannedBudget)} ({closeout.budgetVariancePct}%)</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Revenue Tercatat</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(closeout.totalRevenuePaid)}</div>
                    <div className="text-xs text-muted-foreground">Expected {formatCurrency(closeout.totalRevenueExpected)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Receivable / Payable</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(closeout.receivable)}</div>
                    <div className="text-xs text-muted-foreground">
                      Payable {formatCurrency(closeout.payable)}
                      {closeout.payableFromPurchaseOrders ? ` • PO ${formatCurrency(closeout.payableFromPurchaseOrders)} (${closeout.purchaseOrderPayableCount || 0})` : ""}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Final Profit/Loss</CardTitle></CardHeader>
                  <CardContent>
                    <div className={closeout.finalProfitLoss >= 0 ? "text-2xl font-bold text-green-600" : "text-2xl font-bold text-red-600"}>{formatCurrency(closeout.finalProfitLoss)}</div>
                    <div className="text-xs text-muted-foreground">Revenue paid - actual expense</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Expense by Category</CardTitle>
                    <CardDescription>{closeout.expenses.length} expense terkait event</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {closeout.expenseByCategory.length ? (
                      <div className="space-y-2">
                        {closeout.expenseByCategory.map((item) => (
                          <div key={item.category} className="flex justify-between text-sm border-b pb-2">
                            <span>{item.category || "Belum dicatat"}</span>
                            <span className="font-medium">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Belum ada expense event yang tercatat.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>TARIF Governance Exceptions</CardTitle>
                    <CardDescription>Exception ditampilkan sebagai pekerjaan follow-up, bukan angka asumsi.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>Expense tanpa proof URL</span><Badge className={closeout.expensesWithoutProof ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>{closeout.expensesWithoutProof}</Badge></div>
                    <div className="flex justify-between"><span>Status Needs Proof</span><Badge className={closeout.expensesNeedsProof ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}>{closeout.expensesNeedsProof}</Badge></div>
                    <div className="flex justify-between"><span>Personal Paid / Shareholder Debt</span><Badge className={closeout.personalPaidExpenses ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}>{closeout.personalPaidExpenses}</Badge></div>
                    <div className="flex justify-between"><span>Governance audit trail</span><Badge className={closeout.governanceAuditCount ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{closeout.governanceAuditCount || 0}</Badge></div>
                    <div className="flex justify-between"><span>Dokumentasi media</span><span>{closeout.documentationStatus || "Belum dicatat"}</span></div>
                    {closeout.mediaProofUrls?.length > 0 && (
                      <div className="border-t pt-3">
                        <span className="text-muted-foreground">Proof media:</span>
                        <div className="mt-1 space-y-1">
                          {closeout.mediaProofUrls.map((url, index) => (
                            <a key={`${url}-${index}`} href={url} target="_blank" rel="noopener noreferrer" className="block truncate text-primary hover:underline">
                              Media {index + 1}: {url}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="border-t pt-3"><span className="text-muted-foreground">Lessons learned:</span><p>{closeout.lessonsLearned || "Belum dicatat"}</p></div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Governance Audit Trail Event</CardTitle>
                  <CardDescription>Approve/reject expense terkait event dan aksi GCG event dari Governance_Audit_Log.</CardDescription>
                </CardHeader>
                <CardContent>
                  {closeout.governanceAuditTrail?.length ? (
                    <div className="rounded-md border overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Waktu</TableHead>
                            <TableHead>Actor</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {closeout.governanceAuditTrail.slice(0, 10).map((item) => (
                            <TableRow key={item.logId || `${item.timestamp}-${item.entityId}`}>
                              <TableCell>{item.timestamp ? new Date(item.timestamp).toLocaleString("id-ID") : "TBA"}</TableCell>
                              <TableCell>{item.actor || "Belum dicatat"}</TableCell>
                              <TableCell>{item.action || "TBA"}</TableCell>
                              <TableCell>{item.entityType || "TBA"}:{item.entityId || "TBA"}</TableCell>
                              <TableCell>{item.before || ""}{item.before || item.after ? " → " : ""}{item.after || ""}</TableCell>
                              <TableCell>{item.reason || "Belum dicatat"}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Belum ada Governance_Audit_Log yang terkait langsung dengan event/expense event ini.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Expense Detail untuk Closeout</CardTitle></CardHeader>
                <CardContent>
                  {closeout.expenses.length ? (
                    <div className="rounded-md border overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead>Divisi</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Bukti</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {closeout.expenses.map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell>{expense.date || "TBA"}</TableCell>
                              <TableCell>{expense.description || "Belum dicatat"}</TableCell>
                              <TableCell>{expense.division || "Belum dicatat"}</TableCell>
                              <TableCell>{expense.status || "Belum dicatat"}</TableCell>
                              <TableCell>{expense.proofUrl ? <a href={expense.proofUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ada</a> : "Belum dicatat"}</TableCell>
                              <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Belum ada expense closeout untuk event ini.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Purchase Order Terkait Event</CardTitle>
                  <CardDescription>PO dicocokkan hanya jika menyebut event ID/nama/slug di supplier, item, atau notes. Jika belum ada link event di PO, tampil kosong/TBA.</CardDescription>
                </CardHeader>
                <CardContent>
                  {closeout.purchaseOrders?.length ? (
                    <div className="rounded-md border overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>PO</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Expected</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {closeout.purchaseOrders.map((po) => (
                            <TableRow key={po.id}>
                              <TableCell>{po.id || "TBA"}</TableCell>
                              <TableCell>{po.supplierName || "Belum dicatat"}</TableCell>
                              <TableCell>{po.itemName || "Belum dicatat"}</TableCell>
                              <TableCell>{po.status || "Belum dicatat"}</TableCell>
                              <TableCell>{po.expectedDate || "TBA"}</TableCell>
                              <TableCell className="text-right">{formatCurrency(po.total)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Belum ada Purchase_Orders yang bisa dicocokkan ke event ini dari data yang terbaca.</p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Closeout belum tersedia dari API.</CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}
