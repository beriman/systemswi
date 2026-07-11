"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ── Types ──
interface Expense {
  id: string;
  date: string;
  submitterName: string;
  relatedEvent: string;
  category: string;
  description: string;
  amount: number;
  proofUrl: string;
  status: string;
  reviewedBy?: string;
  reviewedDate?: string;
  notes?: string;
  division?: string;
  coaCategory?: string;
  paymentMethod?: string;
  relatedBrand?: string;
  proofRequired?: string;
  shareholderDebtFlag?: string;
  vendorId?: string;
  vendorName?: string;
  vendorRelatedParty?: string;
  vendorBenchmarkNotes?: string;
}

interface ExpenseStats {
  total: number;
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  approvedThisMonthCount: number;
  approvedThisMonthAmount: number;
  rejectedCount: number;
  rejectedAmount: number;
  needsProofCount?: number;
  needsProofAmount?: number;
  withoutDivisionCount?: number;
  personalPaidCount?: number;
  personalPaidAmount?: number;
  vendorRequiredCount?: number;
  withoutVendorCount?: number;
  vendorRelatedPartyCount?: number;
}

interface ExpenseApiResponse {
  sourceStatus?: string;
  expenses?: Expense[];
  stats?: ExpenseStats;
  budgetVsActual?: Record<string, { budget: number; actual: number }>;
  error?: string;
}

interface EventOption {
  id: string;
  name: string;
}

interface EventsApiResponse {
  events?: EventOption[];
}

interface ExpenseSubmissionPayload {
  date: string;
  submitterName: string;
  relatedEvent: string;
  category: string;
  description: string;
  amount: number;
  division: string;
  coaCategory: string;
  paymentMethod: string;
  relatedBrand: string;
  notes: string;
  proofUrl?: string;
  vendorId?: string;
  vendorName?: string;
  vendorRelatedParty?: string;
  vendorBenchmarkNotes?: string;
}

interface VendorOption {
  id: string;
  name: string;
  category: string;
  relatedParty: string;
}

interface VendorApiResponse {
  vendors?: VendorOption[];
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
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function getStatusBadge(status: string) {
  const s = (status || "Pending").toLowerCase();
  if (s === "approved") return "bg-green-100 text-green-700";
  if (s === "rejected") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
}

function getStatusEmoji(status: string) {
  const s = (status || "Pending").toLowerCase();
  if (s === "approved") return "✅";
  if (s === "rejected") return "❌";
  return "🟡";
}

const CATEGORIES = ["Bahan Baku", "Iklan", "Sewa Booth", "Transport", "Packaging", "Lainnya"];
const DIVISIONS = ["Produksi", "Event", "Website", "Store", "Holding"];
const PAYMENT_METHODS = ["Company Paid", "Cash", "Bank", "Personal Paid"];
const RELATED_BRANDS = ["SWI Holding", "L'Arc~en~Scent", "Pixel Potion", "Nuscentza"];

// ── Main Page Component ──
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [budgetVsActual, setBudgetVsActual] = useState<Record<string, { budget: number; actual: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"dashboard" | "submissions" | "pending" | "all">("dashboard");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Filter states
  const [filterStatus, setFilterStatus] = useState("");
  const [filterEvent, setFilterEvent] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Events list for dropdown
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);

  useEffect(() => {
    fetchExpenses();
    fetchEvents();
    fetchVendors();
  }, []);

  async function fetchExpenses() {
    try {
      setLoading(true);
      const res = await fetch("/api/expenses");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ExpenseApiResponse = await res.json();
      if (json.sourceStatus === "degraded") {
        setError("Google Sheets tidak tersedia. Data mungkin tidak lengkap.");
      }
      setExpenses(json.expenses || []);
      setStats(json.stats || null);
      setBudgetVsActual(json.budgetVsActual || {});
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function fetchEvents() {
    try {
      const res = await fetch("/api/events");
      if (!res.ok) return;
      const json: EventsApiResponse = await res.json();
      setEvents((json.events || []).map((e) => ({ id: e.id, name: e.name })));
    } catch {
      // Events API may not be available
    }
  }

  async function fetchVendors() {
    try {
      const res = await fetch("/api/governance/vendor-register");
      if (!res.ok) return;
      const json: VendorApiResponse = await res.json();
      setVendors(json.vendors || []);
    } catch {
      // Vendor register may not be available; manual vendor fields still work
    }
  }

  async function handleSubmitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormMessage(null);
    const form = new FormData(event.currentTarget);

    const proofFile = form.get("proofFile") as File | null;
    const payload: ExpenseSubmissionPayload = {
      date: String(form.get("date") || ""),
      submitterName: String(form.get("submitterName") || ""),
      relatedEvent: String(form.get("relatedEvent") || ""),
      category: String(form.get("category") || "Lainnya"),
      description: String(form.get("description") || ""),
      amount: Number(form.get("amount") || 0),
      division: String(form.get("division") || ""),
      coaCategory: String(form.get("coaCategory") || ""),
      paymentMethod: String(form.get("paymentMethod") || "Company Paid"),
      relatedBrand: String(form.get("relatedBrand") || ""),
      notes: String(form.get("notes") || ""),
      vendorId: String(form.get("vendorId") || ""),
      vendorName: String(form.get("vendorName") || ""),
      vendorRelatedParty: String(form.get("vendorRelatedParty") || "No"),
      vendorBenchmarkNotes: String(form.get("vendorBenchmarkNotes") || ""),
    };

    if (!payload.submitterName || !payload.amount) {
      setFormMessage("Nama submitter dan amount wajib diisi.");
      setSubmitting(false);
      return;
    }

    try {
      // Step 1: Upload proof file if provided
      if (proofFile && proofFile.size > 0) {
        setFormMessage("Mengupload bukti...");
        const uploadForm = new FormData();
        uploadForm.append("file", proofFile);
        const uploadRes = await fetch("/api/expenses/upload", {
          method: "POST",
          body: uploadForm,
        });
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          if (uploadJson.file?.id) {
            payload.proofUrl = uploadJson.file.id;
          }
        }
        // If upload fails, continue without proof — don't block submission
      }

      // Step 2: Submit expense
      setFormMessage("Mengirim submission...");
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.details || `HTTP ${res.status}`);
      setFormMessage(`✅ Expense "${payload.description}" berhasil di-submit! ID: ${json.submissionId}`);
      setShowForm(false);
      event.currentTarget.reset();
      fetchExpenses();
    } catch (err) {
      setFormMessage(`❌ Gagal submit: ${String(err).replace(/^Error:\s*/, "")}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id: string, action: "Approved" | "Rejected") {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action,
          reviewedBy: "Beriman Juliano",
          notes: action === "Approved" ? "Approved by director" : "Rejected",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.details || `HTTP ${res.status}`);
      fetchExpenses();
    } catch (err) {
      alert(`Gagal ${action.toLowerCase()}: ${String(err)}`);
    } finally {
      setApprovingId(null);
    }
  }

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    if (filterStatus && e.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (filterEvent && !e.relatedEvent.toLowerCase().includes(filterEvent.toLowerCase())) return false;
    if (filterCategory && e.category.toLowerCase() !== filterCategory.toLowerCase()) return false;
    return true;
  });

  const pendingExpenses = expenses.filter((e) => (e.status || "Pending") === "Pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">💰 Expense Approval</h2>
          <p className="text-muted-foreground">
            Kelola pengeluaran dengan approval flow — Direktur: <strong>Beriman Juliano</strong>
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 text-sm"
        >
          + Submit Expense
        </button>
      </div>

      {/* Form Message */}
      {formMessage && (
        <div className={`px-4 py-3 rounded-lg text-sm ${formMessage.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {formMessage}
          <button onClick={() => setFormMessage(null)} className="ml-3 text-xs underline">Tutup</button>
        </div>
      )}

      {/* Submit Form Modal */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>📝 Submit Expense Baru</CardTitle>
            <CardDescription>Isi form berikut untuk mengajukan expense baru</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="submitterName">Nama Submitter *</Label>
                  <Input id="submitterName" name="submitterName" placeholder="Nama Anda" required />
                </div>
                <div>
                  <Label htmlFor="date">Tanggal</Label>
                  <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
                <div>
                  <Label htmlFor="relatedEvent">Related Event/Project</Label>
                  <select
                    id="relatedEvent"
                    name="relatedEvent"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">-- Pilih Event --</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.name}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <select
                    id="category"
                    name="category"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    defaultValue="Lainnya"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="division">Division *</Label>
                  <select id="division" name="division" className="w-full border rounded-md px-3 py-2 text-sm" required>
                    <option value="">-- Pilih Division --</option>
                    {DIVISIONS.map((division) => (
                      <option key={division} value={division}>{division}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="coaCategory">COA Category</Label>
                  <Input id="coaCategory" name="coaCategory" placeholder="Ikut kategori / COA" />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select id="paymentMethod" name="paymentMethod" className="w-full border rounded-md px-3 py-2 text-sm" defaultValue="Company Paid">
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">Personal Paid ditandai sebagai hutang pemegang saham setelah approved.</p>
                </div>
                <div>
                  <Label htmlFor="relatedBrand">Related Brand</Label>
                  <select id="relatedBrand" name="relatedBrand" className="w-full border rounded-md px-3 py-2 text-sm" defaultValue="SWI Holding">
                    <option value="">-- Tidak spesifik --</option>
                    {RELATED_BRANDS.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="vendorId">Vendor Register</Label>
                  <select id="vendorId" name="vendorId" className="w-full border rounded-md px-3 py-2 text-sm">
                    <option value="">-- Belum dikaitkan --</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>{vendor.name} — {vendor.category}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">Wajib untuk Bahan Baku, Packaging, dan Sewa Booth jika vendor sudah tercatat.</p>
                </div>
                <div>
                  <Label htmlFor="vendorName">Nama Vendor Manual</Label>
                  <Input id="vendorName" name="vendorName" placeholder="Isi jika belum ada di Vendor_Register" />
                </div>
                <div>
                  <Label htmlFor="vendorRelatedParty">Related Party Vendor?</Label>
                  <select id="vendorRelatedParty" name="vendorRelatedParty" className="w-full border rounded-md px-3 py-2 text-sm" defaultValue="No">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="vendorBenchmarkNotes">Benchmark / COI Notes</Label>
                  <Input id="vendorBenchmarkNotes" name="vendorBenchmarkNotes" placeholder="Pembanding harga / alasan pemilihan" />
                </div>
                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Input id="description" name="description" placeholder="Deskripsi pengeluaran" />
                </div>
                <div>
                  <Label htmlFor="amount">Amount (Rp) *</Label>
                  <Input id="amount" name="amount" type="number" placeholder="0" required min="0" />
                </div>
                <div>
                  <Label htmlFor="proofFile">Bukti (Foto/PDF)</Label>
                  <input
                    id="proofFile"
                    name="proofFile"
                    type="file"
                    accept="image/*,application/pdf"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Upload foto struk atau invoice (maks 10MB)</p>
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Catatan tambahan (opsional)" rows={2} />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 text-sm disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Expense"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 text-sm"
                >
                  Batal
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { key: "dashboard", label: "📊 Dashboard" },
          { key: "submissions", label: "📝 My Submissions" },
          { key: "pending", label: "⏳ Pending Approvals" },
          { key: "all", label: "📋 All Expenses" },
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

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-lg text-sm bg-yellow-50 text-yellow-700 border border-yellow-200">
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-32" /></CardContent>
            </Card>
          ))}
        </div>
      ) : tab === "dashboard" ? (
        <>
          {/* Stats KPI */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Pending</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats?.pendingCount || 0}</div>
                <div className="text-xs text-muted-foreground">{formatCurrency(stats?.pendingAmount || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Approved Bulan Ini</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.approvedThisMonthCount || 0}</div>
                <div className="text-xs text-muted-foreground">{formatCurrency(stats?.approvedThisMonthAmount || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Approved</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.approvedCount || 0}</div>
                <div className="text-xs text-muted-foreground">{formatCurrency(stats?.approvedAmount || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Rejected</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats?.rejectedCount || 0}</div>
                <div className="text-xs text-muted-foreground">{formatCurrency(stats?.rejectedAmount || 0)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-amber-200 bg-amber-50/60">
            <CardHeader>
              <CardTitle className="text-base text-amber-900">⚖️ TARIF Governance Warnings</CardTitle>
              <CardDescription>Angka berasal dari Expense_Submissions; kosong berarti belum dicatat, bukan diasumsikan aman.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-4 text-sm">
                <div><div className="font-semibold">Needs Proof</div><div>{stats?.needsProofCount || 0} item — {formatCurrency(stats?.needsProofAmount || 0)}</div></div>
                <div><div className="font-semibold">Tanpa Division</div><div>{stats?.withoutDivisionCount || 0} item</div></div>
                <div><div className="font-semibold">Personal Paid</div><div>{stats?.personalPaidCount || 0} item — {formatCurrency(stats?.personalPaidAmount || 0)}</div></div>
                <div><div className="font-semibold">Vendor/COI</div><div>{stats?.withoutVendorCount || 0}/{stats?.vendorRequiredCount || 0} butuh vendor link; {stats?.vendorRelatedPartyCount || 0} related-party</div></div>
              </div>
            </CardContent>
          </Card>

          {/* Budget vs Actual per Event */}
          {Object.keys(budgetVsActual).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>💰 Budget vs Actual per Event</CardTitle>
                <CardDescription>Perbandingan budget dengan pengeluaran yang sudah di-approve</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead className="text-right">Actual (Approved)</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead>% Used</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(budgetVsActual).map(([event, data]) => {
                        const remaining = data.budget - data.actual;
                        const pct = data.budget > 0 ? (data.actual / data.budget) * 100 : 0;
                        return (
                          <TableRow key={event}>
                            <TableCell className="font-medium">{event || "Tanpa Event"}</TableCell>
                            <TableCell className="text-right">{formatCurrency(data.budget)}</TableCell>
                            <TableCell className="text-right text-red-600">{formatCurrency(data.actual)}</TableCell>
                            <TableCell className={`text-right font-bold ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(remaining)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${pct > 100 ? "bg-red-500" : "bg-blue-500"}`}
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs">{pct.toFixed(0)}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Submissions */}
          <Card>
            <CardHeader>
              <CardTitle>📝 Recent Submissions (Last 10)</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length > 0 ? (
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Submitter</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.slice(0, 10).map((exp) => (
                        <TableRow key={exp.id}>
                          <TableCell className="text-xs font-mono">{exp.id}</TableCell>
                          <TableCell className="text-xs">{formatDate(exp.date)}</TableCell>
                          <TableCell>{exp.submitterName}</TableCell>
                          <TableCell>{exp.relatedEvent || "-"}</TableCell>
                          <TableCell>{exp.category}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{exp.description}</TableCell>
                          <TableCell className="text-right">{formatCurrency(exp.amount)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(exp.status)}>
                              {getStatusEmoji(exp.status)} {exp.status || "Pending"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Belum ada expense. Klik &quot;+ Submit Expense&quot; untuk memulai.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : tab === "submissions" ? (
        <Card>
          <CardHeader>
            <CardTitle>📝 My Submissions</CardTitle>
            <CardDescription>Semua expense yang sudah Anda submit</CardDescription>
          </CardHeader>
          <CardContent>
            {expenses.length > 0 ? (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reviewed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell className="text-xs font-mono">{exp.id}</TableCell>
                        <TableCell className="text-xs">{formatDate(exp.date)}</TableCell>
                        <TableCell>{exp.relatedEvent || "-"}</TableCell>
                        <TableCell>{exp.category}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{exp.description}</TableCell>
                        <TableCell className="text-right">{formatCurrency(exp.amount)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(exp.status)}>
                            {getStatusEmoji(exp.status)} {exp.status || "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>{exp.reviewedBy || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Belum ada submission.
              </div>
            )}
          </CardContent>
        </Card>
      ) : tab === "pending" ? (
        <Card>
          <CardHeader>
            <CardTitle>⏳ Pending Approvals</CardTitle>
            <CardDescription>
              {pendingExpenses.length} expense menunggu approval — Total: {formatCurrency(pendingExpenses.reduce((s, e) => s + e.amount, 0))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingExpenses.length > 0 ? (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Submitter</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Proof</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingExpenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell className="text-xs font-mono">{exp.id}</TableCell>
                        <TableCell className="text-xs">{formatDate(exp.date)}</TableCell>
                        <TableCell>{exp.submitterName}</TableCell>
                        <TableCell>{exp.relatedEvent || "-"}</TableCell>
                        <TableCell>{exp.category}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{exp.description}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(exp.amount)}</TableCell>
                        <TableCell>
                          {exp.proofUrl ? (
                            <a
                              href={`https://drive.google.com/file/d/${exp.proofUrl}/view`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs"
                            >
                              📎 View
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleApprove(exp.id, "Approved")}
                              disabled={approvingId === exp.id}
                              className="bg-green-600 text-white text-xs py-1 px-2 rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => handleApprove(exp.id, "Rejected")}
                              disabled={approvingId === exp.id}
                              className="bg-red-600 text-white text-xs py-1 px-2 rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              ❌ Reject
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                ✅ Tidak ada pending approval. Semua expense sudah di-review.
              </div>
            )}
          </CardContent>
        </Card>
      ) : tab === "all" ? (
        <Card>
          <CardHeader>
            <CardTitle>📋 All Expenses (Riwayat)</CardTitle>
            <CardDescription>Semua expense dengan filter</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label>Status</Label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Semua Status</option>
                  <option value="Pending">🟡 Pending</option>
                  <option value="Approved">✅ Approved</option>
                  <option value="Rejected">❌ Rejected</option>
                </select>
              </div>
              <div>
                <Label>Event</Label>
                <Input
                  value={filterEvent}
                  onChange={(e) => setFilterEvent(e.target.value)}
                  placeholder="Cari event..."
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Semua Kategori</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredExpenses.length > 0 ? (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Submitter</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reviewed By</TableHead>
                      <TableHead>Reviewed Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell className="text-xs font-mono">{exp.id}</TableCell>
                        <TableCell className="text-xs">{formatDate(exp.date)}</TableCell>
                        <TableCell>{exp.submitterName}</TableCell>
                        <TableCell>{exp.relatedEvent || "-"}</TableCell>
                        <TableCell>{exp.category}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{exp.description}</TableCell>
                        <TableCell className="text-right">{formatCurrency(exp.amount)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(exp.status)}>
                            {getStatusEmoji(exp.status)} {exp.status || "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>{exp.reviewedBy || "-"}</TableCell>
                        <TableCell className="text-xs">{formatDate(exp.reviewedDate || "")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Tidak ada expense sesuai filter.
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
