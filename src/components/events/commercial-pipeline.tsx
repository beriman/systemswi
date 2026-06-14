"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface EventOption {
  id: string;
  name: string;
}

interface TenantRecord {
  id: string;
  eventId: string;
  brandName: string;
  contactPerson: string;
  boothNumber: string;
  packageType: string;
  fee: number;
  paymentStatus: string;
  paymentAmount: number;
  notes: string;
}

interface SponsorRecord {
  id: string;
  eventId: string;
  companyName: string;
  contactPerson: string;
  tier: string;
  sponsorshipAmount: number;
  inKindValue: number;
  paymentStatus: string;
  notes: string;
}

interface CommercialData {
  tenants: TenantRecord[];
  sponsors: SponsorRecord[];
  summary: {
    tenantCount: number;
    sponsorCount: number;
    paidTenants: number;
    paidSponsors: number;
    tenantRevenue: number;
    sponsorRevenue: number;
    commercialRevenue: number;
    outstanding: number;
    followUpsDue: number;
  };
}

const emptyData: CommercialData = {
  tenants: [],
  sponsors: [],
  summary: {
    tenantCount: 0,
    sponsorCount: 0,
    paidTenants: 0,
    paidSponsors: 0,
    tenantRevenue: 0,
    sponsorRevenue: 0,
    commercialRevenue: 0,
    outstanding: 0,
    followUpsDue: 0,
  },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700",
    partial: "bg-amber-100 text-amber-700",
    "invoice-sent": "bg-blue-100 text-blue-700",
    "follow-up": "bg-purple-100 text-purple-700",
    prospect: "bg-slate-100 text-slate-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return map[status] || map.prospect;
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
      />
    </label>
  );
}

export function CommercialPipeline({ events }: { events: EventOption[] }) {
  const [data, setData] = useState<CommercialData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kind, setKind] = useState<"tenant" | "sponsor">("tenant");
  const [message, setMessage] = useState<string | null>(null);

  const eventLookup = useMemo(() => new Map(events.map((event) => [event.id, event.name])), [events]);

  async function loadCommercialData() {
    setLoading(true);
    try {
      const res = await fetch("/api/events/commercial");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData({ ...emptyData, ...json });
    } catch (error) {
      setMessage(`Gagal memuat pipeline: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommercialData();
  }, []);

  async function handleSubmit(formData: FormData) {
    if (!events.length) {
      setMessage("Buat event dulu sebelum menambahkan tenant/sponsor.");
      return;
    }

    setSaving(true);
    setMessage(null);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/events/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, kind }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.details || `HTTP ${res.status}`);
      const auditNote = json.auditStatus ? ` Audit: ${json.auditStatus}.` : "";
      setMessage(`✅ ${kind === "tenant" ? "Tenant" : "Sponsor"} tersimpan ke Google Sheets.${auditNote}`);
      await loadCommercialData();
    } catch (error) {
      setMessage(`Gagal menyimpan: ${String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tenant</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data.summary.tenantCount}</div><p className="text-xs text-muted-foreground">{data.summary.paidTenants} lunas</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Sponsor</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data.summary.sponsorCount}</div><p className="text-xs text-muted-foreground">{data.summary.paidSponsors} lunas</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Revenue Komersial</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{formatCurrency(data.summary.commercialRevenue)}</div><p className="text-xs text-muted-foreground">Tenant + sponsor + in-kind</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Follow-up</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-600">{data.summary.followUpsDue}</div><p className="text-xs text-muted-foreground">Outstanding {formatCurrency(data.summary.outstanding)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>➕ Input Tenant / Sponsor</CardTitle>
          <CardDescription>Data masuk ke Google Sheets dan otomatis meng-update revenue/count event.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => setKind("tenant")} className={`rounded-md px-4 py-2 text-sm ${kind === "tenant" ? "bg-purple-600 text-white" : "bg-muted"}`}>Tenant</button>
            <button type="button" onClick={() => setKind("sponsor")} className={`rounded-md px-4 py-2 text-sm ${kind === "sponsor" ? "bg-purple-600 text-white" : "bg-muted"}`}>Sponsor</button>
          </div>

          <form action={handleSubmit} className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-muted-foreground">Event</span>
              <select name="eventId" className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500" required>
                {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
              </select>
            </label>

            {kind === "tenant" ? (
              <>
                <Field name="brandName" label="Brand Tenant" placeholder="Nama brand tenant" />
                <Field name="contactPerson" label="PIC" placeholder="Nama kontak" />
                <Field name="boothNumber" label="Booth" placeholder="A1 / TBA" />
                <Field name="packageType" label="Paket" placeholder="standard / premium" />
                <Field name="fee" label="Fee" type="number" placeholder="0" />
                <Field name="paymentAmount" label="Sudah Dibayar" type="number" placeholder="0" />
              </>
            ) : (
              <>
                <Field name="companyName" label="Perusahaan Sponsor" placeholder="Nama perusahaan" />
                <Field name="contactPerson" label="PIC" placeholder="Nama kontak" />
                <Field name="tier" label="Tier" placeholder="gold / silver / media" />
                <Field name="sponsorshipAmount" label="Nilai Sponsor" type="number" placeholder="0" />
                <Field name="inKindValue" label="Nilai In-kind" type="number" placeholder="0" />
                <Field name="logoUrl" label="Logo/Deck URL" placeholder="Drive/website URL" />
              </>
            )}

            <label className="space-y-1 text-sm">
              <span className="font-medium text-muted-foreground">Status</span>
              <select name="paymentStatus" className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500">
                <option value="prospect">Prospect</option>
                <option value="follow-up">Follow-up</option>
                <option value="invoice-sent">Invoice sent</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <Field name="contractDate" label="Tanggal Kontrak" type="date" />
            <Field name="notes" label="Catatan / Deliverables" placeholder="Invoice, agreement, deliverables, follow-up" />
            <div className="md:col-span-3 flex items-center gap-3">
              <button disabled={saving || !events.length} className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan ke Sheets"}
              </button>
              {message && <span className="text-sm text-muted-foreground">{message}</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tenant Pipeline</CardTitle><CardDescription>Booth assignment, invoice/payment, dan catatan deliverables.</CardDescription></CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-muted-foreground">Memuat...</p> : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Tenant</TableHead><TableHead>Event</TableHead><TableHead>Booth</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Paid/Fee</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell><div className="font-medium">{tenant.brandName}</div><div className="text-xs text-muted-foreground">{tenant.contactPerson || tenant.notes}</div></TableCell>
                        <TableCell>{eventLookup.get(tenant.eventId) || tenant.eventId}</TableCell>
                        <TableCell>{tenant.boothNumber}</TableCell>
                        <TableCell><Badge className={statusBadgeClass(tenant.paymentStatus)}>{tenant.paymentStatus}</Badge></TableCell>
                        <TableCell className="text-right">{formatCurrency(tenant.paymentAmount)} / {formatCurrency(tenant.fee)}</TableCell>
                      </TableRow>
                    ))}
                    {!data.tenants.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada tenant.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sponsor Pipeline</CardTitle><CardDescription>Tier sponsorship, nilai cash/in-kind, status kontrak, dan logo/deck.</CardDescription></CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-muted-foreground">Memuat...</p> : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Sponsor</TableHead><TableHead>Event</TableHead><TableHead>Tier</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Value</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.sponsors.map((sponsor) => (
                      <TableRow key={sponsor.id}>
                        <TableCell><div className="font-medium">{sponsor.companyName}</div><div className="text-xs text-muted-foreground">{sponsor.contactPerson || sponsor.notes}</div></TableCell>
                        <TableCell>{eventLookup.get(sponsor.eventId) || sponsor.eventId}</TableCell>
                        <TableCell>{sponsor.tier}</TableCell>
                        <TableCell><Badge className={statusBadgeClass(sponsor.paymentStatus)}>{sponsor.paymentStatus}</Badge></TableCell>
                        <TableCell className="text-right">{formatCurrency(sponsor.sponsorshipAmount + sponsor.inKindValue)}</TableCell>
                      </TableRow>
                    ))}
                    {!data.sponsors.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada sponsor.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
