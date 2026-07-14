# Migration Plan — Sukuk/RAB dari `holding-swi` ke SystemSWI

**Tanggal:** 2026-07-15  
**Sumber:** `/home/ubuntu/holding-swi/db/sukuk.db`  
**Target:** SystemSWI module `/sukuk` dan finance/procurement/event-retail planning terkait  
**Status:** planning + dry-run only; belum menulis ke source-of-truth production.

---

## 1. Tujuan

Mempertahankan data bisnis Sukuk/RAB dari repo legacy `holding-swi` dan merancang migrasi aman ke SystemSWI tanpa membawa data sensitif/credential/auth lama.

Data yang boleh dipertahankan:

- data program Sukuk;
- kode program;
- status;
- item dan nilai RAB;
- kategori/sub-kategori;
- metadata bisnis yang masih relevan.

Data yang dilarang dipindahkan:

- password hash;
- session token;
- data autentikasi lokal;
- secrets/credential;
- data teknis lama yang tidak diperlukan.

---

## 2. Sumber Data

SQLite source:

```text
/home/ubuntu/holding-swi/db/sukuk.db
```

Tables/views terdeteksi:

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

---

## 3. Klasifikasi Data

| Source table | Rows | Klasifikasi | Dipindahkan? | Alasan |
|---|---:|---|---|---|
| `sukuk` | 1 | Data bisnis program | Ya | Program Sukuk dan skema nisbah perlu dipertahankan. |
| `rab_items` | 19 | Data bisnis RAB | Ya | RAB program/store TIM masih relevan untuk planning dan audit. |
| `profit_distributions` | 0 | Data bisnis, kosong | Belum | Tidak ada data. Schema bisa jadi referensi future. |
| `investor_payouts` | 0 | Data bisnis, kosong | Belum | Tidak ada data. |
| `investors` | 0 | PII/investor data, kosong | Belum | Jika nanti ada data, perlu approval dan privacy review. |
| `sukuk_investments` | 0 | Data investasi, kosong | Belum | Tidak ada data. |
| `audit_log` | 0 | Audit teknis legacy, kosong | Tidak | SystemSWI harus membuat audit trail baru. |
| `notifications` | 0 | Teknis/operasional, kosong | Tidak | Tidak relevan. |
| `users` | 1 | Sensitif/auth | Tidak boleh | Berisi username, password hash, role. |
| `sessions` | 2 | Sensitif/auth | Tidak boleh | Berisi session tokens. |
| Views | n/a | Derived | Tidak langsung | Bisa dihitung ulang di target. |

---

## 4. Source Tables dan Kolom

### 4.1 `sukuk`

Source columns:

| Column | Type | Keterangan |
|---|---|---|
| `id` | INTEGER | primary ID legacy |
| `kode` | TEXT | kode program, contoh `SWQ-001` |
| `nama` | TEXT | nama program |
| `jenis_akad` | TEXT | jenis akad, contoh `musyarakah` |
| `nilai_sukuk` | INTEGER | total nilai program |
| `harga_unit` | INTEGER | harga per unit |
| `total_unit` | INTEGER | total unit |
| `unit_terjual` | INTEGER | unit sold |
| `target_unit` | INTEGER | target unit |
| `nisbah_investor_pct` | REAL | persentase investor |
| `nisbah_swi_pct` | REAL | persentase SWI |
| `tim_fee_pct` | REAL | fee TIM |
| `reserve_pct` | REAL | reserve fund |
| `tenor_bulan` | INTEGER | tenor bulan |
| `start_date` | TEXT | tanggal mulai |
| `end_date` | TEXT | tanggal selesai |
| `status` | TEXT | status program |
| `created_at` | TEXT | timestamp legacy |
| `updated_at` | TEXT | timestamp legacy |

Sample source record:

```json
{
  "id": 1,
  "kode": "SWQ-001",
  "nama": "Sukuk Musyarakah SWI Store TIM",
  "jenis_akad": "musyarakah",
  "nilai_sukuk": 1000000000,
  "harga_unit": 1000000,
  "total_unit": 1000,
  "unit_terjual": 0,
  "target_unit": 1000,
  "nisbah_investor_pct": 42.5,
  "nisbah_swi_pct": 42.5,
  "tim_fee_pct": 10.0,
  "reserve_pct": 5.0,
  "tenor_bulan": 36,
  "start_date": null,
  "end_date": null,
  "status": "open"
}
```

### 4.2 `rab_items`

Source columns:

| Column | Type | Keterangan |
|---|---|---|
| `id` | INTEGER | primary ID legacy |
| `kode` | TEXT | kode RAB item, contoh `A.1` |
| `kategori` | TEXT | kategori biaya |
| `sub_kategori` | TEXT | subkategori |
| `item` | TEXT | nama item |
| `qty` | INTEGER | jumlah |
| `satuan` | TEXT | unit/satuan |
| `harga_satuan` | INTEGER | harga per unit |
| `total` | INTEGER | total biaya |
| `sumber_dana` | TEXT | sumber dana, contoh `investor` |
| `pic` | TEXT | PIC/divisi |
| `keterangan` | TEXT | catatan |
| `fase` | TEXT | fase program |
| `created_at` | TEXT | timestamp legacy |

Sample source record:

```json
{
  "id": 1,
  "kode": "A.1",
  "kategori": "LOKASI",
  "sub_kategori": "Sewa",
  "item": "Sewa ruko kecil TIM (3 bulan + DP 1 bulan)",
  "qty": 3,
  "satuan": "bulan",
  "harga_satuan": 8000000,
  "total": 32000000,
  "sumber_dana": "investor",
  "pic": "Store",
  "keterangan": "Rp 8jt/bln × 4 bulan",
  "fase": "phase1"
}
```

---

## 5. Target Module di SystemSWI

Target utama:

```text
/app/(workspace)/sukuk
```

Target pendukung:

- `/finance` untuk ringkasan nilai program dan alokasi dana;
- `/procurement` untuk item RAB yang akan menjadi purchase/procurement plan;
- `/governance` untuk audit trail import dan review approval;
- `/documents` untuk menyimpan migration evidence/export file;
- `/reports` untuk laporan preview migrasi.

---

## 6. Proposed Data Contract

### 6.1 Target: `Sukuk_Programs`

Google Sheets atau DB table target sementara:

| Field | Type | Required | Source | Validation |
|---|---|---:|---|---|
| `program_id` | string | yes | generated `SUKUK-SWQ-001` | unique |
| `legacy_id` | string/int | yes | `sukuk.id` | unique with source |
| `kode_program` | string | yes | `sukuk.kode` | non-empty, unique |
| `nama_program` | string | yes | `sukuk.nama` | non-empty |
| `jenis_akad` | enum/string | yes | `sukuk.jenis_akad` | allowed: `musyarakah`, `mudharabah`, `ijarah`, `other` |
| `nilai_program` | integer | yes | `sukuk.nilai_sukuk` | >= 0 |
| `harga_unit` | integer | yes | `sukuk.harga_unit` | > 0 |
| `total_unit` | integer | yes | `sukuk.total_unit` | > 0 |
| `unit_terjual` | integer | yes | `sukuk.unit_terjual` | 0 <= sold <= total |
| `target_unit` | integer | optional | `sukuk.target_unit` | <= total_unit unless approved |
| `nisbah_investor_pct` | number | yes | `sukuk.nisbah_investor_pct` | 0-100 |
| `nisbah_swi_pct` | number | yes | `sukuk.nisbah_swi_pct` | 0-100 |
| `tim_fee_pct` | number | optional | `sukuk.tim_fee_pct` | 0-100 |
| `reserve_pct` | number | optional | `sukuk.reserve_pct` | 0-100 |
| `tenor_bulan` | integer | optional | `sukuk.tenor_bulan` | >= 0 |
| `start_date` | date/null | optional | `sukuk.start_date` | valid date or blank |
| `end_date` | date/null | optional | `sukuk.end_date` | >= start_date if both set |
| `status` | enum | yes | `sukuk.status` | `draft`, `open`, `closed`, `paused`, `cancelled` |
| `source_system` | string | yes | constant | `holding-swi` |
| `source_db_hash` | string | yes | dry-run metadata | SHA256 of source DB/export |
| `migrated_at` | datetime | yes | generated | ISO datetime |
| `migration_batch_id` | string | yes | generated | unique batch |
| `review_status` | enum | yes | generated | `preview`, `approved`, `imported`, `rejected` |

### 6.2 Target: `Sukuk_RAB_Items`

| Field | Type | Required | Source | Validation |
|---|---|---:|---|---|
| `rab_item_id` | string | yes | generated `RAB-SWQ-001-A.1` | unique |
| `program_id` | string | yes | join to `Sukuk_Programs` | must exist |
| `legacy_id` | string/int | yes | `rab_items.id` | unique with source |
| `kode_item` | string | yes | `rab_items.kode` | non-empty |
| `kategori` | string | yes | `rab_items.kategori` | normalized uppercase/titlecase |
| `sub_kategori` | string | optional | `rab_items.sub_kategori` | text |
| `item_name` | string | yes | `rab_items.item` | non-empty |
| `qty` | number | yes | `rab_items.qty` | > 0 |
| `satuan` | string | optional | `rab_items.satuan` | text |
| `harga_satuan` | integer | yes | `rab_items.harga_satuan` | >= 0 |
| `total` | integer | yes | `rab_items.total` | must equal qty * harga_satuan, or marked exception |
| `sumber_dana` | enum/string | yes | `rab_items.sumber_dana` | investor/internal/loan/other |
| `pic` | string | optional | `rab_items.pic` | map to division/pillar if possible |
| `pilar_systemswi` | enum | optional | derived | Media/Komunitas/Event/Retail/Corporate/Unknown |
| `keterangan` | text | optional | `rab_items.keterangan` | no secrets |
| `fase` | string | optional | `rab_items.fase` | text |
| `procurement_status` | enum | yes | generated | `planned`, `quoted`, `approved`, `purchased`, `cancelled` |
| `approval_status` | enum | yes | generated | `preview`, `needs_approval`, `approved`, `rejected` |
| `source_system` | string | yes | constant | `holding-swi` |
| `migration_batch_id` | string | yes | generated | unique batch |
| `review_status` | enum | yes | generated | preview/imported/rejected |

---

## 7. Mapping Sumber ke Target

### 7.1 `sukuk` -> `Sukuk_Programs`

| Source | Target | Transform |
|---|---|---|
| `id` | `legacy_id` | preserve numeric ID |
| `kode` | `kode_program` | trim string |
| `nama` | `nama_program` | trim string |
| `jenis_akad` | `jenis_akad` | lowercase enum; fallback `other` |
| `nilai_sukuk` | `nilai_program` | integer rupiah |
| `harga_unit` | `harga_unit` | integer rupiah |
| `total_unit` | `total_unit` | integer |
| `unit_terjual` | `unit_terjual` | integer |
| `target_unit` | `target_unit` | integer |
| `nisbah_investor_pct` | `nisbah_investor_pct` | decimal percent |
| `nisbah_swi_pct` | `nisbah_swi_pct` | decimal percent |
| `tim_fee_pct` | `tim_fee_pct` | decimal percent |
| `reserve_pct` | `reserve_pct` | decimal percent |
| `tenor_bulan` | `tenor_bulan` | integer |
| `start_date` | `start_date` | parse date/null |
| `end_date` | `end_date` | parse date/null |
| `status` | `status` | lowercase enum |
| generated | `program_id` | `SUKUK-${kode}` |

### 7.2 `rab_items` -> `Sukuk_RAB_Items`

| Source | Target | Transform |
|---|---|---|
| `id` | `legacy_id` | preserve numeric ID |
| `kode` | `kode_item` | trim |
| `kategori` | `kategori` | normalize casing |
| `sub_kategori` | `sub_kategori` | trim |
| `item` | `item_name` | trim |
| `qty` | `qty` | numeric |
| `satuan` | `satuan` | trim |
| `harga_satuan` | `harga_satuan` | integer rupiah |
| `total` | `total` | integer rupiah |
| `sumber_dana` | `sumber_dana` | normalize enum |
| `pic` | `pic` | trim |
| `pic` | `pilar_systemswi` | mapping rule; `Store` -> `Retail` initially |
| `keterangan` | `keterangan` | sanitize text |
| `fase` | `fase` | trim |
| generated | `rab_item_id` | `RAB-${program_code}-${kode}` |

---

## 8. Contoh Transformed Records

### 8.1 Program

```json
{
  "program_id": "SUKUK-SWQ-001",
  "legacy_id": 1,
  "kode_program": "SWQ-001",
  "nama_program": "Sukuk Musyarakah SWI Store TIM",
  "jenis_akad": "musyarakah",
  "nilai_program": 1000000000,
  "harga_unit": 1000000,
  "total_unit": 1000,
  "unit_terjual": 0,
  "target_unit": 1000,
  "nisbah_investor_pct": 42.5,
  "nisbah_swi_pct": 42.5,
  "tim_fee_pct": 10.0,
  "reserve_pct": 5.0,
  "tenor_bulan": 36,
  "start_date": null,
  "end_date": null,
  "status": "open",
  "source_system": "holding-swi",
  "review_status": "preview"
}
```

### 8.2 RAB Item

```json
{
  "rab_item_id": "RAB-SWQ-001-A.1",
  "program_id": "SUKUK-SWQ-001",
  "legacy_id": 1,
  "kode_item": "A.1",
  "kategori": "LOKASI",
  "sub_kategori": "Sewa",
  "item_name": "Sewa ruko kecil TIM (3 bulan + DP 1 bulan)",
  "qty": 3,
  "satuan": "bulan",
  "harga_satuan": 8000000,
  "total": 32000000,
  "sumber_dana": "investor",
  "pic": "Store",
  "pilar_systemswi": "Retail",
  "keterangan": "Rp 8jt/bln × 4 bulan",
  "fase": "phase1",
  "procurement_status": "planned",
  "approval_status": "preview",
  "source_system": "holding-swi"
}
```

Catatan validasi: contoh item memiliki `qty=3`, `harga_satuan=8.000.000`, tetapi `total=32.000.000`. Secara matematis `3 * 8.000.000 = 24.000.000`; keterangan menyebut `3 bulan + DP 1 bulan`, sehingga total 4 bulan. Ini harus masuk exception/adjustment, bukan dianggap error otomatis.

---

## 9. Validation Rules

### Program

1. `kode_program` wajib unik.
2. `nilai_program = harga_unit * total_unit`, kecuali ada approved exception.
3. `unit_terjual <= total_unit`.
4. Persentase `nisbah_investor_pct + nisbah_swi_pct + tim_fee_pct + reserve_pct` sebaiknya = 100 jika semua komponen dipakai.
5. `status` harus salah satu dari allowed enum.
6. Tanggal mulai/akhir valid bila terisi.

### RAB

1. `rab_item_id` wajib unik.
2. `program_id` wajib ada di target program.
3. `qty > 0`.
4. `harga_satuan >= 0`.
5. `total >= 0`.
6. Jika `total != qty * harga_satuan`, tandai `calculation_exception=true` dan simpan alasan dari `keterangan`.
7. `sumber_dana` dinormalisasi; nilai tidak dikenal menjadi `other` dan masuk review queue.
8. `pic` dipetakan ke pilar SystemSWI bila yakin; jika tidak, `Unknown` + review.

---

## 10. Duplicate Handling

Key uniqueness:

- Program: `(source_system, kode_program)`.
- RAB item: `(source_system, kode_program, kode_item)`.

Jika duplicate ditemukan:

1. Jika semua field sama -> skip sebagai duplicate identik.
2. Jika nilai berbeda -> mark `conflict` dan jangan import otomatis.
3. Conflict report harus mencatat:
   - source row,
   - target existing row,
   - field yang berbeda,
   - rekomendasi manual.

---

## 11. Audit Trail

Setiap dry-run/import wajib membuat audit event:

```json
{
  "event_type": "sukuk_rab_migration_preview",
  "source_system": "holding-swi",
  "source_db_path": "/home/ubuntu/holding-swi/db/sukuk.db",
  "source_db_sha256": "<computed>",
  "migration_batch_id": "sukuk-rab-YYYYMMDD-HHMMSS",
  "program_count": 1,
  "rab_item_count": 19,
  "sensitive_rows_excluded": {
    "users": 1,
    "sessions": 2
  },
  "status": "preview_only"
}
```

Audit target:

- SystemSWI `Governance_Audit_Log` atau equivalent audit module.
- Report file under `docs/reports/` for dry-run evidence.

---

## 12. Rollback Plan

Karena tahap ini hanya preview, rollback saat ini cukup:

1. Jangan tulis ke source-of-truth.
2. Hapus file preview generated jika salah.
3. Tidak ada mutation ke Google Sheets/DB.

Jika nanti import disetujui:

1. Gunakan `migration_batch_id` untuk semua rows.
2. Simpan export before/after.
3. Untuk rollback, delete/mark rows by `migration_batch_id` hanya setelah approval.
4. Jangan rollback manual tanpa audit event.
5. Jika Google Sheets digunakan, buat tab backup sebelum import.

---

## 13. Preview Query / Dry-run Procedure

### 13.1 Read-only SQLite preview

```bash
python3 - <<'PY'
import sqlite3, json, hashlib, pathlib
p = pathlib.Path('/home/ubuntu/holding-swi/db/sukuk.db')
sha = hashlib.sha256(p.read_bytes()).hexdigest()
con = sqlite3.connect(p)
con.row_factory = sqlite3.Row
programs = [dict(r) for r in con.execute('SELECT * FROM sukuk')]
rab = [dict(r) for r in con.execute('SELECT * FROM rab_items ORDER BY kode')]
print(json.dumps({
  'source_db_sha256': sha,
  'program_count': len(programs),
  'rab_item_count': len(rab),
  'programs': programs,
  'rab_sample': rab[:5],
}, indent=2, ensure_ascii=False))
con.close()
PY
```

### 13.2 Transform preview only

```bash
python3 scripts/preview-sukuk-rab-migration.py \
  --source /home/ubuntu/holding-swi/db/sukuk.db \
  --output /tmp/sukuk-rab-preview.json \
  --dry-run
```

Script tersebut belum dibuat pada tahap ini. Jika dibuat nanti, wajib:

- read-only terhadap SQLite source;
- tidak membaca `users`/`sessions` kecuali row count untuk exclusion audit;
- tidak menulis ke Google Sheets/production tanpa flag eksplisit `--apply`;
- default mode harus `--dry-run`;
- tidak mencetak secrets/token;
- menulis preview JSON ke `/tmp` atau `docs/reports/` sesuai approval.

---

## 14. Approval Gate

Sebelum import nyata, perlu approval Beriman/Enterprise Architect untuk:

1. Target final: Google Sheets atau DB SystemSWI.
2. Schema final dan nama sheet/table.
3. Mapping pilar `Store` -> `Retail`.
4. Treatment exception `qty * harga_satuan != total`.
5. Apakah investor data kosong tetap disiapkan schema-nya.
6. Apakah program `SWQ-001` masih aktif/open atau perlu status update.

---

## 15. Next

1. Buat script dry-run preview resmi setelah plan disetujui.
2. Generate preview JSON + checksum.
3. Review hasil preview dengan Beriman.
4. Baru setelah approval, import ke source-of-truth SystemSWI.
