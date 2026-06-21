"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  X, Pencil, Trash2, Plus, FlaskConical, DollarSign,
  Beaker, Percent, Package, Search, Save, Copy, Ban
} from "lucide-react";

/* ── Types ── */

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

type FormulaSummary = {
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
  costSummary: CostSummary | null;
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

type FormulaDetail = FormulaSummary & {
  ingredients: Ingredient[];
  costSummary: CostSummary | null;
};

type IngredientRow = {
  ingredientId: string;
  ingredientName: string;
  category: string;
  qty: string;
  unitCost: string;
  supplier: string;
  notes: string;
};

/* ── Helpers ── */

const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

const fmtNum = (value: number) =>
  new Intl.NumberFormat("id-ID").format(value || 0);

const statusColor: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-700",
  Draft: "bg-yellow-100 text-yellow-700",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_INGREDIENT: IngredientRow = {
  ingredientId: "",
  ingredientName: "",
  category: "oil",
  qty: "",
  unitCost: "",
  supplier: "TBA",
  notes: "",
};

const CATEGORIES = [
  { value: "solvent", label: "Solvent" },
  { value: "oil", label: "Fragrance Oil" },
  { value: "fixative", label: "Fixative" },
  { value: "additive", label: "Additive" },
  { value: "other", label: "Other" },
];

/* ── Main Component ── */

export default function FormulasPage() {
  const [formulas, setFormulas] = useState<FormulaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("formulas");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail view
  const [selectedFormula, setSelectedFormula] = useState<FormulaDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Builder form
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(null);

  // Form fields
  const [formBrandId, setFormBrandId] = useState("");
  const [formBrandName, setFormBrandName] = useState("");
  const [formProductName, setFormProductName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formProductType, setFormProductType] = useState("Perfume");
  const [formBatchSize, setFormBatchSize] = useState("50");
  const [formUnit, setFormUnit] = useState("ml");
  const [formVersion, setFormVersion] = useState("v1.0");
  const [formStatus, setFormStatus] = useState("Active");
  const [formBottlingCost, setFormBottlingCost] = useState("150000");
  const [formPackagingCost, setFormPackagingCost] = useState("200000");
  const [formOtherCost, setFormOtherCost] = useState("50000");
  const [formMargin, setFormMargin] = useState("60");
  const [formIngredients, setFormIngredients] = useState<IngredientRow[]>([{ ...EMPTY_INGREDIENT }]);

  // Delete confirm
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Data loading ──

  async function loadFormulas() {
    setLoading(true);
    try {
      const res = await fetch("/api/formulas", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal load formulas");
      setFormulas(json.formulas || []);
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFormulas().catch((e) => {
      setMessage(`❌ ${String(e)}`);
      setLoading(false);
    });
  }, []);

  const filteredFormulas = useMemo(() => {
    if (!searchQuery) return formulas;
    const q = searchQuery.toLowerCase();
    return formulas.filter(
      (f) =>
        f.formulaId.toLowerCase().includes(q) ||
        f.brandName.toLowerCase().includes(q) ||
        f.productName.toLowerCase().includes(q) ||
        f.sku.toLowerCase().includes(q)
    );
  }, [formulas, searchQuery]);

  // ── Real-time cost calculation ──

  const liveCalc = useMemo(() => {
    const batchSize = parseFloat(formBatchSize) || 0;
    const bottling = parseFloat(formBottlingCost) || 0;
    const packaging = parseFloat(formPackagingCost) || 0;
    const other = parseFloat(formOtherCost) || 0;
    const margin = parseFloat(formMargin) || 0;

    const ingredientCost = formIngredients.reduce((sum, ing) => {
      const qty = parseFloat(ing.qty) || 0;
      const unitCost = parseFloat(ing.unitCost) || 0;
      return sum + qty * unitCost;
    }, 0);

    const totalProduction = ingredientCost + bottling + packaging + other;
    const hppPerUnit = batchSize > 0 ? totalProduction / batchSize : 0;
    const marginFrac = margin / 100;
    const suggestedPrice = marginFrac < 1 ? hppPerUnit / (1 - marginFrac) : hppPerUnit;

    const totalQty = formIngredients.reduce((sum, ing) => sum + (parseFloat(ing.qty) || 0), 0);

    return {
      ingredientCost,
      totalProduction,
      hppPerUnit,
      suggestedPrice,
      totalQty,
      ingredientPcts: formIngredients.map((ing) => {
        const qty = parseFloat(ing.qty) || 0;
        return batchSize > 0 ? (qty / batchSize) * 100 : 0;
      }),
    };
  }, [formIngredients, formBatchSize, formBottlingCost, formPackagingCost, formOtherCost, formMargin]);

  // ── Ingredient row management ──

  function addIngredientRow() {
    setFormIngredients((prev) => [...prev, { ...EMPTY_INGREDIENT }]);
  }

  function removeIngredientRow(index: number) {
    setFormIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function updateIngredientRow(index: number, field: keyof IngredientRow, value: string) {
    setFormIngredients((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  // ── Open builder for new/edit ──

  function openNewBuilder() {
    setEditingFormulaId(null);
    setFormBrandId("");
    setFormBrandName("");
    setFormProductName("");
    setFormSku("");
    setFormProductType("Perfume");
    setFormBatchSize("50");
    setFormUnit("ml");
    setFormVersion("v1.0");
    setFormStatus("Active");
    setFormBottlingCost("150000");
    setFormPackagingCost("200000");
    setFormOtherCost("50000");
    setFormMargin("60");
    setFormIngredients([{ ...EMPTY_INGREDIENT }]);
    setShowBuilder(true);
    setMessage("");
  }

  function openEditBuilder(formula: FormulaSummary | FormulaDetail) {
    setEditingFormulaId(formula.formulaId);
    setFormBrandId(formula.brandId);
    setFormBrandName(formula.brandName);
    setFormProductName(formula.productName);
    setFormSku(formula.sku);
    setFormProductType(formula.productType);
    setFormBatchSize(String(formula.batchSize));
    setFormUnit(formula.unit);
    setFormVersion(formula.version);
    setFormStatus(formula.status);

    const detail = "ingredients" in formula ? (formula as FormulaDetail) : null;
    if (detail?.costSummary) {
      setFormBottlingCost(String(detail.costSummary.bottlingCost));
      setFormPackagingCost(String(detail.costSummary.packagingCost));
      setFormOtherCost(String(detail.costSummary.otherCost));
      setFormMargin(String(detail.costSummary.marginPercent));
    } else {
      setFormBottlingCost("150000");
      setFormPackagingCost("200000");
      setFormOtherCost("50000");
      setFormMargin("60");
    }

    if (detail?.ingredients && detail.ingredients.length > 0) {
      setFormIngredients(
        detail.ingredients.map((ing) => ({
          ingredientId: ing.ingredientId,
          ingredientName: ing.ingredientName,
          category: ing.category,
          qty: String(ing.qty),
          unitCost: String(ing.unitCost),
          supplier: ing.supplier,
          notes: ing.notes,
        }))
      );
    } else {
      setFormIngredients([{ ...EMPTY_INGREDIENT }]);
    }

    setShowBuilder(true);
    setMessage("");
  }

  // ── View formula detail ──

  async function viewFormula(formulaId: string) {
    setDetailLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/formulas/${formulaId}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal load detail");
      setSelectedFormula(json.formula);
      setActiveTab("detail");
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setDetailLoading(false);
    }
  }

  // ── Save formula (create or update) ──

  async function saveFormula(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const ingredients = formIngredients
      .filter((ing) => ing.ingredientName && parseFloat(ing.qty) > 0)
      .map((ing) => ({
        ingredientId: ing.ingredientId || `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ingredientName: ing.ingredientName,
        category: ing.category,
        qty: parseFloat(ing.qty) || 0,
        unitCost: parseFloat(ing.unitCost) || 0,
        supplier: ing.supplier || "TBA",
        notes: ing.notes || "",
      }));

    const payload = {
      formulaId: editingFormulaId || `F-${formBrandName.substring(0, 3).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
      brandId: formBrandId,
      brandName: formBrandName,
      productName: formProductName,
      sku: formSku,
      productType: formProductType,
      batchSize: parseFloat(formBatchSize) || 50,
      unit: formUnit,
      version: formVersion,
      status: formStatus,
      ingredients,
      bottlingCost: parseFloat(formBottlingCost) || 0,
      packagingCost: parseFloat(formPackagingCost) || 0,
      otherCost: parseFloat(formOtherCost) || 0,
      marginPercent: parseFloat(formMargin) || 60,
    };

    try {
      const method = editingFormulaId ? "PUT" : "POST";
      const url = editingFormulaId
        ? `/api/formulas/${editingFormulaId}`
        : "/api/formulas";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal simpan formula");

      setMessage(`✅ Formula ${editingFormulaId ? "diupdate" : "dibuat"}: ${formProductName}`);
      setShowBuilder(false);
      setEditingFormulaId(null);
      await loadFormulas();
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete formula ──

  async function deleteFormula(formulaId: string) {
    if (!confirm(`Hapus formula ${formulaId}? Semua ingredients & cost summary juga akan dihapus.`)) return;
    setDeleting(formulaId);
    setMessage("");
    try {
      const res = await fetch(`/api/formulas/${formulaId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal hapus");
      setMessage(`✅ Formula ${formulaId} dihapus`);
      if (selectedFormula?.formulaId === formulaId) {
        setSelectedFormula(null);
        setActiveTab("formulas");
      }
      await loadFormulas();
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setDeleting(null);
    }
  }

  // ── Cost Analysis data ──

  const costAnalysis = useMemo(() => {
    const brandCosts: Record<string, { name: string; totalHpp: number; count: number }> = {};
    const ingredientCosts: Record<string, { name: string; totalCost: number; count: number }> = {};

    formulas.forEach((f) => {
      if (f.costSummary) {
        const bn = f.brandName || "Unknown";
        if (!brandCosts[bn]) brandCosts[bn] = { name: bn, totalHpp: 0, count: 0 };
        brandCosts[bn].totalHpp += f.costSummary.totalHppPerUnit;
        brandCosts[bn].count += 1;
      }
    });

    const brandList = Object.values(brandCosts).sort((a, b) => b.totalHpp - a.totalHpp);
    const avgHpp = formulas.length > 0
      ? formulas.reduce((s, f) => s + (f.costSummary?.totalHppPerUnit || 0), 0) / formulas.length
      : 0;

    return { brandList, avgHpp, totalFormulas: formulas.length };
  }, [formulas]);

  return (
    <div className="space-y-6">
      {/* Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" />
                  {editingFormulaId ? "Edit Formula" : "Formula Builder"}
                </CardTitle>
                <CardDescription>
                  {editingFormulaId ? `Editing ${editingFormulaId}` : "Buat formula baru — HPP dihitung otomatis"}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setShowBuilder(false); setEditingFormulaId(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveFormula} className="space-y-5">
                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Brand ID *</Label>
                    <Input value={formBrandId} onChange={(e) => setFormBrandId(e.target.value)} placeholder="brand-larc" required />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Brand Name *</Label>
                    <Input value={formBrandName} onChange={(e) => setFormBrandName(e.target.value)} placeholder="L'Arc~en~Scent" required />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Product Name *</Label>
                    <Input value={formProductName} onChange={(e) => setFormProductName(e.target.value)} placeholder="EDP 30ml Rose" required />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">SKU</Label>
                    <Input value={formSku} onChange={(e) => setFormSku(e.target.value)} placeholder="ARC-EDP-30" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Batch Size</Label>
                    <Input type="number" value={formBatchSize} onChange={(e) => setFormBatchSize(e.target.value)} min={1} step="1" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Unit</Label>
                    <Input value={formUnit} onChange={(e) => setFormUnit(e.target.value)} />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Version</Label>
                    <Input value={formVersion} onChange={(e) => setFormVersion(e.target.value)} />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Status</Label>
                    <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <Beaker className="h-4 w-4" /> Komposisi Bahan
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={addIngredientRow}>
                      <Plus className="h-3 w-3 mr-1" /> Add Ingredient
                    </Button>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">Ingredient</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="w-[80px]">Qty</TableHead>
                          <TableHead className="w-[100px]">%</TableHead>
                          <TableHead className="w-[120px]">Unit Cost</TableHead>
                          <TableHead className="w-[120px]">Total</TableHead>
                          <TableHead className="w-[100px]">Supplier</TableHead>
                          <TableHead className="w-[40px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formIngredients.map((ing, idx) => {
                          const qty = parseFloat(ing.qty) || 0;
                          const unitCost = parseFloat(ing.unitCost) || 0;
                          const total = qty * unitCost;
                          const pct = liveCalc.ingredientPcts[idx] || 0;
                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                <Input
                                  value={ing.ingredientName}
                                  onChange={(e) => updateIngredientRow(idx, "ingredientName", e.target.value)}
                                  placeholder="Alcohol 96%"
                                  className="h-8 text-sm"
                                />
                              </TableCell>
                              <TableCell>
                                <select
                                  value={ing.category}
                                  onChange={(e) => updateIngredientRow(idx, "category", e.target.value)}
                                  className="h-8 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                  {CATEGORIES.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                  ))}
                                </select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={ing.qty}
                                  onChange={(e) => updateIngredientRow(idx, "qty", e.target.value)}
                                  min={0}
                                  step="0.1"
                                  className="h-8 text-sm"
                                />
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {pct.toFixed(1)}%
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={ing.unitCost}
                                  onChange={(e) => updateIngredientRow(idx, "unitCost", e.target.value)}
                                  min={0}
                                  className="h-8 text-sm"
                                />
                              </TableCell>
                              <TableCell className="text-sm font-medium">
                                {rupiah(total)}
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={ing.supplier}
                                  onChange={(e) => updateIngredientRow(idx, "supplier", e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </TableCell>
                              <TableCell>
                                {formIngredients.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeIngredientRow(idx)}
                                    className="text-red-400 hover:text-red-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Production Costs */}
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1 mb-2">
                    <Package className="h-4 w-4" /> Biaya Produksi
                  </Label>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="mb-1 block text-xs text-muted-foreground">Bottling (Rp)</Label>
                      <Input type="number" value={formBottlingCost} onChange={(e) => setFormBottlingCost(e.target.value)} min={0} />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs text-muted-foreground">Packaging (Rp)</Label>
                      <Input type="number" value={formPackagingCost} onChange={(e) => setFormPackagingCost(e.target.value)} min={0} />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs text-muted-foreground">Other (Rp)</Label>
                      <Input type="number" value={formOtherCost} onChange={(e) => setFormOtherCost(e.target.value)} min={0} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label className="mb-1 block text-xs text-muted-foreground">Margin (%)</Label>
                    <Input type="number" value={formMargin} onChange={(e) => setFormMargin(e.target.value)} min={0} max={99} className="w-[200px]" />
                  </div>
                </div>

                {/* Live Calculation Result */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="py-4">
                    <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" /> Hasil Kalkulasi (Real-time)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Ingredient Cost</p>
                        <p className="font-semibold">{rupiah(liveCalc.ingredientCost)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Production</p>
                        <p className="font-semibold">{rupiah(liveCalc.totalProduction)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">HPP / Unit</p>
                        <p className="font-bold text-blue-700 text-lg">{rupiah(liveCalc.hppPerUnit)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Margin</p>
                        <p className="font-semibold">{formMargin}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Suggested Price</p>
                        <p className="font-bold text-green-700 text-lg">{rupiah(liveCalc.suggestedPrice)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Qty</p>
                        <p className="font-semibold">{liveCalc.totalQty} {formUnit}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => { setShowBuilder(false); setEditingFormulaId(null); }}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Menyimpan..." : <><Save className="h-4 w-4 mr-1" /> Simpan Formula</>}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6" />
            Formula / Recipe Management
          </h2>
          <p className="text-muted-foreground">
            Komposisi bahan & HPP calculator per produk — real-time dari Google Sheets.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openNewBuilder} size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Formula
          </Button>
          <Button onClick={loadFormulas} disabled={loading} variant="outline" size="sm">
            <Beaker className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {message && (
        <Card className={message.startsWith("✅") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="py-3 text-sm">{message}</CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><FlaskConical className="h-3 w-3" /> Total Formulas</CardDescription>
            <CardTitle className="text-2xl">{loading ? "..." : fmtNum(formulas.length)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">formula aktif & draft</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Percent className="h-3 w-3" /> Avg HPP/Unit</CardDescription>
            <CardTitle className="text-2xl">{loading ? "..." : rupiah(costAnalysis.avgHpp)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">rata-rata per unit</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Package className="h-3 w-3" /> Brands</CardDescription>
            <CardTitle className="text-2xl">{loading ? "..." : fmtNum(costAnalysis.brandList.length)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">brand dengan formula</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Active</CardDescription>
            <CardTitle className="text-2xl">
              {loading ? "..." : fmtNum(formulas.filter((f) => f.status === "Active").length)}
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">formula aktif</p></CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="formulas">Formulas ({filteredFormulas.length})</TabsTrigger>
          <TabsTrigger value="detail" disabled={!selectedFormula}>
            Formula Detail {selectedFormula ? `(${selectedFormula.formulaId})` : ""}
          </TabsTrigger>
          <TabsTrigger value="analysis">Cost Analysis</TabsTrigger>
        </TabsList>

        {/* ── Tab: Formulas List ── */}
        <TabsContent value="formulas" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari formula, brand, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredFormulas.length === 0 ? (
            <EmptyState
              icon={<FlaskConical className="h-12 w-12" />}
              title="Belum ada formula"
              description="Buat formula pertama dengan klik 'New Formula'"
            />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Formula ID</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>HPP/Unit</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFormulas.map((f) => (
                    <TableRow
                      key={f.formulaId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => viewFormula(f.formulaId)}
                    >
                      <TableCell className="font-mono text-sm">{f.formulaId}</TableCell>
                      <TableCell>{f.brandName}</TableCell>
                      <TableCell>{f.productName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.sku}</TableCell>
                      <TableCell>{f.batchSize} {f.unit}</TableCell>
                      <TableCell className="font-semibold">
                        {f.costSummary ? rupiah(f.costSummary.totalHppPerUnit) : "—"}
                      </TableCell>
                      <TableCell className="text-green-700">
                        {f.costSummary ? rupiah(f.costSummary.suggestedPrice) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor[f.status] || "bg-gray-100 text-gray-700"}>
                          {f.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={() => openEditBuilder(f)} title="Edit">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => viewFormula(f.formulaId)} title="View">
                            <Search className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFormula(f.formulaId)}
                            disabled={deleting === f.formulaId}
                            title="Delete"
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab: Formula Detail ── */}
        <TabsContent value="detail" className="space-y-4">
          {detailLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : selectedFormula ? (
            <>
              {/* Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <FlaskConical className="h-5 w-5" />
                        {selectedFormula.formulaId}: {selectedFormula.productName}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {selectedFormula.brandName} • {selectedFormula.productType} • {selectedFormula.sku}
                      </CardDescription>
                    </div>
                    <Badge className={statusColor[selectedFormula.status] || "bg-gray-100 text-gray-700"}>
                      {selectedFormula.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Batch Size</p>
                      <p className="font-semibold">{selectedFormula.batchSize} {selectedFormula.unit}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Version</p>
                      <p className="font-semibold">{selectedFormula.version}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-semibold">{selectedFormula.created}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Updated</p>
                      <p className="font-semibold">{selectedFormula.updated}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ingredients */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Beaker className="h-5 w-5" /> Komposisi Bahan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedFormula.ingredients.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Belum ada data ingredients.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingredient</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>%</TableHead>
                          <TableHead>Unit Cost</TableHead>
                          <TableHead>Total Cost</TableHead>
                          <TableHead>Supplier</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedFormula.ingredients.map((ing, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{ing.ingredientName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{ing.category}</Badge>
                            </TableCell>
                            <TableCell>{ing.qty} ml</TableCell>
                            <TableCell>{ing.percent.toFixed(1)}%</TableCell>
                            <TableCell>{rupiah(ing.unitCost)}</TableCell>
                            <TableCell className="font-semibold">{rupiah(ing.totalCost)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{ing.supplier}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Cost Breakdown */}
              {selectedFormula.costSummary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" /> Cost Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-gray-50">
                        <CardContent className="py-3">
                          <p className="text-xs text-muted-foreground">Ingredient Cost</p>
                          <p className="font-bold">{rupiah(selectedFormula.costSummary.ingredientCost)}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50">
                        <CardContent className="py-3">
                          <p className="text-xs text-muted-foreground">Bottling</p>
                          <p className="font-bold">{rupiah(selectedFormula.costSummary.bottlingCost)}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50">
                        <CardContent className="py-3">
                          <p className="text-xs text-muted-foreground">Packaging</p>
                          <p className="font-bold">{rupiah(selectedFormula.costSummary.packagingCost)}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50">
                        <CardContent className="py-3">
                          <p className="text-xs text-muted-foreground">Other</p>
                          <p className="font-bold">{rupiah(selectedFormula.costSummary.otherCost)}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="py-3">
                          <p className="text-xs text-blue-600">Total HPP/Unit</p>
                          <p className="font-bold text-blue-700 text-lg">{rupiah(selectedFormula.costSummary.totalHppPerUnit)}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50">
                        <CardContent className="py-3">
                          <p className="text-xs text-muted-foreground">Margin</p>
                          <p className="font-bold">{selectedFormula.costSummary.marginPercent}%</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="py-3">
                          <p className="text-xs text-green-600">Suggested Price</p>
                          <p className="font-bold text-green-700 text-lg">{rupiah(selectedFormula.costSummary.suggestedPrice)}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={() => openEditBuilder(selectedFormula)} variant="outline">
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button onClick={() => deleteFormula(selectedFormula.formulaId)} variant="outline" className="text-red-500">
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<FlaskConical className="h-12 w-12" />}
              title="Pilih formula"
              description="Klik formula di tab Formulas untuk melihat detail"
            />
          )}
        </TabsContent>

        {/* ── Tab: Cost Analysis ── */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">HPP per Brand</CardTitle>
                <CardDescription>Total HPP per unit by brand</CardDescription>
              </CardHeader>
              <CardContent>
                {costAnalysis.brandList.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Belum ada data cost summary.</p>
                ) : (
                  <div className="space-y-3">
                    {costAnalysis.brandList.map((b) => (
                      <div key={b.name} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{b.name}</span>
                        <span className="text-sm font-bold">{rupiah(b.totalHpp)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
                <CardDescription>Ringkasan cost analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Formulas</span>
                    <span className="font-semibold">{fmtNum(costAnalysis.totalFormulas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg HPP/Unit</span>
                    <span className="font-semibold">{rupiah(costAnalysis.avgHpp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Brands</span>
                    <span className="font-semibold">{fmtNum(costAnalysis.brandList.length)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
