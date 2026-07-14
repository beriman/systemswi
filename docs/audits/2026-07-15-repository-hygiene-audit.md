# Repository Hygiene Audit — SystemSWI Ecosystem

**Tanggal audit:** 2026-07-15  
**Auditor:** HemuHemu / Hermes Agent  
**Source utama resmi:** `/home/ubuntu/systemswi`  
**Penamaan resmi:** SystemSWI  
**Scope:** non-destruktif; tidak ada reset, delete, merge, overwrite, atau push commit lokal dari repo dirty.

---

## 0. Ketentuan Sementara dari Enterprise Architect

Audit ini mengikuti ketentuan sementara berikut:

- `/home/ubuntu/systemswi` adalah source utama SystemSWI.
- `/home/ubuntu/systemswi-agent` bukan source utama.
- Repo dirty tidak boleh dihapus, reset, merge, atau overwrite tanpa laporan dan approval.
- Dua commit lokal di `/home/ubuntu/wangi-creations-hub` tidak boleh dipush sebelum review ringkas.
- Perubahan low-risk boleh memakai workflow: Plan -> Implement -> Verify -> Commit -> Push -> Patch Log -> Report.
- Perubahan medium/high-risk wajib memakai workflow: Spec/Issue -> Branch -> Implement -> Verify -> Draft PR -> Report -> Review -> Merge.
- SystemSWI memiliki empat pilar utama: Media, Komunitas, Event, Retail.

---

## 1. Executive Summary

| Repo | Status | Risiko | Rekomendasi |
|---|---|---|---|
| `/home/ubuntu/systemswi` | Clean, sync dengan origin | Rendah | Tetap menjadi source utama SystemSWI. |
| `/home/ubuntu/systemswi-agent` | Clone/copy terpisah, commit lama, 39 file modified | Tinggi jika dipakai langsung | Jangan dipakai sebagai source. Archive atau ekstrak selektif setelah review. |
| `/home/ubuntu/wangi-creations-hub` | Clean working tree, ahead 2 commits | Sedang-rendah | Aman secara verification utama, tetapi jangan push sebelum approval/review singkat. |
| `/home/ubuntu/holding-swi` | Dirty: SQLite DB modified + 4 untracked extractor scripts | Sedang | Perlakukan sebagai legacy/active-reference; jangan delete. Migrasi data penting ke SystemSWI bila diperlukan. |

---

## 2. Audit `/home/ubuntu/systemswi-agent`

### 2.1 Relationship dengan source utama

`/home/ubuntu/systemswi-agent` **bukan registered git worktree** dari `/home/ubuntu/systemswi`.

Bukti:

```text
git -C /home/ubuntu/systemswi worktree list --porcelain
worktree /home/ubuntu/systemswi
HEAD 14f97a55a1e8638ed3c71c43964168e71d603a79
branch refs/heads/main
```

Hanya `/home/ubuntu/systemswi` yang tercatat sebagai worktree.

`systemswi-agent` adalah clone/copy terpisah dari repo yang sama:

```text
Remote: https://github.com/beriman/systemswi.git
Branch: main
HEAD systemswi-agent: 1aa39ec fix: vercel.json prebuilt deploy
HEAD source utama:   14f97a5 feat(gcg): surface expense needs proof queue
```

Setelah fetch remote di `systemswi-agent`:

```text
merge-base: 1aa39ec200410ff88c5ec24ca7d1cde60b406425
origin/main...HEAD: 58 0
```

Artinya:

- `systemswi-agent` berada **58 commit di belakang** `origin/main` / source utama.
- Tidak ada commit unik di `systemswi-agent` yang belum ada di origin berdasarkan commit history.
- Tetapi ada **dirty working tree** berisi perubahan lokal yang belum dicommit.

### 2.2 Seluruh file modified

`systemswi-agent` memiliki 39 file modified:

```text
.gitignore
package.json
src/app/(public)/portfolio/page.tsx
src/app/(workspace)/agent-dashboard/page.tsx
src/app/(workspace)/crm/page.tsx
src/app/(workspace)/customers/page.tsx
src/app/(workspace)/dashboard/page.tsx
src/app/(workspace)/invoice/page.tsx
src/app/(workspace)/reorder/page.tsx
src/app/(workspace)/sukuk/page.tsx
src/app/(workspace)/users/page.tsx
src/app/api/agent/health/route.ts
src/app/api/agent/telegram-webhook/route.ts
src/app/api/auth/callback/google/route.ts
src/app/api/auth/google/route.ts
src/app/api/bep/seed/route.ts
src/app/api/bpom/route.ts
src/app/api/budget/seed/route.ts
src/app/api/buku-kas/fix-seed/route.ts
src/app/api/buku-kas/seed/route.ts
src/app/api/cash-harian/seed-data/route.ts
src/app/api/customers/[id]/interactions/route.ts
src/app/api/customers/[id]/route.ts
src/app/api/customers/seed/route.ts
src/app/api/dashboard/route.ts
src/app/api/production/seed/route.ts
src/app/api/qc/route.ts
src/app/api/qc/seed/route.ts
src/app/api/reorder/seed/route.ts
src/app/api/sales/seed/route.ts
src/app/api/tasks/seed/route.ts
src/components/chat/floating-chat.tsx
src/lib/ai/openrouter.ts
src/lib/auth/index.ts
src/lib/event/sheets.ts
src/lib/sheets/sheets-real.ts
src/proxy.ts
src/stores/auth-store.ts
vercel.json
```

Dirty diff stat:

```text
39 files changed, 712 insertions(+), 126 deletions(-)
```

Area perubahan dominan:

- dashboard per divisi,
- API dashboard financial divisi,
- auth/proxy/session handling,
- Google Sheets/event helper,
- seed route hardening,
- Vercel config,
- package/dependency changes.

### 2.3 Ringkasan perbedaan dengan `/home/ubuntu/systemswi`

Karena `systemswi-agent` tertinggal 58 commit, perbandingan langsung terhadap source utama menunjukkan banyak fitur GCG terbaru **tidak ada** di `systemswi-agent`.

Diff committed `systemswi-agent` vs `origin/main` menunjukkan penghapusan/ketiadaan fitur berikut jika agent dijadikan basis:

```text
docs/plans/2026-07-11-gcg-etika-keuangan-systemswi-plan.md
reports/2026-07-rtf-vol-2-financial-summary.md
src/app/(workspace)/governance/page.tsx
src/app/api/governance/audit/route.ts
src/app/api/governance/compliance-register/route.ts
src/app/api/governance/dashboard/route.ts
src/app/api/governance/vendor-register/route.ts
src/app/api/shareholder-ledger/route.ts
src/lib/governance/*
src/lib/shareholder/ledger.ts
```

Kesimpulan:

- `systemswi-agent` tidak boleh dipakai sebagai source utama.
- Jika dipakai langsung, ada risiko besar menghapus/menimpa kerja ETIKA TARIF terbaru.

### 2.4 Commit/perubahan unik yang belum ada di source utama

Commit unik:

```text
Tidak ada commit unik di systemswi-agent yang belum ada di origin/main.
```

Perubahan unik hanya berupa **working tree modifications** 39 file.

Potensi nilai unik dari dirty changes:

1. Dashboard per divisi lama:
   - menambahkan tab `Per Divisi` di dashboard.
   - menghitung omzet/biaya/laba per divisi dari Brand/Event data.
2. Dashboard API lama:
   - helper kategorisasi divisi berdasarkan heuristik brand/category.
3. Auth/proxy fixes:
   - perlu review selektif karena menyentuh auth, callback, proxy, session store.
4. Seed route hardening:
   - banyak seed endpoints berubah; perlu review keamanan sebelum merge.

Catatan: sebagian ide dashboard per divisi mungkin masih berguna, tetapi implementasi ini berada di atas basis lama dan konflik dengan modul GCG terbaru.

### 2.5 Rekomendasi aman

Rekomendasi: **Archive dulu, jangan merge langsung.**

Urutan aman:

1. Buat archive branch dari kondisi dirty `systemswi-agent` jika ingin menyimpan jejak:
   - tidak dilakukan dalam audit ini karena butuh approval.
2. Generate patch file read-only untuk review:
   - misalnya `git diff > docs/audits/systemswi-agent-dirty.patch` bila diminta.
3. Seleksi manual perubahan yang bernilai:
   - dashboard per divisi,
   - helper kategorisasi divisi,
   - auth/proxy fixes jika masih relevan.
4. Re-implement selektif di `/home/ubuntu/systemswi` lewat branch/PR, bukan merge langsung.
5. Setelah semua nilai sudah diekstrak dan disetujui, `systemswi-agent` boleh di-archive/delete nanti dengan approval.

Status rekomendasi:

```text
systemswi-agent = archive / selective extraction candidate, bukan source utama.
```

---

## 3. Audit `/home/ubuntu/wangi-creations-hub`

### 3.1 Status repo

```text
Branch: main
Status: main...origin/main [ahead 2]
Working tree: clean
```

Ahead/behind:

```text
origin/main...HEAD = 0 behind, 2 ahead
```

### 3.2 Dua commit ahead dari origin

```text
00b0379 🔒 Hanks: gate edit profile auth
9d92aad 🔒 Hanks: sanitize edge error responses
```

#### Commit 1: `00b0379` — gate edit profile auth

File berubah:

```text
src/pages/EditProfile.tsx
```

Stat:

```text
1 file changed, 101 insertions(+), 23 deletions(-)
```

Ringkasan:

- Menambahkan page-level auth/loading gate untuk halaman edit profile.
- Menunda setup/fetch profile sampai session terverifikasi.
- Mengurangi risiko protected shell/fetch berjalan sebelum auth selesai.

#### Commit 2: `9d92aad` — sanitize edge error responses

File berubah:

```text
supabase/functions/audit-log/index.ts
supabase/functions/award-xp/index.ts
supabase/functions/check-briva-balance/index.ts
supabase/functions/create-mediation-group/index.ts
supabase/functions/forum-thread-preview/index.ts
supabase/functions/get-rajaongkir-provinces/index.ts
supabase/functions/parse-social-embed/index.ts
supabase/functions/start-brand-chat/index.ts
supabase/functions/upload-chat-attachment/index.ts
```

Stat:

```text
9 files changed, 47 insertions(+), 25 deletions(-)
```

Ringkasan:

- Mengganti error response yang terlalu detail menjadi generic/sanitized.
- Mengurangi risiko leak raw provider/Supabase/error message ke client.
- Relevan dengan security hardening Edge Functions.

### 3.3 File berubah dari dua commit ahead

Total:

```text
10 files changed, 148 insertions(+), 48 deletions(-)
```

Daftar:

```text
src/pages/EditProfile.tsx
supabase/functions/audit-log/index.ts
supabase/functions/award-xp/index.ts
supabase/functions/check-briva-balance/index.ts
supabase/functions/create-mediation-group/index.ts
supabase/functions/forum-thread-preview/index.ts
supabase/functions/get-rajaongkir-provinces/index.ts
supabase/functions/parse-social-embed/index.ts
supabase/functions/start-brand-chat/index.ts
supabase/functions/upload-chat-attachment/index.ts
```

### 3.4 Verification results

| Command | Result | Catatan |
|---|---|---|
| `npm run typecheck` | PASS | `tsc --noEmit` exit 0 |
| `npm run build` | PASS | Vite build selesai; ada warning deprecation/performance non-blocking |
| `npm run test:run` | PASS | 6 files, 53 tests passed |
| `npm run security:scan` | PASS | 1039 tracked files passed |
| `npm run security:rls-check` | PASS | 18 critical tables checked across 126 migrations |
| `npx --yes bun audit --audit-level moderate` | PASS | No vulnerabilities found |
| `npm run lint` | FAIL | 258 errors, 457 warnings pre-existing broad lint debt |
| Scoped ESLint on 10 changed files | PASS with warnings | 0 errors, 24 warnings |
| Scoped Deno check on changed Edge Functions | PASS | exit 0 |

Full lint failure is broad/pre-existing. It includes many unrelated `no-explicit-any`, hook rules, and `no-console` findings across files outside the two commits.

Important scoped result:

```text
npx eslint <10 changed files>
0 errors, 24 warnings
```

Warnings are mostly existing `console` warnings and one hook dependency warning in `EditProfile.tsx`.

### 3.5 Apakah aman untuk push?

Technical verification: **relatif aman untuk push** dari sisi build/typecheck/test/security/scoped lint.

Namun sesuai instruksi Architect:

```text
Jangan push dua commit lokal wangi-creations-hub sebelum review ringkas dan approval.
```

Rekomendasi:

- Status: **hold for approval**.
- Jika Beriman/Architect approve, dua commit ini layak dipush karena:
  - working tree clean,
  - behind 0,
  - verification utama pass,
  - scoped changed-file lint 0 errors,
  - scoped Deno check pass.

Risiko:

1. Full lint tetap gagal karena debt lama.
2. `EditProfile.tsx` masih punya warnings console/hook dependency.
3. Edge functions masih punya console warnings, walau commit ini fokus sanitasi client-facing error.
4. Perlu live verification setelah push/deploy.

---

## 4. Audit `/home/ubuntu/holding-swi`

### 4.1 Status repo

```text
Branch: main
Status: main...origin/main
HEAD: 6e93421 fix: Lazy OpenAI client initialization
```

Dirty files:

```text
M  db/sukuk.db
?? extract-data.mjs
?? extract-data2.mjs
?? extract-data3.mjs
?? extract-sheets.mjs
```

### 4.2 Modified file: `db/sukuk.db`

File info:

```text
SQLite 3.x database
Size: 164K
Binary diff only
```

Git diff:

```text
db/sukuk.db | Bin 167936 -> 167936 bytes
```

Artinya database berubah secara binary, ukuran tetap sama. Perlu dianggap berisi data penting sampai dibuktikan sebaliknya.

### 4.3 SQLite schema dan isi data

Tables/views:

```text
audit_log
investor_payouts
investors
notifications
profit_distributions
rab_items
sessions
sqlite_sequence
sukuk
sukuk_investments
users
v_investor_summary
v_sukuk_progress
```

Row counts utama:

| Table | Rows | Catatan |
|---|---:|---|
| `audit_log` | 0 | belum ada log |
| `investor_payouts` | 0 | belum ada payout |
| `investors` | 0 | belum ada investor tercatat |
| `notifications` | 0 | belum ada notifikasi |
| `profit_distributions` | 0 | belum ada distribusi profit |
| `rab_items` | 19 | memuat RAB Sukuk Store TIM / investor-funded items |
| `sessions` | 2 | memuat token session lama; sensitif |
| `sukuk` | 1 | `SWQ-001`, Sukuk Musyarakah SWI Store TIM |
| `sukuk_investments` | 0 | belum ada investasi |
| `users` | 1 | user `beriman`, password hash; sensitif |

Sample penting:

- `sukuk`:
  ```text
  SWQ-001 — Sukuk Musyarakah SWI Store TIM
  nilai_sukuk: 1.000.000.000
  harga_unit: 1.000.000
  total_unit: 1000
  unit_terjual: 0
  nisbah_investor_pct: 42.5
  nisbah_swi_pct: 42.5
  tim_fee_pct: 10.0
  reserve_pct: 5.0
  status: open
  ```

- `rab_items`:
  ```text
  19 rows RAB, termasuk sewa ruko TIM, utilitas, interior, dll.
  ```

- `users` dan `sessions`:
  ```text
  Ada user admin dan session tokens lama. Ini sensitif dan tidak boleh dipublish ulang sembarangan.
  ```

### 4.4 Untracked files dan fungsi

#### `extract-data.mjs`

Fungsi:

- Script ekstraksi data finance dari Google Sheets via REST API memakai access token langsung.
- Menulis output ke `/tmp/sheets-data.json`.
- Mengandung path token lokal yang sudah diredaksi oleh tool output.

Risiko:

- Token path hardcoded.
- Tidak ideal untuk dicommit.
- Lebih cocok sebagai scratch script yang dipindahkan ke `scripts/` dengan sanitasi jika masih dibutuhkan.

#### `extract-data2.mjs`

Fungsi:

- Ekstraksi Google Sheets via `googleapis` dan OAuth2 refresh/access token.
- Menulis output ke `/tmp/sheets-data.json`.

Risiko:

- Token path hardcoded.
- Scratch script; jangan commit tanpa refactor.

#### `extract-data3.mjs`

Fungsi:

- Refresh token Google Sheets lalu ekstrak data.
- Menulis kembali token refreshed ke token file.

Risiko lebih tinggi:

- Mengubah credential/token file saat dijalankan.
- Tidak boleh dijalankan/commit tanpa approval.
- Harus dianggap sensitive operational script.

#### `extract-sheets.mjs`

Fungsi:

- Ekstrak finance sheets via `readSheet` dari `./src/lib/sheets.ts`.
- Menulis output ke `/tmp/sheets-data.json`.

Risiko:

- Lebih aman dibanding tiga script lain, tetapi masih scratch/untracked.
- Perlu dicek apakah path import masih valid.

### 4.5 Apakah database lokal memuat data penting?

Ya. `db/sukuk.db` memuat data penting/berisiko:

- RAB Sukuk Store TIM (`rab_items`, 19 rows).
- Sukuk product config (`sukuk`, 1 row).
- User admin dengan password hash (`users`, 1 row).
- Session tokens lama (`sessions`, 2 rows).

Walau investor/payout masih kosong, database ini tetap tidak boleh dihapus atau dipublish sembarangan.

### 4.6 Rekomendasi status repository

Rekomendasi: **legacy active-reference / migration candidate**.

Bukan source utama SystemSWI, tetapi masih punya nilai historis dan data sukuk/RAB.

Langkah aman:

1. Jangan delete repo.
2. Jangan commit `extract-data*.mjs` apa adanya.
3. Jangan commit `db/sukuk.db` sebelum diputuskan apakah DB binary memang harus versioned.
4. Buat export terstruktur non-sensitive dari data penting:
   - RAB items,
   - sukuk config,
   - tanpa session tokens/password hash.
5. Migrasi data yang masih relevan ke SystemSWI module `/sukuk` atau Google Sheets source-of-truth.
6. Setelah migrasi terverifikasi, repo bisa diubah status menjadi archive.

Status rekomendasi:

```text
holding-swi = legacy active-reference, perlu migrasi selektif sebelum archive.
```

---

## 5. Patch Log

### Added

- Laporan audit repository hygiene ekosistem SystemSWI.
- Dokumentasi status `systemswi-agent`, `wangi-creations-hub`, dan `holding-swi`.
- Patch log standar dengan format Added/Changed/Fixed/Security/Verification/Impact/Known Limitations/Next.

### Changed

- Tidak ada perubahan pada source code aplikasi.
- Tidak ada perubahan pada database, branch, worktree, credential, atau source-of-truth.
- Hanya melakukan `git fetch` read-only untuk memperoleh status remote terbaru.

### Fixed

- Tidak ada fix kode dilakukan dalam audit ini.

### Security

- Mengidentifikasi `holding-swi/db/sukuk.db` berisi user admin password hash dan session tokens lama.
- Mengidentifikasi `extract-data3.mjs` sebagai script berisiko karena bisa refresh dan menulis credential token lokal.
- Mengidentifikasi `systemswi-agent` sebagai risiko overwrite karena tertinggal 58 commit dan memiliki 39 dirty files.
- Mengidentifikasi `wangi-creations-hub` ahead commits sebagai security-hardening candidate yang sudah verified tetapi masih menunggu approval sebelum push.

### Verification

Commands utama yang dijalankan:

```text
/home/ubuntu/systemswi-agent:
- git worktree list --porcelain
- git fetch origin main
- git status --short --branch
- git rev-list --left-right --count origin/main...HEAD
- git diff --stat

/home/ubuntu/wangi-creations-hub:
- git fetch origin main
- git status --short --branch
- git log origin/main..HEAD
- npm run typecheck
- npm run build
- npm run test:run
- npm run security:scan
- npm run security:rls-check
- npx --yes bun audit --audit-level moderate
- npm run lint
- npx eslint <10 changed files>
- npx --yes deno check --no-config <changed edge functions>

/home/ubuntu/holding-swi:
- git fetch origin main
- git status --short --branch
- git diff --stat
- file/db inspection
- sqlite schema/read-only row count via Python sqlite3
```

### Impact

- Memberikan dasar keputusan aman sebelum cleanup repo.
- Mencegah penggunaan `systemswi-agent` sebagai source lama yang bisa menimpa kerja ETIKA TARIF.
- Memberikan review awal agar dua commit `wangi-creations-hub` tidak dipush tanpa konteks.
- Menandai `holding-swi` sebagai repo yang masih menyimpan data sukuk/RAB dan credential-sensitive local DB.

### Known Limitations

- Tidak melakukan semantic deep review lengkap seluruh 39 file dirty di `systemswi-agent`; audit ini hanya mengklasifikasikan area perubahan dan risiko.
- Tidak membaca seluruh isi binary DB beyond schema/sample row read-only.
- Tidak menjalankan live Vercel verification untuk dua commit `wangi-creations-hub` karena belum dipush/deploy.
- Full lint `wangi-creations-hub` gagal karena debt lama; audit memakai scoped lint untuk changed files sebagai evidence tambahan.

### Next

1. Minta approval apakah dua commit `wangi-creations-hub` boleh dipush.
2. Jika approve, push lalu verify live deployment.
3. Untuk `systemswi-agent`, buat patch archive atau branch snapshot hanya setelah approval.
4. Extract selektif dashboard per-divisi dari `systemswi-agent` bila Architect masih butuh ide itu.
5. Untuk `holding-swi`, buat migration plan data sukuk/RAB ke SystemSWI dan jangan commit token extractor scripts.

---

## 6. Keputusan yang Dibutuhkan dari Beriman / Enterprise Architect

1. Apakah dua commit `wangi-creations-hub` boleh dipush ke GitHub/main?
2. Apakah `systemswi-agent` perlu dibuat branch/archive snapshot sebelum cleanup?
3. Apakah `holding-swi` akan dipertahankan sebagai legacy reference atau dimigrasikan penuh ke SystemSWI?
4. Apakah data sukuk/RAB di `holding-swi/db/sukuk.db` harus diekspor ke Google Sheets/SystemSWI?
5. Apakah script extractor Google Sheets boleh dihapus nanti setelah migrasi atau perlu disanitasi menjadi script resmi?
