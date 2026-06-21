"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ──────────────────────────────────────────────────────────

type FormulaMaster = {
  formulaId: string;
  brandId: string;
  brandName: string;
  productName: string;
  sku: string;
  productType: string;
  batchSize: number;
  unit: string;
  version: string;
  status: string;
  created: string;
  updated: string;
};

type Ingredient = {
  formulaId: string;
  ingredientId: string;
  ingredientName: string;
  category: string;
  qty: number;
  percent: number;
  unitCost: number;
  totalCost: number;
  supplier: string;
  notes: string;
};

type CostSummary = {
  formulaId: string;
  ingredientCost: number;
  bottlingCost: number;
  packagingCost: number;
  otherCost: number;
  totalHppPerUnit: number;
  marginPercent: number;
  suggestedPrice: number;
  created: string;
};

type FormulaDetail = FormulaMaster & {
  ingredients: Ingredient[];
  costSummary: CostSummary | null;
};

type IngredientRow = {
  ingredientId: string;
  ingredientName: string;
  category: string;
  qty: number;
  unitCost: number;
  supplier: string;
  notes: string;
};

// ── Helpers ────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

const fmtRp = (n: number) => `Rp ${fmt(n)}`;

const emptyIngredientRow = (): IngredientRow => ({
  ingredientId: "",
  ingredientName: "",
  category: "solvent",
  qty: 0,
  unitCost: 0,
  supplier: "TBA",
  notes: "",
});

const CATEGORIES = [
  { value: "solvent", label: "Solvent" },
  { value: "oil", label: "Fragrance Oil" },
  { value: "fixative", label: "Fixative" },
  { value: "additive", label: "Additive" },
  { value: "other", label: "Other" },
];

const BRAND_OPTIONS = [
  { id: "brand-larc", name: "L'Arc~en~Scent" },
  { id: "brand-pixel", name: "Pixel Potion" },
  { id: "brand-nuscentza", name: "Nuscentza" },
];

function calcCosts(
  ingredients: IngredientRow[],
  bottlingCost: number,
  packagingCost: number,
  otherCost: number,
  batchSize: number,
  marginPercent: number
) {
  const ingredientCost = ingredients.reduce(
    (sum, ing) => sum + ing.qty * ing.unitCost,
    0
  );
  const totalProductionCost =
    ingredientCost + bottlingCost + packagingCost + otherCost;
  const hppPerUnit = batchSize > 0 ? totalProductionCost / batchSize : 0;
  const margin = marginPercent / 100;
  const suggestedPrice =
    margin < 1 ? hppPerUnit / (1 - margin) : hppPerUnit;
  return {
    ingredientCost,
    totalProductionCost,
    hppPerUnit,
    suggestedPrice,
  };
}

// ── Main Page ──────────────────────────────────────────────────────

export default function FormulasPage() {
  const [formulas, setFormulas] = useState<FormulaMaster[]>([]);
  const [costMap, setCostMap] = useState<Record<string, CostSummary>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FormulaDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Builder state
  const [builderMode, setBuilderMode] = useState<"create" | "edit">("create");
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(null);
  const [brandId, setBrandId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [productType, setProductType] = useState("Perfume");
  const [batchSize, setBatchSize] = useState(50);
  const [unit, setUnit] = useState("ml");
  const [version, setVersion] = useState("v1.0");
  const [status, setStatus] = useState("Active");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    emptyIngredientRow(),
  ]);
  const [bottlingCost, setBottlingCost] = useState(150000);
  const [packagingCost, setPackagingCost] = useState(200000);
  const [otherCost, setOtherCost] = useState(50000);
  const [marginPercent, setMarginPercent] = useState(60);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // ── Fetch formulas list ──

  const fetchFormulas = useCallback(async () => {
    try {
      const res = await fetch("/api/formulas");
      const data = await res.json();
      if (data.formulas) {
        setFormulas(data.formulas);
        const cmap: Record<string, CostSummary> = {};
        for (const f of data.formulas) {
          if (f.costSummary) cmap[f.formulaId] = f.costSummary;
        }
        setCostMap(cmap);
      }
    } catch (err) {
      console.error("Failed to fetch formulas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFormulas();
  }, [fetchFormulas]);

  // ── Fetch detail ──

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    fetch(`/api/formulas/${selectedId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.formula) setDetail(data.formula);
      })
      .catch(console.error)
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  // ── Filtered list ──

  const filtered = useMemo(() => {
    if (!search.trim()) return formulas;
    const q = search.toLowerCase();
    return formulas.filter(
      (f) =>
        f.formulaId.toLowerCase().includes(q) ||
        f.brandName.toLowerCase().includes(q) ||
        f.productName.toLowerCase().includes(q) ||
        f.sku.toLowerCase().includes(q)
    );
  }, [formulas, search]);

  // ── Real-time cost calculation ──

  const liveCosts = useMemo(
    () =>
      calcCosts(
        ingredients,
        bottlingCost,
        packagingCost,
        otherCost,
        batchSize,
        marginPercent
      ),
    [ingredients, bottlingCost, packagingCost, otherCost, batchSize, marginPercent]
  );

  // ── Ingredient row helpers ──

  function updateIngredient(index: number, field: keyof IngredientRow, value: string | number) {
    setIngredients((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addIngredientRow() {
    setIngredients((prev) => [...prev, emptyIngredientRow()]);
  }

  function removeIngredientRow(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Reset builder ──

  function resetBuilder() {
    setBuilderMode("create");
    setEditingFormulaId(null);
    setBrandId("");
    setBrandName("");
    setProductName("");
    setSku("");
    setProductType("Perfume");
    setBatchSize(50);
    setUnit("ml");
    setVersion("v1.0");
    setStatus("Active");
    setIngredients([emptyIngredientRow()]);
    setBottlingCost(150000);
    setPackagingCost(200000);
    setOtherCost(50000);
    setMarginPercent(60);
    setSaveMessage("");
  }

  // ── Load formula into builder for edit ──

  function loadFormulaForEdit(formula: FormulaDetail) {
    setBuilderMode("edit");
    setEditingFormulaId(formula.formulaId);
    setBrandId(formula.brandId);
    setBrandName(formula.brandName);
    setProductName(formula.productName);
    setSku(formula.sku);
    setProductType(formula.productType);
    setBatchSize(formula.batchSize);
    setUnit(formula.unit);
    setVersion(formula.version);
    setStatus(formula.status);
    if (formula.ingredients.length > 0) {
      setIngredients(
        formula.ingredients.map((ing) => ({
          ingredientId: ing.ingredientId,
          ingredientName: ing.ingredientName,
          category: ing.category,
          qty: ing.qty,
          unitCost: ing.unitCost,
          supplier: ing.supplier,
          notes: ing.notes,
        }))
      );
    } else {
      setIngredients([emptyIngredientRow()]);
    }
    if (formula.costSummary) {
      setBottlingCost(formula.costSummary.bottlingCost);
      setPackagingCost(formula.costSummary.packagingCost);
      setOtherCost(formula.costSummary.otherCost);
      setMarginPercent(formula.costSummary.marginPercent);
    }
    setSaveMessage("");
  }

  // ── Save formula ──

  async function saveFormula() {
    if (!brandName || !productName || batchSize <= 0) {
      setSaveMessage("⚠️ Brand, Product Name, dan Batch Size wajib diisi.");
      return;
    }
    setSaving(true);
    setSaveMessage("Menyimpan formula...");
    try {
      const validIngredients = ingredients.filter(
        (ing) => ing.ingredientName.trim() && ing.qty > 0
      );
      const payload: Record<string, unknown> = {
        formulaId: editingFormulaId || `F-${Date.now()}`,
        brandId,
        brandName,
        productName,
        sku,
        productType,
        batchSize,
        unit,
        version,
        status,
        ingredients: validIngredients,
        bottlingCost,
        packagingCost,
        otherCost,
        marginPercent,
      };
      const method = builderMode === "edit" ? "PUT" : "POST";
      const url =
        builderMode === "edit"
          ? `/api/formulas/${editingFormulaId}`
          : "/api/formulas";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan formula");
      }
      setSaveMessage(
        `✅ Formula ${data.formula?.formulaId || editingFormulaId} berhasil disimpan! HPP: ${fmtRp(Math.round(data.formula?.hppPerUnit || liveCosts.hppPerUnit))}`
      );
      resetBuilder();
      fetchFormulas();
    } catch (err) {
      setSaveMessage(
        `❌ ${err instanceof Error ? err.message : "Gagal menyimpan formula"}`
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Delete formula ──

  async function deleteFormula(formulaId: string) {
    if (!confirm(`Hapus formula ${formulaId}? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/formulas/${formulaId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal hapus formula");
      if (selectedId === formulaId) setSelectedId(null);
      fetchFormulas();
    } catch (err) {
      alert(`Gagal hapus: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ── Brand select handler ──

  function handleBrandSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setBrandId(val);
    const brand = BRAND_OPTIONS.find((b) => b.id === val);
    setBrandName(brand?.name || "");
  }

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Production / Recipe
          </p>
          <h1 className="text-3xl font-bold">🧪 Formula / Recipe Management</h1>
          <p className="text-muted-foreground">
            Komposisi bahan &amp; HPP calculator per produk parfum SWI
          </p>
        </div>
        <Button
          onClick={() => {
            resetBuilder();
            setSelectedId(null);
          }}
        >
          + New Formula
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="formulas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="formulas">Formulas</TabsTrigger>
          <TabsTrigger value="detail">Formula Detail</TabsTrigger>
          <TabsTrigger value="builder">Formula Builder</TabsTrigger>
          <TabsTrigger value="analysis">Cost Analysis</TabsTrigger>
        </TabsList>

        {/* ── Tab: Formulas List ── */}
        <TabsContent value="formulas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Daftar Formula</CardTitle>
                  <CardDescription>
                    {filtered.length} formula ditemukan
                  </CardDescription>
                </div>
                <Input
                  placeholder="Cari formula, brand, produk..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-72"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  title="Belum ada formula"
                  description="Klik '+ New Formula' untuk membuat formula pertama."
                  action={
                    <Button onClick={() => { resetBuilder(); setSelectedId(null); }}>
                      + New Formula
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Formula ID</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead className="text-right">HPP/Unit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((f) => {
                        const cs = costMap[f.formulaId];
                        return (
                          <TableRow
                            key={f.formulaId}
                            className="cursor-pointer hover:bg-muted/60"
                            onClick={() => setSelectedId(f.formulaId)}
                          >
                            <TableCell className="font-mono font-medium">
                              {f.formulaId}
                            </TableCell>
                            <TableCell>{f.brandName}</TableCell>
                            <TableCell>{f.productName}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {f.sku}
                            </TableCell>
                            <TableCell>
                              {f.batchSize} {f.unit}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {cs ? fmtRp(cs.totalHppPerUnit) : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  f.status === "Active"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {f.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedId(f.formulaId);
                                  }}
                                >
                                  Detail
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fetch(`/api/formulas/${f.formulaId}`)
                                      .then((r) => r.json())
                                      .then((data) => {
                                        if (data.formula)
                                          loadFormulaForEdit(data.formula);
                                      })
                                      .catch(console.error);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFormula(f.formulaId);
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Formula Detail ── */}
        <TabsContent value="detail" className="space-y-4">
          {!selectedId ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  title="Pilih Formula"
                  description="Pilih formula dari tab 'Formulas' untuk melihat detail."
                />
              </CardContent>
            </Card>
          ) : detailLoading ? (
            <Card>
              <CardContent className="py-12 space-y-4">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ) : detail ? (
            <div className="space-y-4">
              {/* Formula header */}
              <Card className="border-primary/40 bg-primary/5">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-2xl">
                        🧪 {detail.formulaId}: {detail.productName}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {detail.brandName} &middot; {detail.sku}
                      </CardDescription>
                    </div>
                    <Badge variant={detail.status === "Active" ? "default" : "secondary"}>
                      {detail.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Batch Size</div>
                      <div className="text-lg font-semibold">
                        {detail.batchSize} {detail.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Version</div>
                      <div className="text-lg font-semibold">{detail.version}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Created</div>
                      <div className="text-sm">{detail.created}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Updated</div>
                      <div className="text-sm">{detail.updated}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ingredients table */}
              <Card>
                <CardHeader>
                  <CardTitle>Komposisi Bahan</CardTitle>
                  <CardDescription>
                    {detail.ingredients.length} bahan dalam formula ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">Bahan</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead className="text-right">Qty (ml)</TableHead>
                          <TableHead className="text-right">%</TableHead>
                          <TableHead className="text-right">Unit Cost</TableHead>
                          <TableHead className="text-right">Total Cost</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.ingredients.map((ing, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">
                              {ing.ingredientName}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{ing.category}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{ing.qty}</TableCell>
                            <TableCell className="text-right">
                              {ing.percent}%
                            </TableCell>
                            <TableCell className="text-right">
                              {fmtRp(ing.unitCost)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {fmtRp(ing.totalCost)}
                            </TableCell>
                            <TableCell>{ing.supplier}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {ing.notes}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Cost breakdown */}
              {detail.costSummary && (
                <Card>
                  <CardHeader>
                    <CardTitle>💰 Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <CostBox
                        label="Ingredient Cost"
                        value={fmtRp(detail.costSummary.ingredientCost)}
                        color="blue"
                      />
                      <CostBox
                        label="Bottling"
                        value={fmtRp(detail.costSummary.bottlingCost)}
                        color="green"
                      />
                      <CostBox
                        label="Packaging"
                        value={fmtRp(detail.costSummary.packagingCost)}
                        color="amber"
                      />
                      <CostBox
                        label="Other"
                        value={fmtRp(detail.costSummary.otherCost)}
                        color="purple"
                      />
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 text-center">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          Total HPP/Unit
                        </div>
                        <div className="mt-1 text-2xl font-bold text-primary">
                          {fmtRp(detail.costSummary.totalHppPerUnit)}
                        </div>
                      </div>
                      <div className="rounded-lg border p-4 text-center">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          Margin
                        </div>
                        <div className="mt-1 text-2xl font-bold">
                          {detail.costSummary.marginPercent}%
                        </div>
                      </div>
                      <div className="rounded-lg border-2 border-emerald-500 bg-emerald-50 p-4 text-center">
                        <div className="text-xs uppercase tracking-wide text-emerald-700">
                          Suggested Price
                        </div>
                        <div className="mt-1 text-2xl font-bold text-emerald-700">
                          {fmtRp(detail.costSummary.suggestedPrice)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    fetch(`/api/formulas/${detail.formulaId}`)
                      .then((r) => r.json())
                      .then((data) => {
                        if (data.formula) loadFormulaForEdit(data.formula);
                      })
                      .catch(console.error)
                  }
                >
                  ✏️ Edit Formula
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(detail, null, 2)
                    );
                    alert("Detail formula disalin ke clipboard.");
                  }}
                >
                  📋 Export JSON
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => deleteFormula(detail.formulaId)}
                >
                  🗑️ Deactivate
                </Button>
              </div>
            </div>
          ) : null}
        </TabsContent>

        {/* ── Tab: Formula Builder ── */}
        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                🧪 Formula Builder —{" "}
                {builderMode === "edit"
                  ? `Edit ${editingFormulaId}`
                  : "New Formula"}
              </CardTitle>
              <CardDescription>
                Isi komposisi bahan dan biaya produksi. HPP dihitung
                otomatis secara real-time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Brand *</Label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2"
                    value={brandId}
                    onChange={handleBrandSelect}
                  >
                    <option value="">Pilih Brand...</option>
                    {BRAND_OPTIONS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Contoh: EDP 30ml Rose"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Contoh: ARC-EDP-30"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Product Type</Label>
                  <Input
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    placeholder="Perfume"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Batch Size *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={batchSize}
                      onChange={(e) =>
                        setBatchSize(Number(e.target.value))
                      }
                      min={1}
                    />
                    <select
                      className="w-24 rounded-md border bg-background px-2"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    >
                      <option value="ml">ml</option>
                      <option value="liter">liter</option>
                      <option value="pcs">pcs</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Version</Label>
                  <Input
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="v1.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* ── Ingredients section ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    🧪 Komposisi Bahan
                  </h3>
                  <Button variant="outline" size="sm" onClick={addIngredientRow}>
                    + Add Ingredient
                  </Button>
                </div>

                <div className="space-y-2">
                  {ingredients.map((ing, idx) => {
                    const pct =
                      batchSize > 0
                        ? Math.round((ing.qty / batchSize) * 10000) / 100
                        : 0;
                    const total = ing.qty * ing.unitCost;
                    return (
                      <div
                        key={idx}
                        className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_80px_80px_100px_100px_auto] items-end"
                      >
                        <div className="space-y-1">
                          <Label className="text-xs">Bahan</Label>
                          <Input
                            value={ing.ingredientName}
                            onChange={(e) =>
                              updateIngredient(idx, "ingredientName", e.target.value)
                            }
                            placeholder="Nama bahan"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Kategori</Label>
                          <select
                            className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                            value={ing.category}
                            onChange={(e) =>
                              updateIngredient(idx, "category", e.target.value)
                            }
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            value={ing.qty || ""}
                            onChange={(e) =>
                              updateIngredient(idx, "qty", Number(e.target.value))
                            }
                            min={0}
                            step={0.5}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">%</Label>
                          <div className="rounded-md border bg-muted px-2 py-2 text-sm text-muted-foreground">
                            {pct}%
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Unit Cost</Label>
                          <Input
                            type="number"
                            value={ing.unitCost || ""}
                            onChange={(e) =>
                              updateIngredient(idx, "unitCost", Number(e.target.value))
                            }
                            min={0}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Total</Label>
                          <div className="rounded-md border bg-muted px-2 py-2 text-sm font-medium">
                            {fmtRp(total)}
                          </div>
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => removeIngredientRow(idx)}
                            disabled={ingredients.length <= 1}
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Production costs ── */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  🏭 Biaya Produksi
                </h3>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Bottling</Label>
                    <Input
                      type="number"
                      value={bottlingCost || ""}
                      onChange={(e) =>
                        setBottlingCost(Number(e.target.value))
                      }
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Packaging</Label>
                    <Input
                      type="number"
                      value={packagingCost || ""}
                      onChange={(e) =>
                        setPackagingCost(Number(e.target.value))
                      }
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Other</Label>
                    <Input
                      type="number"
                      value={otherCost || ""}
                      onChange={(e) => setOtherCost(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Margin %</Label>
                    <Input
                      type="number"
                      value={marginPercent || ""}
                      onChange={(e) =>
                        setMarginPercent(Number(e.target.value))
                      }
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
              </div>

              {/* ── Live calculation result ── */}
              <div className="rounded-xl border-2 border-primary bg-primary/5 p-5">
                <h3 className="mb-3 text-lg font-semibold">
                  📊 Hasil Kalkulasi (Real-time)
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <CalcBox
                    label="Ingredient Cost"
                    value={fmtRp(Math.round(liveCosts.ingredientCost))}
                  />
                  <CalcBox
                    label="Total Production"
                    value={fmtRp(Math.round(liveCosts.totalProductionCost))}
                  />
                  <CalcBox
                    label="HPP per Unit"
                    value={fmtRp(Math.round(liveCosts.hppPerUnit))}
                    highlight
                  />
                  <CalcBox label="Margin" value={`${marginPercent}%`} />
                  <CalcBox
                    label="Suggested Price"
                    value={fmtRp(Math.round(liveCosts.suggestedPrice))}
                    highlight
                  />
                </div>
              </div>

              {/* Save message */}
              {saveMessage && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    saveMessage.startsWith("✅")
                      ? "bg-emerald-50 text-emerald-900"
                      : saveMessage.startsWith("❌") || saveMessage.startsWith("⚠️")
                      ? "bg-red-50 text-red-900"
                      : "bg-blue-50 text-blue-900"
                  }`}
                >
                  {saveMessage}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={resetBuilder}>
                  Cancel
                </Button>
                <Button
                  onClick={saveFormula}
                  disabled={saving}
                  className="min-w-[160px]"
                >
                  {saving ? "Menyimpan..." : "💾 Save Formula"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Cost Analysis ── */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Cost per brand */}
            <Card>
              <CardHeader>
                <CardTitle>Cost per Brand</CardTitle>
                <CardDescription>
                  Total HPP per unit per brand
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const brandCosts: Record<
                      string,
                      { totalHpp: number; count: number; totalCost: number }
                    > = {};
                    formulas.forEach((f) => {
                      const cs = costMap[f.formulaId];
                      if (!cs) return;
                      if (!brandCosts[f.brandName]) {
                        brandCosts[f.brandName] = {
                          totalHpp: 0,
                          count: 0,
                          totalCost: 0,
                        };
                      }
                      brandCosts[f.brandName].totalHpp += cs.totalHppPerUnit;
                      brandCosts[f.brandName].count += 1;
                      brandCosts[f.brandName].totalCost +=
                        cs.ingredientCost +
                        cs.bottlingCost +
                        cs.packagingCost +
                        cs.otherCost;
                    });
                    const entries = Object.entries(brandCosts);
                    const maxHpp = Math.max(
                      ...entries.map(([, v]) => v.totalHpp),
                      1
                    );
                    return entries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Belum ada data cost.
                      </p>
                    ) : (
                      entries.map(([brand, data]) => (
                        <div key={brand} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{brand}</span>
                            <span className="text-muted-foreground">
                              {data.count} formula &middot; avg{" "}
                              {fmtRp(Math.round(data.totalHpp / data.count))}/unit
                            </span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{
                                width: `${(data.totalHpp / maxHpp) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Top ingredients by cost */}
            <Card>
              <CardHeader>
                <CardTitle>Top Ingredients by Cost</CardTitle>
                <CardDescription>
                  Bahan baku dengan total cost tertinggi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(() => {
                    const costEntries = Object.values(costMap);
                    const totalIngCost = costEntries.reduce(
                      (s, c) => s + c.ingredientCost,
                      0
                    );
                    const totalBottling = costEntries.reduce(
                      (s, c) => s + c.bottlingCost,
                      0
                    );
                    const totalPackaging = costEntries.reduce(
                      (s, c) => s + c.packagingCost,
                      0
                    );
                    const totalOther = costEntries.reduce(
                      (s, c) => s + c.otherCost,
                      0
                    );
                    const allCosts = [
                      {
                        name: "Ingredients",
                        cost: totalIngCost,
                        color: "bg-blue-500",
                      },
                      {
                        name: "Bottling",
                        cost: totalBottling,
                        color: "bg-emerald-500",
                      },
                      {
                        name: "Packaging",
                        cost: totalPackaging,
                        color: "bg-amber-500",
                      },
                      { name: "Other", cost: totalOther, color: "bg-purple-500" },
                    ].sort((a, b) => b.cost - a.cost);
                    const maxCost = Math.max(...allCosts.map((c) => c.cost), 1);
                    return allCosts.map((item) => (
                      <div key={item.name} className="flex items-center gap-3">
                        <div className="w-24 text-sm font-medium">
                          {item.name}
                        </div>
                        <div className="flex-1">
                          <div className="h-6 overflow-hidden rounded bg-muted">
                            <div
                              className={`h-full rounded ${item.color} transition-all`}
                              style={{
                                width: `${(item.cost / maxCost) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="w-28 text-right text-sm font-medium">
                          {fmtRp(item.cost)}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* HPP comparison table */}
          <Card>
            <CardHeader>
              <CardTitle>HPP Comparison</CardTitle>
              <CardDescription>
                Perbandingan HPP per unit semua formula
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Formula</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Batch</TableHead>
                      <TableHead className="text-right">Ingredient</TableHead>
                      <TableHead className="text-right">Prod Cost</TableHead>
                      <TableHead className="text-right">HPP/Unit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formulas.map((f) => {
                      const cs = costMap[f.formulaId];
                      if (!cs) return null;
                      return (
                        <TableRow
                          key={f.formulaId}
                          className="cursor-pointer hover:bg-muted/60"
                          onClick={() => setSelectedId(f.formulaId)}
                        >
                          <TableCell className="font-mono font-medium">
                            {f.formulaId}
                          </TableCell>
                          <TableCell>{f.productName}</TableCell>
                          <TableCell className="text-right">
                            {f.batchSize} {f.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtRp(cs.ingredientCost)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtRp(
                              cs.ingredientCost +
                                cs.bottlingCost +
                                cs.packagingCost +
                                cs.otherCost
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {fmtRp(cs.totalHppPerUnit)}
                          </TableCell>
                          <TableCell className="text-right">
                            {cs.marginPercent}%
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-600">
                            {fmtRp(cs.suggestedPrice)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function CostBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "blue" | "green" | "amber" | "purple";
}) {
  const colors = {
    blue: "border-blue-200 bg-blue-50",
    green: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
    purple: "border-purple-200 bg-purple-50",
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[color]}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}

function CalcBox({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight
          ? "border-primary bg-primary/10"
          : "border-border bg-card"
      }`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`mt-1 text-lg font-bold ${
          highlight ? "text-primary" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
