# Audit Extractor Scripts — `holding-swi`

**Tanggal:** 2026-07-15  
**Repo sumber:** `/home/ubuntu/holding-swi`  
**Scope:** read-only audit terhadap untracked extractor scripts.  
**Status:** script lama tidak dijalankan dan tidak dicommit.

---

## 1. Ringkasan

Ditemukan empat script untracked:

```text
extract-data.mjs
extract-data2.mjs
extract-data3.mjs
extract-sheets.mjs
```

Seluruh script berfungsi sebagai extractor data Google Sheets finance/holding. Namun tiga script pertama memakai credential/token path lokal hardcoded, dan `extract-data3.mjs` memiliki efek samping paling berisiko karena melakukan refresh token lalu menulis kembali credential/token file.

Keputusan audit:

- Jangan jalankan script mentah.
- Jangan commit script mentah.
- Khusus `extract-data3.mjs`, jangan dijalankan karena dapat mengubah token file.
- Jika fungsi extractor masih dibutuhkan, rewrite menjadi utility resmi dengan env/secret-store, dry-run, logging aman, dan no-token-output.

---

## 2. Audit Per Script

### 2.1 `extract-data.mjs`

#### Tujuan

Mengekstrak beberapa range finance/holding dari Google Sheets menggunakan REST API langsung.

#### Input

- Token credential file lokal hardcoded.
- Spreadsheet ID hardcoded:
  ```text
  1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA
  ```
- Daftar ranges, antara lain:
  - `Dashboard`
  - `RekapSetoran`
  - `Holding`
  - `PemegangSaham`
  - `Rekening_Koran`
  - `COA`
  - `Cash_Harian`
  - `Laporan_Bulanan`
  - `Budget_vs_Actual`
  - `Cashflow_Aktual`
  - `Break_Even_Analysis`
  - `Proyeksi_12Bulan`
  - `DivisiShareholders`
  - `SukukStore`

#### Output

Menulis hasil JSON ke:

```text
/tmp/sheets-data.json
```

#### Akses file/network

- Membaca credential/token file lokal.
- Melakukan request network ke Google Sheets API.
- Menulis output ke `/tmp/sheets-data.json`.

#### Credential/token behavior

- Mengambil access token dari file lokal.
- Mengirim token via query param `access_token=...` di URL Google Sheets API.
- Tidak tampak menulis token kembali.

#### Efek samping

- Menulis file `/tmp/sheets-data.json`.
- Mencetak status row count/error ke console.

#### Fungsi yang masih berguna

- Daftar sheet/range finance legacy berguna untuk mapping SystemSWI.
- Output JSON preview bisa berguna untuk migration audit jika script disanitasi.

#### Risiko

- Token path hardcoded.
- Access token dipakai dalam query string; lebih baik pakai Authorization header.
- Error logging berpotensi mencetak detail response.
- Tidak ada dry-run flag eksplisit.
- Tidak ada secret redaction.

#### Rekomendasi

```text
rewrite / sanitize
```

Jangan commit versi ini. Ambil hanya daftar sheet/range sebagai referensi.

---

### 2.2 `extract-data2.mjs`

#### Tujuan

Mengekstrak data Google Sheets finance/holding menggunakan `googleapis` dan OAuth2 client.

#### Input

- Credential/token file lokal hardcoded.
- Spreadsheet ID hardcoded.
- Daftar ranges mirip `extract-data.mjs`.

#### Output

Menulis hasil JSON ke:

```text
/tmp/sheets-data.json
```

#### Akses file/network

- Membaca credential/token file lokal.
- Membuat OAuth2 client.
- Mengakses Google Sheets API via `googleapis`.
- Menulis `/tmp/sheets-data.json`.

#### Credential/token behavior

- Membaca `client_id`, `client_secret`, `refresh_token`, `access_token`, expiry dari credential file.
- Menggunakan OAuth2 credentials untuk request.
- Tidak tampak force refresh/write token file seperti `extract-data3.mjs`.

#### Efek samping

- Network call ke Google Sheets.
- Menulis output JSON ke `/tmp`.
- Console log row count/error.

#### Fungsi yang masih berguna

- Lebih baik daripada `extract-data.mjs` karena memakai client library dan bukan token query param.
- Bisa jadi basis rewrite utility resmi.

#### Risiko

- Credential file path hardcoded.
- Client secret dibaca langsung dari file lokal.
- Tidak ada explicit dry-run/apply separation.
- Error handling masih console-based.
- Tidak ada structured logging atau redaction.

#### Rekomendasi

```text
sanitize / rewrite
```

Gunakan ide OAuth2 client, tapi ambil credential dari environment/secret store, bukan hardcoded local file.

---

### 2.3 `extract-data3.mjs`

#### Tujuan

Refresh Google Sheets OAuth token lalu mengekstrak data finance/holding.

#### Input

- Credential/token file lokal hardcoded.
- Spreadsheet ID hardcoded.
- OAuth2 client credentials.

#### Output

- Menulis ulang token credential file lokal setelah refresh.
- Menulis extracted data ke `/tmp/sheets-data.json`.

#### Akses file/network

- Membaca credential/token file.
- Melakukan OAuth token refresh network call.
- Menulis credential/token file lokal.
- Mengakses Google Sheets API.
- Menulis `/tmp/sheets-data.json`.

#### Credential/token behavior

Paling berisiko dari semua script:

- Memanggil refresh token.
- Menerima access token baru.
- Menulis token baru dan expiry kembali ke token file.
- Mencetak informasi refresh/expiry ke console.

#### Efek samping

- Mengubah credential/token file lokal.
- Network call ke OAuth/Google APIs.
- Menulis output JSON.

#### Fungsi yang masih berguna

- Secara konsep, refresh token handling dibutuhkan jika utility resmi harus berjalan unattended.
- Namun implementasi harus dipindah ke credential manager/secret store, bukan script scratch.

#### Risiko

- Bisa mengubah credential state tanpa audit.
- Bisa menyebabkan race dengan tool lain yang memakai token yang sama.
- Bisa mencetak informasi sensitif/metadata credential.
- Tidak boleh dijalankan dalam audit.
- Tidak boleh dicommit mentah.

#### Rekomendasi

```text
archive only / rewrite from scratch
```

Jangan sanitasi ringan. Jika fungsi refresh token dibutuhkan, gunakan Google auth library resmi dan secret store, dengan audit log, lock, dan no-console-token policy.

---

### 2.4 `extract-sheets.mjs`

#### Tujuan

Mengekstrak beberapa finance sheets melalui helper internal:

```text
import { readSheet } from "./src/lib/sheets.ts";
```

#### Input

- Helper `readSheet` dari source repo legacy.
- Daftar sheet finance:
  - `Dashboard`
  - `DashboardSetoran`
  - `RekapSetoran`
  - `Holding`
  - `PemegangSaham`
  - `RekeningKoran`
  - `RekeningMutasi`
  - `RekapRekening`
  - `COA`
  - `CashHarian`
  - `LaporanBulanan`
  - `BudgetVsActual`
  - `CashflowAktual`
  - `BreakEven`
  - `Proyeksi12Bulan`

#### Output

Menulis hasil JSON ke:

```text
/tmp/sheets-data.json
```

#### Akses file/network

Tergantung implementasi `readSheet` di repo legacy. Kemungkinan:

- membaca env/credential helper internal;
- akses Google Sheets;
- menulis output JSON ke `/tmp`.

#### Credential/token behavior

Tidak hardcode token langsung di script ini, tetapi credential behavior bergantung pada `src/lib/sheets.ts`.

#### Efek samping

- Network read ke Google Sheets.
- Menulis output JSON.

#### Fungsi yang masih berguna

- Ini versi paling dekat ke utility resmi karena memakai abstraction `readSheet`.
- Daftar sheet berguna sebagai referensi source-of-truth finance legacy.

#### Risiko

- Import path mungkin obsolete.
- Tidak ada dry-run flag eksplisit.
- Tidak ada structured output schema.
- Tidak jelas apakah helper aman dari secret logging.

#### Rekomendasi

```text
sanitize / rewrite
```

Gunakan konsep helper internal, tetapi buat utility baru di SystemSWI dengan credential handling yang jelas.

---

## 3. Rekomendasi Utility Baru

Jika fungsi extractor masih dibutuhkan, buat utility baru, misalnya:

```text
scripts/preview-google-sheets-finance-export.ts
```

Atau jika dipakai dari SystemSWI:

```text
src/lib/migration/preview-finance-sheets-export.ts
scripts/preview-finance-sheets-export.ts
```

### 3.1 Requirements

Utility baru wajib:

1. Mengambil credential hanya dari environment atau secret store:
   - `GOOGLE_SERVICE_ACCOUNT_JSON`, atau
   - `GOOGLE_APPLICATION_CREDENTIALS`, atau
   - Hermes/Google Workspace configured credential path yang disetujui.
2. Tidak mencetak token, refresh token, client secret, private key, atau full credential path.
3. Tidak menulis token ke repository.
4. Default mode adalah dry-run/read-only.
5. Menulis preview output ke `/tmp` atau `docs/reports/` hanya setelah path disetujui.
6. Mendukung flag eksplisit:
   ```text
   --dry-run
   --output /tmp/finance-sheets-preview.json
   --redact-sensitive
   ```
7. Tidak mengubah data Google Sheets tanpa flag eksplisit `--apply`, dan `--apply` tetap butuh approval manual.
8. Memiliki logging aman:
   - sheet name,
   - row count,
   - validation status,
   - error code ringkas,
   - tanpa raw token/API response yang sensitif.
9. Memiliki error handling structured:
   - auth missing,
   - permission denied,
   - sheet not found,
   - range invalid,
   - quota/rate limit,
   - network timeout.
10. Mendukung allowlist sheet/range dari config file, bukan hardcoded di script.

### 3.2 Proposed Config

```json
{
  "spreadsheet_id_env": "SWI_FINANCE_SPREADSHEET_ID",
  "sheets": [
    { "name": "Dashboard", "range": "Dashboard!A1:F9" },
    { "name": "Holding", "range": "Holding!A1:G5" },
    { "name": "COA", "range": "COA!A5:E60" },
    { "name": "CashHarian", "range": "Cash_Harian!A5:I20" },
    { "name": "SukukStore", "range": "SukukStore!A4:O9" }
  ]
}
```

### 3.3 Proposed CLI

```bash
node scripts/preview-google-sheets-finance-export.mjs \
  --config config/finance-sheets-export.json \
  --output /tmp/finance-sheets-preview.json \
  --dry-run \
  --redact-sensitive
```

### 3.4 Safe Output Shape

```json
{
  "generated_at": "2026-07-15T00:00:00+08:00",
  "spreadsheet_id_hash": "sha256:...",
  "mode": "dry-run",
  "sheets": [
    {
      "name": "Dashboard",
      "range": "Dashboard!A1:F9",
      "row_count": 9,
      "status": "ok"
    }
  ],
  "errors": []
}
```

---

## 4. Archive/Removal Policy

Script lama tidak dihapus sekarang. Rekomendasi lifecycle:

| Script | Status sekarang | Setelah utility baru tersedia | Final |
|---|---|---|---|
| `extract-data.mjs` | untracked scratch | archive as reference | remove later after approval |
| `extract-data2.mjs` | untracked scratch | archive as reference | remove later after approval |
| `extract-data3.mjs` | high-risk scratch | archive only, never run | remove later after approval |
| `extract-sheets.mjs` | scratch helper | compare with new utility | remove/supersede after approval |

---

## 5. Security Notes

- Jangan commit credential path hardcoded.
- Jangan commit token file.
- Jangan memakai access token sebagai query parameter.
- Jangan refresh/write token dari script scratch.
- Jangan mencetak raw Google API error yang mengandung request detail sensitif.
- Jangan menulis output ke repo bila output memuat PII/finance raw data tanpa approval.

---

## 6. Next

1. Tunggu keputusan apakah extractor masih dibutuhkan.
2. Jika ya, buat spec utility baru dengan dry-run default.
3. Setelah utility baru diverifikasi, putuskan apakah script lama dihapus atau tetap diarchive.
4. Jangan jalankan `extract-data3.mjs` dalam kondisi apa pun tanpa approval eksplisit dan rollback plan.
