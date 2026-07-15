# Proposal Utility Resmi — Finance/Sheets Extractor SystemSWI

**Tanggal:** 2026-07-15  
**Status:** Proposal; belum implementasi  
**Legacy reference:** `holding-swi/extract-data.mjs`, `extract-data2.mjs`, `extract-sheets.mjs` hanya referensi; `extract-data3.mjs` archive-only dan tidak boleh dijalankan.

---

## 1. Keputusan Legacy

| Script legacy | Status | Keputusan |
|---|---|---|
| `extract-data.mjs` | scratch, token query param | referensi range saja |
| `extract-data2.mjs` | scratch, OAuth client hardcoded | referensi pola client saja |
| `extract-data3.mjs` | refresh + write token lokal | **archive only**, jangan dijalankan, jangan jadi basis |
| `extract-sheets.mjs` | helper-based scratch | referensi daftar sheet saja |

Tidak ada script legacy mentah yang boleh dicommit ke SystemSWI.

---

## 2. Tujuan Utility Baru

Membuat extractor resmi untuk preview data finance/holding dari Google Sheets ke artifact read-only, agar migrasi/audit bisa dilakukan tanpa menulis token, tanpa mengubah data, dan tanpa mencetak credential.

Nama usulan:

```text
scripts/preview-finance-sheets-export.mjs
```

---

## 3. Requirements

Utility resmi wajib:

1. Menggunakan environment variable atau secret store:
   - `SWI_FINANCE_SPREADSHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_JSON` atau `GOOGLE_APPLICATION_CREDENTIALS`
   - alternatif OAuth env yang disetujui: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
2. Tidak mencetak token, refresh token, private key, client secret, atau credential path penuh.
3. Tidak menulis token ke disk/repository.
4. Dry-run/read-only secara default.
5. Write membutuhkan flag eksplisit `--apply` dan tetap butuh approval manusia.
6. Structured logging:
   - timestamp;
   - sheet/range;
   - row count;
   - validation status;
   - error class;
   - no raw secrets.
7. Validation dan error handling:
   - missing env;
   - auth failure;
   - permission denied;
   - sheet not found;
   - range invalid;
   - empty required sheet;
   - quota/rate limit;
   - timeout.
8. Audit trail output:
   - artifact JSON summary;
   - source spreadsheet hash/redacted ID hash;
   - config hash;
   - generated_at;
   - mode.

---

## 4. Proposed Config

```json
{
  "spreadsheet_id_env": "SWI_FINANCE_SPREADSHEET_ID",
  "mode": "dry-run",
  "sheets": [
    { "key": "dashboard", "range": "Dashboard!A1:F20", "required": false },
    { "key": "holding", "range": "Holding!A1:G100", "required": false },
    { "key": "coa", "range": "COA!A1:E200", "required": true },
    { "key": "cash_harian", "range": "Cash_Harian!A1:I1000", "required": true },
    { "key": "rekening_koran", "range": "Rekening_Koran!A1:E1000", "required": true },
    { "key": "sukuk_store", "range": "SukukStore!A1:O100", "required": false }
  ]
}
```

Config boleh ada di:

```text
config/finance-sheets-export.json
```

Tetapi jangan memuat credential/secrets.

---

## 5. Proposed CLI

```bash
node scripts/preview-finance-sheets-export.mjs \
  --config config/finance-sheets-export.json \
  --output-dir /tmp/systemswi-artifacts/finance-sheets-preview \
  --dry-run \
  --redact-sensitive
```

Write mode future:

```bash
node scripts/preview-finance-sheets-export.mjs \
  --config config/finance-sheets-export.json \
  --apply \
  --approved-by Beriman \
  --audit-reason "approved migration batch"
```

`--apply` tidak boleh menjadi default.

---

## 6. Output Shape

```json
{
  "generated_at": "2026-07-15T10:00:00+08:00",
  "mode": "dry-run",
  "spreadsheet_id_hash": "sha256:...",
  "config_hash": "sha256:...",
  "sheets": [
    {
      "key": "cash_harian",
      "range": "Cash_Harian!A1:I1000",
      "row_count": 120,
      "column_count": 9,
      "status": "ok",
      "validation_errors": []
    }
  ],
  "summary": {
    "total_sheets": 6,
    "ok": 6,
    "empty": 0,
    "blocked": 0,
    "failed": 0
  },
  "errors": []
}
```

---

## 7. Audit Trail

Setiap run menghasilkan audit event:

```json
{
  "event_type": "finance_sheets_export_preview",
  "actor": "HemuHemu",
  "mode": "dry-run",
  "spreadsheet_id_hash": "sha256:...",
  "output_dir": "/tmp/systemswi-artifacts/finance-sheets-preview",
  "status": "success",
  "generated_at": "..."
}
```

Jika nanti ada write/apply, audit wajib mencatat:

- approved_by;
- approval timestamp;
- target sheet/table;
- rows affected;
- rollback reference.

---

## 8. Security Guardrails

- Jangan print `process.env`.
- Jangan log raw Google API response jika error bisa berisi request metadata sensitif.
- Jangan menulis raw finance data ke repo tanpa approval.
- Jangan simpan credential di config file.
- Jangan refresh/write token dari script; biarkan Google auth library/secret store menangani credential.
- Jangan menggunakan `extract-data3.mjs` sebagai basis.

---

## 9. Acceptance Criteria

- [ ] Default dry-run.
- [ ] Credential via env/secret store only.
- [ ] No token printed.
- [ ] No token written.
- [ ] Structured logs.
- [ ] Validation errors explicit.
- [ ] Output JSON/CSV artifact ke `/tmp` by default.
- [ ] `--apply` requires explicit flag and approval metadata.
- [ ] Legacy scripts remain untouched until replacement approved.

---

## 10. Next

1. Approve proposal.
2. Buat config allowlist sheet/range.
3. Implement utility resmi.
4. Dry-run dengan redacted output.
5. Review output sebelum write/apply apa pun.
