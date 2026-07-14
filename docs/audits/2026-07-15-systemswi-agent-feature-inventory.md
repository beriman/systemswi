# Feature Inventory — Snapshot `systemswi-agent`

**Tanggal:** 2026-07-15  
**Source resmi SystemSWI:** `/home/ubuntu/systemswi`  
**Repo snapshot:** `/home/ubuntu/systemswi-agent`  
**Remote branch archive:** `archive/systemswi-agent-2026-07-15`  
**Archive commit:** `cdb2adccdce63122419fa18cf0e8ce77509e39ba`  
**Base commit archive:** `1aa39ec200410ff88c5ec24ca7d1cde60b406425`  
**Status:** snapshot aman; tidak di-merge ke main.

---

## 1. Ringkasan

`systemswi-agent` berisi 39 file modified yang sudah disimpan ke remote branch archive. Snapshot ini **bukan source utama** dan tertinggal 58 commit dari `origin/main` SystemSWI saat audit.

Tujuan inventory ini adalah mencatat fitur/ide unik yang mungkin masih berguna, konflik dengan source utama, dan rekomendasi aman.

---

## 2. Inventory Fitur / Ide Unik

| Area | File sumber di archive | Ide/Fitur | Masih relevan? | Konflik dengan source utama | Rekomendasi |
|---|---|---|---|---|---|
| Dashboard per divisi | `src/app/(workspace)/dashboard/page.tsx` | Menambahkan tab `Per Divisi`, quick summary per divisi, KPI omzet/biaya/laba, margin bar, dan ringkasan perbandingan divisi. | Ya, relevan dengan pilar SystemSWI: Media, Komunitas, Event, Retail. | Tinggi. Source utama sudah punya dashboard GCG terbaru dari ETIKA TARIF; file dashboard lama berbeda jauh. | **reimplement** selektif di source utama, jangan cherry-pick langsung. |
| API financial per divisi | `src/app/api/dashboard/route.ts` | Helper `summarizeDivisiFinancials`, mapping brand/category ke divisi, agregasi sales/expense/event revenue. | Ya, idenya berguna, tetapi logika divisi perlu disesuaikan dengan empat pilar resmi. | Tinggi. Source utama dashboard API sudah berubah untuk GCG, compliance, governance summary. | **reimplement** setelah data contract divisi disetujui. |
| Kategorisasi divisi berbasis heuristik | `src/app/api/dashboard/route.ts` | `DIVISI_KEYWORDS`, `categorizeDivisi`, `categorizeExpenseDivisi`. | Sebagian. Bisa jadi fallback, tapi pilar resmi sekarang Media, Komunitas, Event, Retail; bukan Produksi/Website/Event/Store sebagai silo. | Medium. Heuristik lama dapat menghasilkan klasifikasi salah bila dipakai sebagai source of truth. | **needs review**; jadikan helper sementara, bukan aturan utama. |
| Integrasi event sheets tambahan | `src/lib/event/sheets.ts` | Penambahan pembacaan/normalisasi data event dan financial rows untuk dashboard. | Ya, terutama untuk Event Closeout Report. | Medium. Source utama sudah punya closeout/event modules terbaru. | **needs review** lalu reimplement bagian yang masih cocok. |
| Google Sheets real helper | `src/lib/sheets/sheets-real.ts` | Perubahan helper sheets, kemungkinan untuk memperbaiki range/auth/normalisasi. | Mungkin. | Medium. Risiko menyentuh source-of-truth access. | **needs review** detail sebelum dipakai. |
| Auth Google route | `src/app/api/auth/google/route.ts`, `src/app/api/auth/callback/google/route.ts` | Perubahan login/callback Google. | Mungkin. | Tinggi. Auth termasuk domain kritis dan source utama sudah berkembang. | **needs review**; hanya boleh lewat spec/branch/PR dan approval. |
| Proxy/session handling | `src/proxy.ts`, `src/stores/auth-store.ts`, `src/lib/auth/index.ts` | Perubahan session/proxy/auth store. | Mungkin. | Tinggi karena auth/permission. | **needs review**; jangan merge langsung. |
| Telegram webhook agent | `src/app/api/agent/telegram-webhook/route.ts` | Perubahan webhook handling untuk agent Telegram. | Mungkin. | Medium-tinggi; bisa memengaruhi runtime automation/approval. | **needs review**. |
| Agent health | `src/app/api/agent/health/route.ts` | Perubahan kecil health endpoint. | Ya jika masih relevan. | Rendah-medium. | **reimplement** bila health check sekarang kurang informatif. |
| Seed route hardening | `src/app/api/*/seed*/route.ts` | Banyak seed endpoint berubah: BEP, BPOM, Budget, Buku Kas, Cash Harian, Customers, Production, QC, Reorder, Sales, Tasks. | Sebagian. | Medium-tinggi karena seed dapat mengubah data bila endpoint aktif. | **needs review**; jangan aktifkan tanpa auth/guard/dry-run. |
| CRM/customers routes | `src/app/(workspace)/crm/page.tsx`, `src/app/(workspace)/customers/page.tsx`, `src/app/api/customers/*` | Minor changes pada CRM/customer UI/API. | Mungkin. | Medium; source utama bisa sudah berubah. | **needs review**. |
| Sukuk page | `src/app/(workspace)/sukuk/page.tsx` | Minor update di page sukuk. | Ya, terkait migration plan Sukuk/RAB. | Medium karena source utama module Sukuk harus mengikuti data contract baru. | **needs review** setelah migration plan. |
| Invoice/reorder/users minor UI | `src/app/(workspace)/invoice/page.tsx`, `reorder/page.tsx`, `users/page.tsx` | Perubahan kecil UI/typing. | Mungkin. | Rendah-medium. | **ignore sementara** kecuali ada issue spesifik. |
| Chat floating component | `src/components/chat/floating-chat.tsx` | Perubahan kecil chat widget. | Mungkin. | Rendah. | **ignore sementara**. |
| OpenRouter helper | `src/lib/ai/openrouter.ts` | Perubahan kecil AI provider helper. | Mungkin. | Medium karena provider/model routing sedang dirancang terpisah. | **needs review**; jangan campur dengan Model Routing HemuHemu. |
| Vercel/package config | `package.json`, `vercel.json`, `.gitignore` | Dependency/script/deploy config tweaks. | Sebagian mungkin obsolete. | Tinggi karena source utama Vercel sekarang deploys clean. | **obsolete / needs review**; jangan apply tanpa alasan build yang jelas. |
| Portfolio page | `src/app/(public)/portfolio/page.tsx` | Minor public portfolio change. | Mungkin. | Rendah. | **ignore sementara**. |

---

## 3. Rekomendasi Implementasi Ulang yang Aman

### 3.1 Dashboard Per Divisi / Pilar

Rekomendasi: **reimplement**, bukan merge.

Alasan:

- Idenya sesuai kebutuhan Beriman: dashboard financial per divisi/pilar.
- Implementasi lama memakai kategori `Produksi`, `Website`, `Event`; sedangkan nomenklatur resmi SystemSWI sekarang adalah:
  - Media
  - Komunitas
  - Event
  - Retail
- Source utama sudah memiliki modul GCG/ETIKA TARIF terbaru; cherry-pick dashboard lama berisiko conflict dan regression.

Usulan reimplement:

1. Buat data contract `Division/Pillar Financial Summary`.
2. Tentukan apakah `Produksi` menjadi bagian dari Retail atau operasional internal, bukan pilar terpisah.
3. Gunakan explicit mapping dari Google Sheets, bukan heuristik nama brand semata.
4. Tambahkan fallback heuristik hanya untuk data legacy yang belum punya kolom pilar.
5. Integrasikan ke dashboard source utama melalui branch/PR.

### 3.2 Event Financial Integration

Rekomendasi: **needs review -> reimplement selektif**.

Bagian yang mungkin berguna:

- pembacaan tenant/sponsor/event rows,
- summary revenue event,
- biaya event,
- basis untuk Event Closeout Report.

Jangan merge langsung karena source utama sudah punya event closeout GCG.

### 3.3 Auth/Proxy/Session Changes

Rekomendasi: **needs review, high risk**.

Semua perubahan auth/proxy/session wajib mengikuti workflow medium/high risk:

```text
Spec/Issue -> Branch -> Implement -> Verify -> Draft PR -> Review -> Merge
```

Tidak boleh diterapkan langsung ke main tanpa approval.

### 3.4 Seed Routes

Rekomendasi: **needs review**.

Seed routes harus:

- terlindungi auth/admin role,
- mendukung dry-run,
- tidak overwrite data production,
- memiliki audit trail,
- tidak tersedia publik tanpa guard.

---

## 4. Yang Diabaikan Sementara

Berikut area yang tidak direkomendasikan untuk dipindahkan sekarang:

- perubahan kecil UI invoice/reorder/users tanpa issue aktif;
- chat floating widget;
- package/vercel tweaks lama;
- portfolio minor tweak;
- dependency changes tanpa kebutuhan build saat ini.

---

## 5. Risiko Jika Snapshot Di-merge Langsung

Jika branch archive di-merge langsung ke source utama:

1. Risiko menghapus/mengembalikan fitur GCG terbaru karena base branch tertinggal 58 commit.
2. Risiko regression pada dashboard governance.
3. Risiko auth/session berubah tanpa review.
4. Risiko seed endpoint tidak aman.
5. Risiko config/dependency Vercel lama mengganggu deployment.

Karena itu, snapshot hanya menjadi **arsip referensi**, bukan branch feature siap merge.

---

## 6. Next Action

1. Buat issue/spec khusus `Division/Pillar Financial Dashboard v1`.
2. Minta Enterprise Architect menetapkan mapping pilar resmi:
   - Media
   - Komunitas
   - Event
   - Retail
3. Reimplement dari source utama `/home/ubuntu/systemswi`, bukan dari `systemswi-agent`.
4. Gunakan branch baru, bukan archive branch.
5. Archive branch tetap disimpan sebagai referensi historis.
