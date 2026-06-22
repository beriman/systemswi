"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RoleGate } from "@/components/auth/role-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Types ──────────────────────────────────────────────────────────
interface BudgetEntry {
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

interface BudgetSummary {
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
  status: string;
  months: number;
}

interface EventBreakdown {
  eventId: string;
  eventName: string;
  totalBudget: number;
  totalActual: number;
  remaining: number;
  percentUsed: number;
  status: string;
  itemCount: number;
}

// ── Helpers ────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function ProgressBar({ percent, status }: { percent: number; status: string }) {
  const clamped = Math.min(percent, 100);
  let color = "bg-green-500";
  if (status === "over") color = "bg-red-600";
  else if (status === "danger") color = "bg-red-500";
  else if (status === "warning") color = "bg-yellow-500";
  else if (percent >= 70) color = "bg-yellow-400";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs font-medium w-10 text-right">{percent}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "over") return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">OVER</span>;
  if (status === "danger") return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">CRITICAL</span>;
  if (status === "warning") return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">WARNING</span>;
  return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">OK</span>;
}

// ── Main Page ──────────────────────────────────────────────────────
export default function BudgetPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [events, setEvents] = useState<EventBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState("2026");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Fetch all data
  useEffect(() => {
    async function fetchData() {
      try {
        const [entriesRes, summaryRes, alertsRes, catRes, evtRes] = await Promise.all([
          fetch(`/api/budget?year=${filterYear}&month=${filterMonth}&category=${filterCategory}`, { cache: "no-store" }),
          fetch("/api/budget/summary", { cache: "no-store" }),
          fetch("/api/budget/alerts", { cache: "no-store" }),
          fetch("/api/budget/by-category", { cache: "no-store" }),
          fetch("/api/budget/by-event", { cache: "no-store" }),
        ]);

        if (entriesRes.ok) {
          const json = await entriesRes.json();
          setEntries(json.data || []);
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
    }
    fetchData();
  }, [filterYear, filterMonth, filterCategory]);

  async function handleSubmitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormMessage(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      category: String(form.get("category") || ""),
      month: String(form.get("month") || ""),
      year: String(form.get("year") || "2026"),
      budget: Number(form.get("budget") || 0),
      actual: Number(form.get("actual") || 0),
      event: String(form.get("event") || ""),
      notes: String(form.get("notes") || ""),
    };

    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.details || "Gagal menyimpan entry");
      setFormMessage(`✅ Entry tersimpan: ${json.id}`);
      event.currentTarget.reset();
      // Refresh data
      const entriesRes = await fetch(`/api/budget?year=${filterYear}`, { cache: "no-store" });
      if (entriesRes.ok) {
        const entriesJson = await entriesRes.json();
        setEntries(entriesJson.data || []);
      }
    } catch (err) {
      setFormMessage(`❌ ${String(err).replace(/^Error:\s*/, "")}`);
    } finally {
      setSubmitting(false);
    }
  }

  // Monthly trend data (aggregate by month from entries)
  const monthlyTrend = entries.reduce<Record<string, { month: string; budget: number; actual: number }>>((acc, entry) => {
    const key = entry.month || "Unknown";
    if (!acc[key]) acc[key] = { month: key, budget: 0, actual: 0 };
    acc[key].budget += entry.budget;
    acc[key].actual += entry.actual;
    return acc;
  }, {});

  const monthlyTrendData = Object.values(monthlyTrend).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">💵 Budget vs Actual Tracker</h2>
        <p className="text-muted-foreground">
          Tracking anggaran vs pengeluaran aktual — data real-time dari Google Sheets
        </p>
      </div>

      <RoleGate feature="dashboard:overview">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="table">Budget Table</TabsTrigger>
            <TabsTrigger value="event">By Event</TabsTrigger>
            <TabsTrigger value="trend">Monthly Trend</TabsTrigger>
            <TabsTrigger value="add">Add Entry</TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Dashboard ── */}
          <TabsContent value="dashboard" className="space-y-4">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                    <CardContent><Skeleton className="h-8 w-32" /></CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="py-8 text-center text-destructive">
                  <p>Gagal memuat data: {error}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Big Numbers */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="border-blue-200 bg-blue-50/40">
                    <CardHeader className="pb-2"><CardDescription>Total Budget</CardDescription></CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-700">
                        {summary ? formatCurrency(summary.totalBudget) : "—"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-200 bg-orange-50/40">
                    <CardHeader className="pb-2"><CardDescription>Total Actual</CardDescription></CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-700">
                        {summary ? formatCurrency(summary.totalActual) : "—"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200 bg-green-50/40">
                    <CardHeader className="pb-2"><CardDescription>Remaining</CardDescription></CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${(summary?.totalRemaining || 0) >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {summary ? formatCurrency(summary.totalRemaining) : "—"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200 bg-purple-50/40">
                    <CardHeader className="pb-2"><CardDescription>Overall Usage</CardDescription></CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-700">
                        {summary ? `${summary.overallPercent}%` : "—"}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress per category */}
                <Card>
                  <CardHeader>
                    <CardTitle>Budget Usage per Category</CardTitle>
                    <CardDescription>Progress kategori budget vs aktual</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {categories.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Belum ada data kategori.</p>
                    ) : (
                      categories.map((cat) => (
                        <div key={cat.category} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{cat.category}</span>
                            <span className="text-muted-foreground">
                              {formatCurrency(cat.totalActual)} / {formatCurrency(cat.totalBudget)}
                            </span>
                          </div>
                          <ProgressBar percent={cat.percentUsed} status={cat.status} />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Alerts */}
                {alerts.length > 0 && (
                  <Card className="border-red-200 bg-red-50/40">
                    <CardHeader>
                      <CardTitle>🚨 Budget Alerts</CardTitle>
                      <CardDescription>Kategori yang mendekati atau melebihi anggaran</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`rounded-lg border px-4 py-3 text-sm ${
                            alert.level === "over"
                              ? "border-red-300 bg-red-100/50 text-red-800"
                              : alert.level === "danger"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-yellow-200 bg-yellow-50 text-yellow-800"
                          }`}
                        >
                          {alert.message}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Tab 2: Budget vs Actual Table ── */}
          <TabsContent value="table" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-wrap gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Year</Label>
                    <Input
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      placeholder="2026"
                      className="w-24"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Month</Label>
                    <Input
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      placeholder="Jan"
                      className="w-28"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <Input
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      placeholder="Bahan Baku"
                      className="w-40"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead className="text-right">% Used</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Belum ada data budget.
                          </TableCell>
                        </TableRow>
                      ) : (
                        entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">{entry.category}</TableCell>
                            <TableCell>{entry.month}</TableCell>
                            <TableCell className="text-right">{formatCurrency(entry.budget)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(entry.actual)}</TableCell>
                            <TableCell className={`text-right ${entry.remaining >= 0 ? "text-green-700" : "text-red-700"}`}>
                              {formatCurrency(entry.remaining)}
                            </TableCell>
                            <TableCell>
                              <ProgressBar percent={entry.percentUsed} status={entry.status} />
                            </TableCell>
                            <TableCell><StatusBadge status={entry.status} /></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 3: By Event ── */}
          <TabsContent value="event">
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Actual per Event</CardTitle>
                <CardDescription>Breakdown anggaran per event dari Event_Budget sheet</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead className="text-right">% Used</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Belum ada data event budget.
                          </TableCell>
                        </TableRow>
                      ) : (
                        events.map((evt) => (
                          <TableRow key={evt.eventId}>
                            <TableCell className="font-medium">{evt.eventName}</TableCell>
                            <TableCell className="text-right">{formatCurrency(evt.totalBudget)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(evt.totalActual)}</TableCell>
                            <TableCell className={`text-right ${evt.remaining >= 0 ? "text-green-700" : "text-red-700"}`}>
                              {formatCurrency(evt.remaining)}
                            </TableCell>
                            <TableCell>
                              <ProgressBar percent={evt.percentUsed} status={evt.status} />
                            </TableCell>
                            <TableCell><StatusBadge status={evt.status} /></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 4: Monthly Trend ── */}
          <TabsContent value="trend">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trend — Budget vs Actual</CardTitle>
                <CardDescription>Perbandingan budget vs aktual per bulan</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                        <TableHead className="text-right">% Used</TableHead>
                        <TableHead>Visual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyTrendData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Belum ada data trend bulanan.
                          </TableCell>
                        </TableRow>
                      ) : (
                        monthlyTrendData.map((row) => {
                          const variance = row.budget - row.actual;
                          const percent = row.budget > 0 ? Math.round((row.actual / row.budget) * 100) : 0;
                          const status = row.actual > row.budget ? "over" : percent >= 95 ? "danger" : percent >= 80 ? "warning" : "ok";
                          return (
                            <TableRow key={row.month}>
                              <TableCell className="font-medium">{row.month}</TableCell>
                              <TableCell className="text-right">{formatCurrency(row.budget)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(row.actual)}</TableCell>
                              <TableCell className={`text-right ${variance >= 0 ? "text-green-700" : "text-red-700"}`}>
                                {formatCurrency(variance)}
                              </TableCell>
                              <TableCell className="text-right">{percent}%</TableCell>
                              <TableCell className="w-40"><ProgressBar percent={percent} status={status} /></TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 5: Add Entry ── */}
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Add Budget / Expense Entry</CardTitle>
                <CardDescription>Tambah entry budget atau expense ke Google Sheets</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitEntry} className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" name="category" placeholder="Bahan Baku" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Input id="month" name="month" placeholder="Jun 2026" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" name="year" placeholder="2026" defaultValue="2026" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget Amount (Rp)</Label>
                    <Input id="budget" name="budget" type="number" min="0" step="1000" placeholder="10000000" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actual">Actual Amount (Rp)</Label>
                    <Input id="actual" name="actual" type="number" min="0" step="1000" placeholder="5000000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event">Event (optional)</Label>
                    <Input id="event" name="event" placeholder="Fragrantions Expo" />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" placeholder="Catatan tambahan..." />
                  </div>
                  <div className="md:col-span-3 flex items-center gap-3">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Menyimpan..." : "Simpan Entry"}
                    </Button>
                    {formMessage && <p className="text-sm text-muted-foreground">{formMessage}</p>}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </RoleGate>
    </div>
  );
}
