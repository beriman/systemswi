// Tax & Regulatory Compliance Dashboard
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


type TaxItem = Record<string, string>;

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "active" || s === "completed" || s === "✅ selesai") return "bg-green-100 text-green-700";
  if (s === "pending" || s === "⏳ pending") return "bg-yellow-100 text-yellow-700";
  if (s === "expired" || s === "overdue" || s === "❌ overdue") return "bg-red-100 text-red-700";
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
  const [pajak, setPajak] = useState<TaxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceStatus, setSourceStatus] = useState<"live" | "blocked">("live");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Form states
  const [calForm, setCalForm] = useState({ taxType: "", period: "", dueDate: "", amount: "", notes: "" });
  const [docForm, setDocForm] = useState({ docType: "", docNumber: "", issueDate: "", expiryDate: "", pic: "", notes: "", proofUrl: "" });
  const [pajakForm, setPajakForm] = useState({ jenisPajak: "", keterangan: "", nominal: "", jatuhTempo: "", deadline: "", notes: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const types = ["calendar", "documents", "oss", "pajak"];
      const results = await Promise.all(types.map((t) => fetch(`/api/tax?type=${t}`, { cache: "no-store" })));
      const [calData, docData, ossData, pajakData] = await Promise.all(results.map((r) => r.json()));

      setCalendar(calData.items || []);
      setDocuments(docData.items || []);
      setOss(ossData.items || []);
      setPajak(pajakData.items || []);
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

  const handleSave = async (type: string, body: Record<string, string>) => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, action: "add", ...body }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMsg("✅ Berhasil disimpan!");
        fetchData();
      } else {
        setSaveMsg(`❌ Gagal: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setSaveMsg(`❌ Gagal: ${String(err)}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  // Calculate summary
  const pendingTax = calendar.filter((t) => t.Status === "pending").length;
  const completedTax = calendar.filter((t) => t.Status === "completed").length;
  const upcomingDue = calendar.filter((t) => isUpcoming(t["Due Date"]));
  const overdueItems = calendar.filter((t) => isOverdue(t["Due Date"]));
  const activeDocs = documents.filter((d) => d.Status === "active").length;
  const pendingDocs = documents.filter((d) => d.Status === "pending").length;
  const activeOss = oss.filter((o) => o.Status === "active").length;
  const pendingOss = oss.filter((o) => o.Status === "pending").length;
  const pendingPajak = pajak.filter((p) => p.Status?.includes("Pending")).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">🏛️ Tax & Regulatory Compliance</h2>
          <p className="text-muted-foreground">Kalender pajak, dokumen perpajakan, tracking pajak, dan status perizinan OSS</p>
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

      {saveMsg && (
        <Card className={saveMsg.startsWith("✅") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="py-3 text-sm">{saveMsg}</CardContent>
        </Card>
      )}

      {/* Summary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Kpi title="Tax Pending" value={pendingTax} accent="text-yellow-600" note="belum dilaporkan" />
        <Kpi title="Tax Completed" value={completedTax} accent="text-green-600" note="sudah dilaporkan" />
        <Kpi title="Dokumen Aktif" value={activeDocs} accent="text-green-600" note={`${pendingDocs} pending`} />
        <Kpi title="OSS Aktif" value={activeOss} accent="text-green-600" note={`${pendingOss} pending`} />
        <Kpi title="Pajak Tracked" value={pajak.length} accent="text-blue-600" note={`${pendingPajak} pending`} />
      </div>

      {/* Alerts */}
      {(overdueItems.length > 0 || upcomingDue.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {overdueItems.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-700">❌ Overdue ({overdueItems.length})</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-red-600 space-y-1">
                {overdueItems.map((t) => (
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

      <Tabs defaultValue="pajak">
        <TabsList>
          <TabsTrigger value="pajak">📊 Pajak Tracking</TabsTrigger>
          <TabsTrigger value="calendar">📅 Tax Calendar</TabsTrigger>
          <TabsTrigger value="documents">📄 Dokumen Pajak</TabsTrigger>
          <TabsTrigger value="oss">🏢 OSS Status</TabsTrigger>
        </TabsList>

        {/* === PAJAK TRACKING TAB === */}
        <TabsContent value="pajak">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pajak Tracking (Pajak_Tracking Sheet)</CardTitle>
                  <CardDescription>Semua jenis pajak: PPh 21, PPh Badan, PPN, Pajak Daerah</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}</div>
                  ) : pajak.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Belum ada data pajak tracking.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px] text-sm">
                        <thead className="text-left text-muted-foreground">
                          <tr className="border-b">
                            <th className="py-2 pr-3">Jenis Pajak</th>
                            <th className="py-2 pr-3">Keterangan</th>
                            <th className="py-2 pr-3">Nominal</th>
                            <th className="py-2 pr-3">Jatuh Tempo</th>
                            <th className="py-2 pr-3">Status</th>
                            <th className="py-2 pr-3">Deadline</th>
                            <th className="py-2 pr-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pajak.map((item) => (
                            <tr key={item.ID} className="border-b last:border-0">
                              <td className="py-2 pr-3 font-medium">{item["Jenis Pajak"]}</td>
                              <td className="py-2 pr-3 text-xs">{item.Keterangan}</td>
                              <td className="py-2 pr-3">{item.Nominal && item.Nominal !== "0" ? `Rp ${Number(item.Nominal).toLocaleString("id-ID")}` : "-"}</td>
                              <td className="py-2 pr-3">{item["Jatuh Tempo"]}</td>
                              <td className="py-2 pr-3">
                                <Badge className={statusBadge(item.Status)}>{item.Status}</Badge>
                              </td>
                              <td className="py-2 pr-3 text-xs">{item.Deadline}</td>
                              <td className="py-2 pr-3 text-xs text-muted-foreground">{item.Notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>+ Tambah Pajak</CardTitle>
                  <CardDescription>Tambah item tracking pajak baru</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Jenis Pajak</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={pajakForm.jenisPajak}
                      onChange={(e) => setPajakForm((f) => ({ ...f, jenisPajak: e.target.value }))}
                    >
                      <option value="">Pilih jenis pajak</option>
                      <option value="PPh 21">PPh 21</option>
                      <option value="PPh Badan (PPh 25/29)">PPh Badan (PPh 25/29)</option>
                      <option value="PPh Badan">PPh Badan (SPT Tahunan)</option>
                      <option value="PPN Keluaran">PPN Keluaran</option>
                      <option value="PPN Masukan">PPN Masukan</option>
                      <option value="Pajak Daerah Hiburan">Pajak Daerah Hiburan</option>
                      <option value="Pajak Reklame">Pajak Reklame</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Keterangan</Label>
                    <Input value={pajakForm.keterangan} onChange={(e) => setPajakForm((f) => ({ ...f, keterangan: e.target.value }))} placeholder="Deskripsi singkat" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Nominal</Label>
                      <Input type="number" value={pajakForm.nominal} onChange={(e) => setPajakForm((f) => ({ ...f, nominal: e.target.value }))} placeholder="0" />
                    </div>
                    <div>
                      <Label className="text-xs">Jatuh Tempo</Label>
                      <Input type="date" value={pajakForm.jatuhTempo} onChange={(e) => setPajakForm((f) => ({ ...f, jatuhTempo: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Deadline</Label>
                    <Input type="date" value={pajakForm.deadline} onChange={(e) => setPajakForm((f) => ({ ...f, deadline: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea value={pajakForm.notes} onChange={(e) => setPajakForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Catatan tambahan..." rows={2} />
                  </div>
                  <Button className="w-full" disabled={saving || !pajakForm.jenisPajak} onClick={() => handleSave("pajak", pajakForm)}>
                    {saving ? "⏳ Menyimpan..." : "💾 Simpan"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* === TAX CALENDAR TAB === */}
        <TabsContent value="calendar">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
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
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>+ Tambah Tax Calendar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Tax Type</Label>
                    <Input value={calForm.taxType} onChange={(e) => setCalForm((f) => ({ ...f, taxType: e.target.value }))} placeholder="e.g. PPN Masa" />
                  </div>
                  <div>
                    <Label className="text-xs">Period</Label>
                    <Input value={calForm.period} onChange={(e) => setCalForm((f) => ({ ...f, period: e.target.value }))} placeholder="e.g. 2026-06" />
                  </div>
                  <div>
                    <Label className="text-xs">Due Date</Label>
                    <Input type="date" value={calForm.dueDate} onChange={(e) => setCalForm((f) => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Amount</Label>
                    <Input type="number" value={calForm.amount} onChange={(e) => setCalForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea value={calForm.notes} onChange={(e) => setCalForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
                  </div>
                  <Button className="w-full" disabled={saving || !calForm.taxType} onClick={() => handleSave("calendar", calForm)}>
                    {saving ? "⏳ Menyimpan..." : "💾 Simpan"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* === DOCUMENTS TAB === */}
        <TabsContent value="documents">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
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
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>+ Tambah Dokumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Doc Type</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={docForm.docType}
                      onChange={(e) => setDocForm((f) => ({ ...f, docType: e.target.value }))}
                    >
                      <option value="">Pilih tipe dokumen</option>
                      <option value="NPWP">NPWP</option>
                      <option value="NIB">NIB</option>
                      <option value="SIUP">SIUP</option>
                      <option value="e-Faktur">e-Faktur</option>
                      <option value="BPOM">BPOM</option>
                      <option value="Halal">Halal</option>
                      <option value="SKT">SKT</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Doc Number</Label>
                    <Input value={docForm.docNumber} onChange={(e) => setDocForm((f) => ({ ...f, docNumber: e.target.value }))} placeholder="Nomor dokumen" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Issue Date</Label>
                      <Input type="date" value={docForm.issueDate} onChange={(e) => setDocForm((f) => ({ ...f, issueDate: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs">Expiry Date</Label>
                      <Input type="date" value={docForm.expiryDate} onChange={(e) => setDocForm((f) => ({ ...f, expiryDate: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">PIC</Label>
                    <Input value={docForm.pic} onChange={(e) => setDocForm((f) => ({ ...f, pic: e.target.value }))} placeholder="Penanggung jawab" />
                  </div>
                  <div>
                    <Label className="text-xs">Proof URL</Label>
                    <Input value={docForm.proofUrl} onChange={(e) => setDocForm((f) => ({ ...f, proofUrl: e.target.value }))} placeholder="https://..." />
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea value={docForm.notes} onChange={(e) => setDocForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
                  </div>
                  <Button className="w-full" disabled={saving || !docForm.docType} onClick={() => handleSave("documents", docForm)}>
                    {saving ? "⏳ Menyimpan..." : "💾 Simpan"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* === OSS TAB === */}
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
