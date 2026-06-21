# Formula / Recipe Management — Development Plan

## Overview
Sistem formula/resep untuk produksi parfum SWI. Setiap produk punya komposisi bahan yang terdiri dari alcohol, fragrance oil, fixative, dan bahan lainnya. Sistem ini menghitung HPP otomatis dari komposisi + biaya produksi.

## Google Sheets

### Sheet 1: Formula_Master (BARU)
```
| Formula ID | Brand ID | Brand Name | Product Name | SKU | Product Type | Batch Size | Unit | Version | Status | Created | Updated |
|------------|----------|------------|--------------|-----|-------------|-----------|------|---------|--------|---------|---------|
| F-ARC-001  | brand-larc | L'Arc~en~Scent | EDP 30ml Rose | ARC-EDP-30 | Perfume | 50 | ml | v1.0 | Active | 2026-06-19 | 2026-06-19 |
```

### Sheet 2: Formula_Ingredients (BARU)
```
| Formula ID | Ingredient ID | Ingredient Name | Category | Qty (ml) | % | Unit Cost | Total Cost | Supplier | Notes |
|------------|---------------|-----------------|----------|----------|---|-----------|------------|----------|-------|
| F-ARC-001  | INV-RM-001    | Alcohol 96%     | solvent  | 15       | 30% | 35000     | 525000     | TBA      | 15ml × Rp 35000/liter |
| F-ARC-001  | INV-RM-003    | Fragrance Oil   | oil      | 5        | 10% | 450000    | 2250000    | TBA      | 5ml × Rp 450000/kg |
| F-ARC-001  | INV-RM-002    | Fixative Base   | fixative | 2        | 4%  | 185000    | 370000     | TBA      | 2ml × Rp 185000/kg |
```

### Sheet 3: Formula_Cost_Summary (BARU)
```
| Formula ID | Ingredient Cost | Bottling Cost | Packaging Cost | Other Cost | Total HPP/Unit | Margin % | Suggested Price | Created |
|------------|-----------------|---------------|----------------|------------|----------------|----------|-----------------|---------|
| F-ARC-001  | 3145000         | 150000        | 200000         | 50000      | 68900          | 60%      | 172250          | 2026-06-19 |
```

## API Routes

### /api/formulas
- GET /api/formulas — list all formulas (join Formula_Master + Formula_Cost_Summary)
- GET /api/formulas/[id] — get formula detail with ingredients
- POST /api/formulas — create new formula + ingredients + cost summary
- PUT /api/formulas/[id] — update formula
- DELETE /api/formulas/[id] — delete formula

### Cost Calculation Logic
```
ingredient_cost = sum(qty × unit_cost) for each ingredient
total_production_cost = ingredient_cost + bottling + packaging + other
hpp_per_unit = total_production_cost / batch_size
suggested_price = hpp_per_unit / (1 - margin_percent)
```

## UI Design

### Page: /formulas

```
┌─────────────────────────────────────────────────┐
│ Formula / Recipe Management      [+ New Formula]│
│ Komposisi bahan & HPP calculator per produk     │
├─────────────────────────────────────────────────┤
│ [Formulas] [Ingredients] [Cost Analysis]        │
├─────────────────────────────────────────────────┤
│                                                  │
│  Tab: Formulas                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ [+ New Formula] Search: [________]          │ │
│  ├─────────────────────────────────────────────┤ │
│  │ Formula │ Brand │ Product │ Batch │ HPP    │ │
│  │ F-001   │ L'Arc │ EDP 30ml│ 50ml  │ 68.9k  │ │
│  │ F-002   │ Pixel │ EDP 50ml│ 30ml  │ 85.2k  │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  Tab: Formula Detail (when selected)             │
│  ┌─────────────────────────────────────────────┐ │
│  │ 🧪 F-001: EDP 30ml Rose (L'Arc~en~Scent)   │ │
│  │ Batch Size: 50ml │ Version: v1.0 │ Active   │ │
│  │                                              │ │
│  │ Komposisi Bahan:                             │ │
│  │ ┌──────────────────────────────────────────┐ │ │
│  │ │ Bahan │ Qty │ % │ Unit Cost │ Total     │ │ │
│  │ │ Alcohol 96% │ 15ml │ 30% │ 35.000 │ 525.000 │ │ │
│  │ │ Fragrance Oil│ 5ml  │ 10% │ 450.000│ 2.250.000│ │ │
│  │ │ Fixative │ 2ml  │ 4% │ 185.000│ 370.000 │ │ │
│  │ └──────────────────────────────────────────┘ │ │
│  │                                              │ │
│  │ 💰 Cost Breakdown:                           │ │
│  │ ┌──────────────────────────────────────────┐ │ │
│  │ │ Ingredient Cost │ Rp 3.145.000          │ │ │
│  │ │ Bottling        │ Rp 150.000            │ │ │
│  │ │ Packaging       │ Rp 200.000            │ │ │
│  │ │ Other           │ Rp 50.000             │ │ │
│  │ │ Total HPP/Unit  │ Rp 68.900             │ │ │
│  │ │ Margin          │ 60%                   │ │ │
│  │ │ Suggested Price │ Rp 172.250            │ │ │
│  │ └──────────────────────────────────────────┘ │ │
│  │                                              │ │
│  │  [Edit] [Duplicate] [Export] [Deactivate]    │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  Tab: Cost Analysis                              │
│  ┌─────────────────────────────────────────────┐ │
│  │  Cost per Brand (pie chart)                 │ │
│  │  HPP Trend (line chart)                      │ │
│  │  Top Ingredients by Cost (table)             │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Formula Builder Form (Create/Edit)
```
┌──────────────────────────────────────────────────┐
│ 🧪 Formula Builder                               │
├──────────────────────────────────────────────────┤
│ Brand: [L'Arc~en~Scent ▼]                        │
│ Product Name: [EDP 30ml Rose        ]           │
│ SKU: [ARC-EDP-30                    ]           │
│ Batch Size: [50] ml                              │
│ Version: [v1.0                      ]           │
│                                                   │
│ ── Komposisi Bahan ──────────────────────────────│
│ [+ Add Ingredient]                               │
│                                                   │
│ │ Bahan ▼ │ Qty │ Unit │ % │ Unit Cost │ Total  │
│ │ Alcohol │ 15  │ ml   │ 30│ 35.000   │ 525k   │
│ │ Fr.Oil  │ 5   │ ml   │ 10│ 450.000  │ 2.250k │
│ │ Fixative│ 2   │ ml   │ 4 │ 185.000  │ 370k   │
│                                                   │
│ ── Biaya Produksi ───────────────────────────────│
│ Bottling:    [150.000               ]            │
│ Packaging:   [200.000               ]            │
│ Other:       [50.000                ]            │
│                                                   │
│ ── Hasil Kalkulasi ──────────────────────────────│
│ ┌──────────────────────────────────────────────┐ │
│ │ Ingredient Cost:  Rp 3.145.000              │ │
│ │ Total Production: Rp 3.545.000              │ │
│ │ HPP per Unit:     Rp 68.900                 │ │
│ │ Margin:           60%                        │ │
│ │ Suggested Price:  Rp 172.250                │ │
│ └──────────────────────────────────────────────┘ │
│                                                   │
│  [Cancel]                    [💾 Save Formula]   │
└──────────────────────────────────────────────────┘
```

## Seed Data (3 formulas)

### 1. L'Arc~en~Scent — EDP 30ml Rose
- Alcohol 96%: 15ml (30%), Fragrance Oil Rose: 5ml (10%), Fixative: 2ml (4%), Other: 28ml (56%)
- Batch: 50ml, HPP: ~Rp 68.900

### 2. Pixel Potion — EDP 30ml Ocean
- Alcohol 96%: 14ml (28%), Fragrance Oil Ocean: 6ml (12%), Fixative: 2ml (4%), Other: 28ml (56%)
- Batch: 30ml, HPP: ~Rp 85.200

### 3. Nuscentza — EDP 30ml Heritage
- Alcohol 96%: 13ml (26%), Fragrance Oil Heritage: 7ml (14%), Fixative: 3ml (6%), Other: 27ml (54%)
- Batch: 40ml, HPP: ~Rp 75.500

## Integration dengan Module Lain
- **Production:** Saat buat batch, pilih Formula → HPP auto-fill dari formula
- **Inventory:** Ingredient di-link ke Inventory_Master → stok bahan baku
- **Compliance:** Formula_Ingredients bisa cross-check dengan Compliance_Checks (IFRA)
- **QC:** QC_Checklist bisa refer ke Formula untuk verifikasi komposisi

## QA Plan
1. Create 3 seed formulas → verify Sheets
2. Read formulas → verify UI display
3. Edit formula → verify Sheets update
4. Delete formula → verify Sheets delete
5. Cost calculation → verify math is correct
6. Integration test: create production batch with formula → verify HPP auto-fill
