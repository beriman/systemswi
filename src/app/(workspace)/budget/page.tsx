"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ──
interface BudgetRow {
  id: string;
  category: string;
  month: string;
  year: string;
  budget: number;
  actual: number;
  remaining: number;
  percentUsed: number;
  variance: number;
  status: string;
  event?: string;
  notes?: string;
}

interface SummaryData {
  totalBudget: number;
  totalActual: number;
  totalRemaining: number;
  overallPercent: number;
  categoryCount: number;
  overBudgetCount: number;
  warningCount: number;
}

interface AlertItem {
  id: string;
  category: string;
  month: string;
  budget: number;
  actual: number;
  percentUsed: number;
  level: "warning" | "danger" | "over";
  message: string;
}

interface CategoryBreakdown {
  category: string;
  totalBudget: number;
  totalActual: number;
  remaining: number;
  percentUsed: number;
  months: number;
  status: string;
}

interface EventBreakdown {
  eventId: string;
  eventName: string;
  totalBudget: number;
  totalActual: number;
  remaining: number;
  percentUsed: number;
  itemCount: number;
  status: string;
}

// ── Helpers ──
function formatRp(amount: number): string {
  if (!amount && amount !== 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatShortRp(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  }
  return `Rp ${amount}`;
}

function getStatusColor(status: string) {
  switch (status) {
    case "over":
      return "bg-red-100 text-red-700";
    case "danger":
      return "bg-red-50 text-red-600";
    case "warning":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-green-100 text-green-700";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "over":
      return "OVER";
    case "danger":
      return "KRITIS";
    case "warning":
      return "PERINGATAN";
    default:
      return "OK";
  }
}

function getProgressBarColor(percentUsed: number) {
  if (percentUsed >= 95) return "bg-red-500";
  if (percentUsed >= 80) return "bg-yellow-500";
  return "bg-emerald-500";
}

type TabId = "dashboard" | "table" | "by-event" | "trend" | "add";

// ── Main Page Component ──
export default function BudgetPage() {
  const [tab, setTab] = useState<TabId>("dashboard");
  const [budgetRows, setBudgetRows] = useState<BudgetRow[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [events, setEvents] = useState<EventBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterYear, setFilterYear] = useState("2026");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterEventName, setFilterEventName] = useState("");

  // Add form
  const [formCategory, setFormCategory] = useState("");
  const [formMonth, setFormMonth] = useState("");
  const [formYear, setFormYear] = useState("2026");
  const [formBudget, setFormBudget] = useState("");
  const [formActual, setFormActual] = useState("0");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [budgetRes, summaryRes, alertsRes, catRes, evtRes] = await Promise.all([
        fetch(`/api/budget?year=${filterYear}`),
        fetch("/api/budget/summary"),
        fetch("/api/budget/alerts"),
        fetch("/api/budget/by-category"),
        fetch("/api/budget/by-event"),
      ]);

      if (budgetRes.ok) {
        const json = await budgetRes.json();
        setBudgetRows(json.data || []);
      }
      if (summaryRes.ok) {
        const json = await summaryRes.json();
        setSummary(json.summary || null);
      }
      if (alertsRes.ok) {
        const json = await alertsRes.json();
        setAlerts(json.alerts || []);
      }
      if (catRes.ok) {
        const json = await catRes.json();
        setCategories(json.categories || []);
      }
      if (evtRes.ok) {
        const json = await evtRes.json();
        setEvents(json.events || []);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [filterYear]);

  // Client-side filters
  const filteredRows = budgetRows.filter((r) => {
    if (filterMonth && !r.month.toLowerCase().includes(filterMonth.toLowerCase())) return false;
    if (filterCategory && !r.category.toLowerCase().includes(filterCategory.toLowerCase())) return false;
    if (filterEventName && !(r.event || "").toLowerCase().includes(filterEventName.toLowerCase())) return false;
    return true;
  });

  const filteredCategories = categories.filter((c) => {
    if (filterCategory && !c.category.toLowerCase().includes(filterCategory.toLowerCase())) return false;
    return true;
  });

  // Monthly trend aggregation
  const monthlyTrend = (() => {
    const map = new Map<string, { budget: number; actual: number }>();
    for (const r of filteredRows) {
      const key = r.month;
      const existing = map.get(key) || { budget: 0, actual: 0 };
      existing.budget += r.budget;
      existing.actual += r.actual;
      map.set(key, existing);
    }
    return Array.from(map.entries())
      .map(([month, v]) => ({
        month,
        budget: v.budget,
        actual: v.actual,
        remaining: v.budget - v.actual,
        percentUsed: v.budget > 0 ? Math.round((v.actual / v.budget) * 100) : 0,
      }))
      .sort((a, b) => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months.indexOf(a.month.replace("-26", "")) - months.indexOf(b.month.replace("-26", ""));
      });
  })();

  // Form handlers
  async function handleAddEntry(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFormMessage(null);

    if (!formCategory || !formMonth || !formBudget) {
      setFormMessage("Kategori, bulan, dan budget wajib diisi.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formCategory,
          month: formMonth,
          year: formYear,
          budget: Number(formBudget),
          actual: Number(formActual) || 0,
          notes: formNotes,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setFormMessage("Budget entry berhasil ditambahkan!");
      setFormCategory("");
      setFormMonth("");
      setFormBudget("");
      setFormActual("0");
      setFormNotes("");
      fetchAll();
    } catch (err) {
      setFormMessage(`Gagal: ${err}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSeed() {
    if (!confirm("Seed data budget? Ini akan menimpa data yang sudah ada.")) return;
    try {
      setLoading(true);
      const res = await fetch("/api/budget/seed?force=true", { method: "POST" });
      const json = await res.json();
      alert(json.message || JSON.stringify(json));
      fetchAll();
    } catch (err) {
      alert(`Gagal seed: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  // ── Tab buttons ──
  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "table", label: "Budget vs Actual", icon: "📋" },
    { id: "by-event", label: "By Event", icon: "🎉" },
    { id: "trend", label: "Monthly Trend", icon: "📈" },
    { id: "add", label: "Add Entry", icon: "➕" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budget vs Actual Tracker</h1>
          <p className="text-muted-foreground">Tracking anggaran vs pengeluaran aktual SWI</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSeed}>
          🔄 Seed Data
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-md transition-colors ${
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error: {error}
        </div>
      )}

      {/* Loading */}
      {loading && budgetRows.length === 0 && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {/* ═══ TAB: Dashboard ═══ */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          {/* Big Numbers */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold text-blue-600">{formatRp(summary.totalBudget)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{summary.categoryCount} kategori</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Total Actual</p>
                  <p className="text-2xl font-bold text-orange-600">{formatRp(summary.totalActual)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.overBudgetCount} over budget
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className={`text-2xl font-bold ${summary.totalRemaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatRp(summary.totalRemaining)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{summary.warningCount} warning</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Overall Usage</p>
                  <p className={`text-2xl font-bold ${
                    summary.overallPercent >= 95 ? "text-red-600" :
                    summary.overallPercent >= 80 ? "text-yellow-600" : "text-green-600"
                  }`}>
                    {summary.overallPercent}%
                  </p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getProgressBarColor(summary.overallPercent)}`}
                      style={{ width: `${Math.min(summary.overallPercent, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Alerts */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>🔔 Budget Alerts ({alerts.length})</CardTitle>
                <CardDescription>Kategori yang mendekati atau melebihi anggaran</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.map((a) => (
                    <div
                      key={a.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        a.level === "over"
                          ? "bg-red-50 border-red-200"
                          : a.level === "danger"
                          ? "bg-red-50/50 border-red-100"
                          : "bg-yellow-50 border-yellow-200"
                      }`}
                    >
                      <div>
                        <span className="font-medium">{a.category}</span>
                        <span className="text-muted-foreground mx-2">|</span>
                        <span className="text-sm text-muted-foreground">{a.month}</span>
                        <p className="text-sm mt-1">{a.message}</p>
                      </div>
                      <Badge className={a.level === "over" ? "bg-red-500" : a.level === "danger" ? "bg-red-400" : "bg-yellow-500"}>
                        {a.percentUsed}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress bars per category */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Budget Usage per Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCategories.map((cat) => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{cat.category}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatShortRp(cat.actual)} / {formatShortRp(cat.budget)} ({cat.percentUsed}%)
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getProgressBarColor(cat.percentUsed)}`}
                        style={{ width: `${Math.min(cat.percentUsed, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(cat.status)} variant="outline">
                        {getStatusLabel(cat.status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Sisa: {formatShortRp(cat.remaining)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ TAB: Budget vs Actual Table ═══ */}
      {tab === "table" && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Budget vs Actual Table</CardTitle>
            <CardDescription>Filter dan sort data budget</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div>
                <Label className="text-xs">Tahun</Label>
                <Input
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  placeholder="2026"
                  className="w-24"
                />
              </div>
              <div>
                <Label className="text-xs">Bulan</Label>
                <Input
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  placeholder="Jan"
                  className="w-24"
                />
              </div>
              <div>
                <Label className="text-xs">Kategori</Label>
                <Input
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  placeholder="Bahan Baku"
                  className="w-40"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterYear("2026");
                    setFilterMonth("");
                    setFilterCategory("");
                    setFilterEventName("");
                  }}
                >
                  Reset Filter
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Bulan</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">% Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Event</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {loading ? "Loading..." : "Tidak ada data budget. Klik \"Seed Data\" untuk generate sample."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.category}</TableCell>
                        <TableCell>{r.month}</TableCell>
                        <TableCell className="text-right">{formatRp(r.budget)}</TableCell>
                        <TableCell className="text-right">{formatRp(r.actual)}</TableCell>
                        <TableCell className={`text-right font-medium ${r.remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatRp(r.remaining)}
                        </TableCell>
                        <TableCell className="text-right">{r.percentUsed}%</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(r.status)} variant="outline">
                            {getStatusLabel(r.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.event || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Menampilkan {filteredRows.length} dari {budgetRows.length} entries</p>
          </CardContent>
        </Card>
      )}

      {/* ═══ TAB: By Event ═══ */}
      {tab === "by-event" && (
        <Card>
          <CardHeader>
            <CardTitle>🎉 Budget by Event</CardTitle>
            <CardDescription>Breakdown pengeluaran per event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 max-w-xs">
              <Label className="text-xs">Filter Event</Label>
              <Input
                value={filterEventName}
                onChange={(e) => setFilterEventName(e.target.value)}
                placeholder="Nama event..."
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">% Used</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {loading ? "Loading..." : "Tidak ada data event budget."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    events
                      .filter((e) => !filterEventName || e.eventName.toLowerCase().includes(filterEventName.toLowerCase()))
                      .map((e) => (
                        <TableRow key={e.eventId}>
                          <TableCell className="font-medium">{e.eventName}</TableCell>
                          <TableCell className="text-right">{formatRp(e.totalBudget)}</TableCell>
                          <TableCell className="text-right">{formatRp(e.totalActual)}</TableCell>
                          <TableCell className={`text-right font-medium ${e.remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatRp(e.remaining)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${getProgressBarColor(e.percentUsed)}`}
                                  style={{ width: `${Math.min(e.percentUsed, 100)}%` }}
                                />
                              </div>
                              {e.percentUsed}%
                            </div>
                          </TableCell>
                          <TableCell>{e.itemCount}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(e.status)} variant="outline">
                              {getStatusLabel(e.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ TAB: Monthly Trend ═══ */}
      {tab === "trend" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📈 Monthly Trend: Budget vs Actual</CardTitle>
              <CardDescription>Perbandingan bulanan anggaran vs pengeluaran</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyTrend.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Tidak ada data.</p>
              ) : (
                <>
                  {/* Visual bars */}
                  <div className="space-y-4">
                    {monthlyTrend.map((m) => (
                      <div key={m.month}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{m.month}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatShortRp(m.actual)} / {formatShortRp(m.budget)}
                          </span>
                        </div>
                        <div className="flex gap-1 h-6 bg-gray-100 rounded-md overflow-hidden relative">
                          {/* Budget bar (full) */}
                          <div
                            className="h-full bg-blue-200 rounded-sm"
                            style={{ width: "100%" }}
                          />
                          {/* Actual overlay */}
                          <div
                            className={`absolute top-0 left-0 h-full rounded-sm ${
                              m.percentUsed >= 95 ? "bg-red-500" :
                              m.percentUsed >= 80 ? "bg-yellow-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(m.percentUsed, 100)}%` }}
                          />
                          {/* Label */}
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                            {m.percentUsed}%
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span>🟦 Budget: {formatRp(m.budget)}</span>
                          <span>🟩 Actual: {formatRp(m.actual)}</span>
                          <span className={m.remaining >= 0 ? "text-green-600" : "text-red-600"}>
                            Sisa: {formatRp(m.remaining)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary table */}
                  <div className="mt-6 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bulan</TableHead>
                          <TableHead className="text-right">Budget</TableHead>
                          <TableHead className="text-right">Actual</TableHead>
                          <TableHead className="text-right">Remaining</TableHead>
                          <TableHead className="text-right">% Used</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyTrend.map((m) => (
                          <TableRow key={m.month}>
                            <TableCell className="font-medium">{m.month}</TableCell>
                            <TableCell className="text-right">{formatRp(m.budget)}</TableCell>
                            <TableCell className="text-right">{formatRp(m.actual)}</TableCell>
                            <TableCell className={`text-right font-medium ${m.remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatRp(m.remaining)}
                            </TableCell>
                            <TableCell className="text-right">{m.percentUsed}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Category breakdown card */}
          <Card>
            <CardHeader>
              <CardTitle>🗂 Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Total Budget</TableHead>
                      <TableHead className="text-right">Total Actual</TableHead>
                      <TableHead className="text-right">Remaining</TableHead>
                      <TableHead className="text-right">% Used</TableHead>
                      <TableHead>Bulan</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((c) => (
                      <TableRow key={c.category}>
                        <TableCell className="font-medium">{c.category}</TableCell>
                        <TableCell className="text-right">{formatRp(c.totalBudget)}</TableCell>
                        <TableCell className="text-right">{formatRp(c.totalActual)}</TableCell>
                        <TableCell className={`text-right font-medium ${c.remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatRp(c.remaining)}
                        </TableCell>
                        <TableCell className="text-right">{c.percentUsed}%</TableCell>
                        <TableCell>{c.months}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(c.status)} variant="outline">
                            {getStatusLabel(c.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ TAB: Add Entry ═══ */}
      {tab === "add" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>➕ Tambah Budget Entry</CardTitle>
            <CardDescription>Tambahkan entri budget atau expense baru</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Kategori *</Label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    required
                  >
                    <option value="">Pilih kategori</option>
                    <option value="Bahan Baku">Bahan Baku</option>
                    <option value="Iklan & Marketing">Iklan & Marketing</option>
                    <option value="Sewa Booth">Sewa Booth</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Transport">Transport</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <Label>Bulan *</Label>
                  <select
                    value={formMonth}
                    onChange={(e) => setFormMonth(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    required
                  >
                    <option value="">Pilih bulan</option>
                    <option value="Jan-26">Jan 2026</option>
                    <option value="Feb-26">Feb 2026</option>
                    <option value="Mar-26">Mar 2026</option>
                    <option value="Apr-26">Apr 2026</option>
                    <option value="May-26">May 2026</option>
                    <option value="Jun-26">Jun 2026</option>
                    <option value="Jul-26">Jul 2026</option>
                    <option value="Aug-26">Aug 2026</option>
                    <option value="Sep-26">Sep 2026</option>
                    <option value="Oct-26">Oct 2026</option>
                    <option value="Nov-26">Nov 2026</option>
                    <option value="Dec-26">Dec 2026</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tahun *</Label>
                  <Input
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Budget Amount (Rp) *</Label>
                  <Input
                    type="number"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    placeholder="5000000"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Actual / Expense (Rp)</Label>
                <Input
                  type="number"
                  value={formActual}
                  onChange={(e) => setFormActual(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">Kosongkan jika belum ada pengeluaran</p>
              </div>

              <div>
                <Label>Catatan</Label>
                <Textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Opsional: catatan tambahan..."
                  rows={3}
                />
              </div>

              {formMessage && (
                <div className={`px-4 py-2 rounded-lg text-sm ${
                  formMessage.includes("berhasil")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {formMessage}
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "⏳ Menyimpan..." : "💾 Simpan Budget Entry"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
