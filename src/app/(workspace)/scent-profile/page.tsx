"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Question = {
  id: string;
  label: string;
  type: "select" | "multi" | "text";
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
};

type Archetype = {
  id: string;
  title: string;
  brandFit: string;
  notes: string[];
  recommendedFormula: string;
  operatorNotes: string;
  score?: number;
};

type ApiMeta = {
  source: string;
  guardrails: string[];
  questions: Question[];
  archetypes: Archetype[];
};

type Recommendation = {
  sessionId: string;
  customerName: string;
  inputs: Record<string, string | string[]>;
  recommendation: {
    primary: Archetype;
    alternatives: Archetype[];
    scores: Record<string, number>;
  };
  datasetDraft?: {
    canSaveToCrm: boolean;
    customerName: string;
    whatsapp: string;
    consent: string;
    interest: string;
    recommendedFormula: string;
    source: string;
    summary: string;
    guardrail: string;
  };
  nextActions: string[];
};

const initialForm: Record<string, string | string[]> = {
  occasion: "",
  preferredFamily: [],
  intensity: "medium",
  avoid: "",
  customerName: "",
  whatsapp: "",
  consent: "TBA",
};

export default function ScentProfilePage() {
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<Recommendation | null>(null);
  const [status, setStatus] = useState("Memuat AI Scent Profile...");
  const [datasetStatus, setDatasetStatus] = useState("Dataset preference belum disimpan.");
  const [loading, setLoading] = useState(false);
  const [savingDataset, setSavingDataset] = useState(false);

  useEffect(() => {
    fetch("/api/scent-profile")
      .then((response) => response.json())
      .then((payload) => {
        setMeta(payload);
        setStatus(`Scent Profile siap — ${payload.source}`);
      })
      .catch((error) => setStatus(`Gagal memuat profil: ${String(error)}`));
  }, []);

  const profileScores = useMemo(() => {
    if (!result?.recommendation.scores) return [];
    return Object.entries(result.recommendation.scores).sort((a, b) => b[1] - a[1]);
  }, [result]);

  function setTextValue(id: string, value: string) {
    setForm((current) => ({ ...current, [id]: value }));
  }

  function toggleMulti(id: string, value: string) {
    setForm((current) => {
      const values = Array.isArray(current[id]) ? current[id] as string[] : [];
      const next = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
      return { ...current, [id]: next };
    });
  }

  async function submitProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setStatus("Menghitung rekomendasi scent profile...");
    try {
      const response = await fetch("/api/scent-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.missing?.join(", ") || payload?.error || "Gagal membuat rekomendasi");
      }
      setResult(payload);
      setDatasetStatus(payload?.datasetDraft?.canSaveToCrm ? "Siap disimpan ke Customer CRM jika consent sudah jelas." : "Isi nama + WhatsApp jika ingin menyimpan dataset preference ke CRM.");
      setStatus("✅ Rekomendasi draft siap. Lanjutkan review perfumer/compliance sebelum produksi.");
    } catch (error) {
      setStatus(`⚠️ ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function saveDatasetToCrm() {
    if (!result?.datasetDraft) return;
    if (!result.datasetDraft.canSaveToCrm) {
      setDatasetStatus("⚠️ Nama customer dan WhatsApp wajib diisi sebelum save dataset.");
      return;
    }
    if (result.datasetDraft.consent !== "yes") {
      setDatasetStatus("⚠️ Consent masih TBA/no. Minta persetujuan customer sebelum menyimpan ke CRM.");
      return;
    }
    setSavingDataset(true);
    setDatasetStatus("Menyimpan scent preference ke Customer CRM...");
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert-customer",
          name: result.datasetDraft.customerName,
          whatsapp: result.datasetDraft.whatsapp,
          consent: result.datasetDraft.consent,
          source: result.datasetDraft.source,
          interest: result.datasetDraft.interest,
          recommendedFormula: result.datasetDraft.recommendedFormula,
          summary: result.datasetDraft.summary,
          notes: `${result.sessionId} — ${result.datasetDraft.guardrail}`,
          pic: "HemuHemu/OWL",
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.warning || payload?.error || "Gagal menyimpan dataset");
      }
      setDatasetStatus(`✅ Dataset tersimpan ke CRM: ${payload.customer?.id || "customer updated"}; audit=${payload.auditStatus || "TBA"}`);
    } catch (error) {
      setDatasetStatus(`⚠️ ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSavingDataset(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Store Experience / AI Profile</p>
          <h1 className="text-3xl font-bold">🧪 AI Scent Profile</h1>
          <p className="text-muted-foreground">
            Tool interview cepat untuk operator store: ubah preferensi customer menjadi brief aroma awal tanpa mengklaim formula final.
          </p>
        </div>
        <Button variant="outline" onClick={() => { setForm(initialForm); setResult(null); setDatasetStatus("Dataset preference belum disimpan."); }}>Reset Session</Button>
      </div>

      <Card className="border-amber-300/60 bg-amber-50 text-amber-950">
        <CardHeader>
          <CardTitle>Guardrail operasional</CardTitle>
          <CardDescription className="text-amber-900">
            {status}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {(meta?.guardrails || ["Rekomendasi adalah draft brief, bukan formula produksi final."]).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Questionnaire Customer</CardTitle>
            <CardDescription>Isi berdasarkan jawaban customer. Hindari asumsi alergi atau klaim medis.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={submitProfile}>
              {(meta?.questions || []).map((question) => (
                <div key={question.id} className="space-y-2">
                  <Label>{question.label}{question.required ? " *" : ""}</Label>
                  {question.type === "select" ? (
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2"
                      value={String(form[question.id] || "")}
                      onChange={(event) => setTextValue(question.id, event.target.value)}
                      required={question.required}
                    >
                      <option value="">Pilih...</option>
                      {question.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : question.type === "multi" ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {question.options?.map((option) => {
                        const selected = Array.isArray(form[question.id]) && (form[question.id] as string[]).includes(option.value);
                        return (
                          <button
                            type="button"
                            key={option.value}
                            className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                            onClick={() => toggleMulti(question.id, option.value)}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : question.id === "avoid" ? (
                    <Textarea value={String(form[question.id] || "")} onChange={(event) => setTextValue(question.id, event.target.value)} placeholder="Contoh: tidak suka aroma terlalu manis; alergi TBA" />
                  ) : (
                    <Input value={String(form[question.id] || "")} onChange={(event) => setTextValue(question.id, event.target.value)} placeholder="Opsional" />
                  )}
                </div>
              ))}
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Menghitung..." : "Generate Scent Brief"}</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rekomendasi Draft</CardTitle>
              <CardDescription>{result ? `${result.sessionId} · Customer: ${result.customerName}` : "Hasil akan muncul setelah questionnaire diisi."}</CardDescription>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  Belum ada hasil. Pilih occasion, keluarga aroma, dan intensitas untuk membuat scent brief.
                </div>
              ) : (
                <div className="space-y-4">
                  <ArchetypeCard archetype={result.recommendation.primary} primary />
                  <div>
                    <div className="mb-2 text-sm font-medium text-muted-foreground">Alternatif</div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {result.recommendation.alternatives.map((item) => <ArchetypeCard key={item.id} archetype={item} />)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <div className="font-medium">Next actions</div>
                    <ul className="mt-2 list-disc pl-5">
                      {result.nextActions.map((action) => <li key={action}>{action}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
                    <div className="font-medium">Scent Preference Dataset</div>
                    <p className="mt-1">{result.datasetDraft?.guardrail}</p>
                    <p className="mt-2 text-xs">{datasetStatus}</p>
                    <Button type="button" className="mt-3" variant="outline" disabled={savingDataset} onClick={saveDatasetToCrm}>
                      {savingDataset ? "Menyimpan..." : "Save to CRM Dataset"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Score Breakdown</CardTitle>
              <CardDescription>Transparansi heuristic untuk operator — bukan model black box.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {profileScores.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada score.</p> : profileScores.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                  <span className="font-medium capitalize">{key}</span>
                  <Badge variant="outline">{value}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ArchetypeCard({ archetype, primary = false }: { archetype: Archetype; primary?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${primary ? "border-primary/60 bg-primary/5" : "bg-card"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">{primary ? "Primary: " : ""}{archetype.title}</div>
          <div className="text-sm text-muted-foreground">Brand fit: {archetype.brandFit}</div>
        </div>
        {typeof archetype.score === "number" ? <Badge>{archetype.score} pts</Badge> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {archetype.notes.map((note) => <Badge key={note} variant="outline">{note}</Badge>)}
      </div>
      <p className="mt-3 text-sm font-medium">{archetype.recommendedFormula}</p>
      <p className="mt-1 text-sm text-muted-foreground">{archetype.operatorNotes}</p>
    </div>
  );
}
