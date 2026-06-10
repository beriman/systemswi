"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CommercialPipeline } from "@/components/events/commercial-pipeline";

interface Event {
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
  venue?: string;
  budget: number;
  actualCost: number;
  revenue: number;
  tenantCount: number;
  sponsorCount: number;
  attendeeTarget: number;
  attendeeActual: number;
  notes?: string;
  created: string;
  updated: string;
}

function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
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

function getTypeBadge(type: string) {
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

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "events" | "commercial" | "budget" | "timeline">("overview");

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setEvents(json.events || []);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // Stats
  const stats = {
    totalEvents: events.length,
    upcoming: events.filter((e) => ["planning", "open-registration"].includes(e.status)).length,
    ongoing: events.filter((e) => e.status === "ongoing").length,
    completed: events.filter((e) => e.status === "completed").length,
    totalBudget: events.reduce((s, e) => s + e.budget, 0),
    totalRevenue: events.reduce((s, e) => s + e.revenue, 0),
    totalCost: events.reduce((s, e) => s + e.actualCost, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">🎉 Event Management</h2>
          <p className="text-muted-foreground">
            Divisi Event Fragrantions — PIC: <strong>Wapiq Rizya Zaelan</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            📷 Instagram: <a href="https://www.instagram.com/fragrantions" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@fragrantions</a>
          </p>
        </div>
        <button className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 text-sm">
          + Event Baru
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { key: "overview", label: "📊 Overview" },
          { key: "events", label: "📅 Events" },
          { key: "commercial", label: "🤝 Commercial" },
          { key: "budget", label: "💰 Budget & Keuangan" },
          { key: "timeline", label: "📋 Timeline" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

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
      ) : tab === "overview" ? (
        <>
          {/* Stats KPI */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Event</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
                <div className="text-xs text-muted-foreground">{stats.upcoming} upcoming · {stats.ongoing} ongoing</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Budget</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</div>
                <div className="text-xs text-muted-foreground">Seluruh event</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
                <div className="text-xs text-muted-foreground">Sponsorship + Tenant</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Margin</CardTitle></CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.totalRevenue - stats.totalCost >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(stats.totalRevenue - stats.totalCost)}
                </div>
                <div className="text-xs text-muted-foreground">Revenue - Cost</div>
              </CardContent>
            </Card>
          </div>

          {/* Event Cards */}
          {events.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{event.name}</CardTitle>
                        <CardDescription>{event.location}</CardDescription>
                      </div>
                      <Badge className={getStatusBadge(event.status)}>{event.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipe:</span>
                        <span>{getTypeBadge(event.type)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tanggal:</span>
                        <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Budget:</span>
                        <span>{formatCurrency(event.budget)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Revenue:</span>
                        <span className="text-green-600">{formatCurrency(event.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tenant:</span>
                        <span>{event.tenantCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sponsor:</span>
                        <span>{event.sponsorCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Peserta Target:</span>
                        <span>{event.attendeeTarget.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full"
                          style={{ width: `${event.budget > 0 ? Math.min((event.revenue / event.budget) * 100, 100) : 0}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 text-right">
                        {event.budget > 0 ? ((event.revenue / event.budget) * 100).toFixed(1) : 0}% tercapai
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-lg font-semibold mb-2">Belum Ada Event</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Mulai buat event pertama untuk Fragrantions!
                </p>
                <p className="text-xs text-muted-foreground">
                  Data akan tersimpan di Google Sheets dan terhubung otomatis.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : tab === "events" ? (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Event</CardTitle>
            <CardDescription>Semua event Fragrantions & SWI</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="font-medium">{event.name}</div>
                          <div className="text-xs text-muted-foreground">{event.pic}</div>
                        </TableCell>
                        <TableCell>{getTypeBadge(event.type)}</TableCell>
                        <TableCell><Badge className={getStatusBadge(event.status)}>{event.status}</Badge></TableCell>
                        <TableCell className="text-xs">{formatDate(event.startDate)}</TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell className="text-right">{formatCurrency(event.budget)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatCurrency(event.revenue)}</TableCell>
                        <TableCell className={`text-right ${event.revenue - event.actualCost >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(event.revenue - event.actualCost)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Belum ada event. Klik &quot;+ Event Baru&quot; untuk memulai.
              </div>
            )}
          </CardContent>
        </Card>
      ) : tab === "commercial" ? (
        <CommercialPipeline events={events.map((event) => ({ id: event.id, name: event.name }))} />
      ) : tab === "budget" ? (
        <Card>
          <CardHeader>
            <CardTitle>💰 Budget & Keuangan Event</CardTitle>
            <CardDescription>Ringkasan keuangan seluruh event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="p-4 border rounded-lg bg-blue-50">
                <div className="text-xs text-muted-foreground">Total Budget</div>
                <div className="text-xl font-bold">{formatCurrency(stats.totalBudget)}</div>
              </div>
              <div className="p-4 border rounded-lg bg-green-50">
                <div className="text-xs text-muted-foreground">Total Revenue</div>
                <div className="text-xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
              </div>
              <div className="p-4 border rounded-lg bg-red-50">
                <div className="text-xs text-muted-foreground">Total Cost</div>
                <div className="text-xl font-bold text-red-600">{formatCurrency(stats.totalCost)}</div>
              </div>
            </div>
            {events.length > 0 ? (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Actual Cost</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Profit/Loss</TableHead>
                      <TableHead>% Budget Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => {
                      const profit = event.revenue - event.actualCost;
                      const budgetUsed = event.budget > 0 ? (event.actualCost / event.budget) * 100 : 0;
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.name}</TableCell>
                          <TableCell className="text-right">{formatCurrency(event.budget)}</TableCell>
                          <TableCell className="text-right text-red-600">{formatCurrency(event.actualCost)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatCurrency(event.revenue)}</TableCell>
                          <TableCell className={`text-right font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(profit)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${budgetUsed > 100 ? "bg-red-500" : "bg-blue-500"}`}
                                  style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs">{budgetUsed.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Belum ada data budget.
              </div>
            )}
          </CardContent>
        </Card>
      ) : tab === "timeline" ? (
        <Card>
          <CardHeader>
            <CardTitle>📋 Timeline Event</CardTitle>
            <CardDescription>Milestone dan deadline per event</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <div className="space-y-6">
                {events.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{event.name}</h4>
                        <p className="text-sm text-muted-foreground">{formatDate(event.startDate)} — {formatDate(event.endDate)}</p>
                      </div>
                      <Badge className={getStatusBadge(event.status)}>{event.status}</Badge>
                    </div>
                    <div className="space-y-2">
                      {[
                        { phase: "Konsep", date: "T-180 hari", done: true },
                        { phase: "Venue Booking", date: "T-120 hari", done: true },
                        { phase: "Sponsorship", date: "T-90 hari", done: event.sponsorCount > 0 },
                        { phase: "Tenant Recruitment", date: "T-60 hari", done: event.tenantCount > 0 },
                        { phase: "Marketing Launch", date: "T-30 hari", done: false },
                        { phase: "Event Day", date: formatDate(event.startDate), done: event.status === "completed" },
                        { phase: "Settlement", date: "T+7 hari", done: false },
                      ].map((ms, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${ms.done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                            {ms.done ? "✓" : ""}
                          </div>
                          <span className={ms.done ? "text-green-600 font-medium" : "text-muted-foreground"}>{ms.phase}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{ms.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Belum ada timeline event.
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
