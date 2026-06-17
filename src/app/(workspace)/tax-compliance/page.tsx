// Tax & Regulatory Compliance Dashboard
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TaxItem = Record<string, string>;

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "active" || s === "completed") return "bg-green-100 text-green-700";
  if (s === "pending") return "bg-yellow-100 text-yellow-700";
  if (s === "expired" || s === "overdue") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

function formatDate(date: string) {
  if (!date) return "TBA";
  return date;
}

function isUpcoming(dueDate: string, days = 14) {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

function isOverdue(dueDate: string) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export default function TaxCompliancePage() {
  const [calendar, setCalendar] = useState<TaxItem[]>([]);
  const [documents, setDocuments] = useState<TaxItem[]>([]);
  const [oss, setOss] = useState<TaxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceStatus, setSourceStatus] = useState<"live" | "blocked">("live");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const types = ["calendar", "documents", "oss"];
      const results = await Promise.all(types.map((t) => fetch(`/api/tax?type=${t}`, { cache: "no-store" })));
      const [calData, docData, ossData] = await Promise.all(results.map((r) => r.json()));

      setCalendar(calData.items || []);
      setDocuments(docData.items || []);
      setOss(ossData.items || []);
      setSourceStatus(calData.sourceStatus || "live");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate summary
  const pendingTax = calendar.filter((t) => t.Status === "pending").length;
  const completedTax = calendar.filter((t) => t.Status === "completed").length;
  const upcomingDue = calendar.filter((t) => isUpcoming(t["Due Date"]));
  const overdue = calendar.filter((t) => isOverdue(t["Due Date"]));
  const activeDocs = documents.filter((d) => d.Status === "active").length;
  const pendingDocs = documents.filter((d) => d.Status === "pending").length;
  const activeOss = oss.filter((o) => o.Status === "active").length;
  const pendingOss = oss.filter((o) => o.Status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">🏛️ Tax & Regulatory Compliance</h2>
          <p className="text-muted-foreground">Kalender pajak, dokumen perpajakan, dan status perizinan OSS</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          🔄 Refresh
        </Button>
      </div>

      {sourceStatus === "blocked" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-3 text-yellow-700 text-sm">
            ⚠️ Google OAuth tidak valid. Data tidak bisa dimuat dari Sheets.
          </CardContent>
        </Card>
      )}

      {/* Summary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Tax Pending" value={pendingTax} accent="text-yellow-600" note="belum dilaporkan" />
        <Kpi title="Tax Completed" value={completedTax} accent="text-green-600" note="sudah dilaporkan" />
        <Kpi title="Dokumen Aktif" value={activeDocs} accent="text-green-600" note={`${pendingDocs} pending`} />
        <Kpi title="OSS Aktif" value={activeOss} accent="text-green-600" note={`${pendingOss} pending`} />
      </div>

      {/* Alerts */}
      {(overdue.length > 0 || upcomingDue.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {overdue.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-700">❌ Overdue ({overdue.length})</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-red-600 space-y-1">
                {overdue.map((t) => (
                  <div key={t.ID}>{t["Tax Type"]} — {t.Period} (due: {t["Due Date"]})</div>
                ))}
              </CardContent>
            </Card>
          )}
          {upcomingDue.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-yellow-700">⚠️ Jatuh Tempo ≤14 Hari ({upcomingDue.length})</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-yellow-600 space-y-1">
                {upcomingDue.map((t) => (
                  <div key={t.ID}>{t["Tax Type"]} — {t.Period} (due: {t["Due Date"]})</div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">📅 Tax Calendar</TabsTrigger>
          <TabsTrigger value="documents">📄 Dokumen Pajak</TabsTrigger>
          <TabsTrigger value="oss">🏢 OSS Status</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Tax Calendar 2026</CardTitle>
              <CardDescription>Jatuh tempo pelaporan dan pembayaran pajak</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}</div>
              ) : calendar.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada data tax calendar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr className="border-b">
                        <th className="py-2 pr-3">Type</th>
                        <th className="py-2 pr-3">Period</th>
                        <th className="py-2 pr-3">Due Date</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Amount</th>
                        <th className="py-2 pr-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calendar.map((item) => (
                        <tr key={item.ID} className="border-b last:border-0">
                          <td className="py-2 pr-3 font-medium">{item["Tax Type"]}</td>
                          <td className="py-2 pr-3">{item.Period}</td>
                          <td className="py-2 pr-3">
                            <span className={isOverdue(item["Due Date"]) ? "text-red-600 font-medium" : ""}>
                              {formatDate(item["Due Date"])}
                            </span>
                          </td>
                          <td className="py-2 pr-3">
                            <Badge className={statusBadge(item.Status)}>{item.Status}</Badge>
                          </td>
                          <td className="py-2 pr-3">{item.Amount ? `Rp ${Number(item.Amount).toLocaleString("id-ID")}` : "-"}</td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground">{item.Notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Dokumen Pajak & Perizinan</CardTitle>
              <CardDescription>NPWP, NIB, SIUP, e-Faktur, BPOM, Halal</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}</div>
              ) : documents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada data dokumen.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr className="border-b">
                        <th className="py-2 pr-3">Type</th>
                        <th className="py-2 pr-3">Number</th>
                        <th className="py-2 pr-3">Issue Date</th>
                        <th className="py-2 pr-3">Expiry</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">PIC</th>
                        <th className="py-2 pr-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.ID} className="border-b last:border-0">
                          <td className="py-2 pr-3 font-medium">{doc["Doc Type"]}</td>
                          <td className="py-2 pr-3 text-xs">{doc["Doc Number"] || "-"}</td>
                          <td className="py-2 pr-3">{formatDate(doc["Issue Date"])}</td>
                          <td className="py-2 pr-3">{formatDate(doc["Expiry Date"])}</td>
                          <td className="py-2 pr-3">
                            <Badge className={statusBadge(doc.Status)}>{doc.Status}</Badge>
                          </td>
                          <td className="py-2 pr-3">{doc.PIC}</td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground">{doc.Notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oss">
          <Card>
            <CardHeader>
              <CardTitle>OSS Status (Online Single Submission)</CardTitle>
              <CardDescription>Status perizinan via OSS: NIB, SIUP, TDP, LKPM</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}</div>
              ) : oss.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada data OSS.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr className="border-b">
                        <th className="py-2 pr-3">Permit Type</th>
                        <th className="py-2 pr-3">Number</th>
                        <th className="py-2 pr-3">Issue Date</th>
                        <th className="py-2 pr-3">Expiry</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">OSS Link</th>
                        <th className="py-2 pr-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oss.map((item) => (
                        <tr key={item.ID} className="border-b last:border-0">
                          <td className="py-2 pr-3 font-medium">{item["Permit Type"]}</td>
                          <td className="py-2 pr-3 text-xs">{item.Number || "-"}</td>
                          <td className="py-2 pr-3">{formatDate(item["Issue Date"])}</td>
                          <td className="py-2 pr-3">{formatDate(item["Expiry Date"])}</td>
                          <td className="py-2 pr-3">
                            <Badge className={statusBadge(item.Status)}>{item.Status}</Badge>
                          </td>
                          <td className="py-2 pr-3 text-xs">
                            {item["OSS Link"] ? (
                              <a href={item["OSS Link"]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                oss.go.id
                              </a>
                            ) : "-"}
                          </td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground">{item.Notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ title, value, note, accent = "" }: { title: string; value: number; note: string; accent?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accent}`}>{value}</div>
        <div className="text-xs text-muted-foreground">{note}</div>
      </CardContent>
    </Card>
  );
}
