#!/usr/bin/env python3
"""Dry-run preview for migrating Sukuk/RAB legacy data into SystemSWI.

Default behavior is read-only. This script reads only the approved business
source tables (`sukuk`, `rab_items`) and intentionally never queries legacy
`users` or `sessions` tables.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import json
import os
import sqlite3
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

APPROVED_TABLES = {"sukuk", "rab_items"}
SENSITIVE_TABLES_EXCLUDED = ["users", "sessions"]
VALID_PILLARS = {"Media", "Komunitas", "Event", "Retail", "Corporate", "Unknown"}


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).astimezone().isoformat(timespec="seconds")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def connect_readonly(path: Path) -> sqlite3.Connection:
    uri = f"file:{path.resolve()}?mode=ro"
    con = sqlite3.connect(uri, uri=True)
    con.row_factory = sqlite3.Row
    return con


def read_table(con: sqlite3.Connection, table: str) -> List[sqlite3.Row]:
    if table not in APPROVED_TABLES:
        raise ValueError(f"Refusing to read non-approved table: {table}")
    return list(con.execute(f"SELECT rowid AS source_rowid, * FROM {table}"))


def normalize_text(value: Any) -> str:
    return str(value or "").strip()


def normalize_status(value: Any) -> str:
    status = normalize_text(value).lower() or "draft"
    allowed = {"draft", "open", "closed", "paused", "cancelled"}
    return status if status in allowed else "draft"


def map_pillar(pic: Any, kategori: Any, item: Any) -> str:
    text = " ".join([normalize_text(pic), normalize_text(kategori), normalize_text(item)]).lower()
    if any(token in text for token in ["store", "retail", "ruko", "display", "stock", "inventory"]):
        return "Retail"
    if any(token in text for token in ["event", "fragrantions", "booth", "tenant"]):
        return "Event"
    if any(token in text for token in ["media", "content", "photo", "video", "ads"]):
        return "Media"
    if any(token in text for token in ["komunitas", "community", "forum", "member"]):
        return "Komunitas"
    return "Unknown"


def row_ref(table: str, row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "source_table": table,
        "source_rowid": row["source_rowid"],
        "legacy_id": row["id"] if "id" in row.keys() else None,
    }


def transform_program(row: sqlite3.Row, source_hash: str, batch_id: str) -> Tuple[Dict[str, Any], List[str]]:
    kode = normalize_text(row["kode"])
    reasons: List[str] = []
    nilai = int(row["nilai_sukuk"] or 0)
    harga = int(row["harga_unit"] or 0)
    total_unit = int(row["total_unit"] or 0)
    unit_terjual = int(row["unit_terjual"] or 0)
    if not kode:
        reasons.append("missing_kode_program")
    if harga <= 0:
        reasons.append("invalid_harga_unit")
    if total_unit <= 0:
        reasons.append("invalid_total_unit")
    if unit_terjual < 0 or unit_terjual > total_unit:
        reasons.append("invalid_unit_terjual")
    if harga > 0 and total_unit > 0 and nilai != harga * total_unit:
        reasons.append("nilai_program_mismatch_harga_unit_x_total_unit")
    pct_fields = ["nisbah_investor_pct", "nisbah_swi_pct", "tim_fee_pct", "reserve_pct"]
    pct_total = sum(float(row[f] or 0) for f in pct_fields)
    if round(pct_total, 4) != 100:
        reasons.append(f"percentage_total_not_100:{pct_total}")
    record = {
        "program_id": f"SUKUK-{kode}" if kode else f"SUKUK-LEGACY-{row['id']}",
        "legacy_id": row["id"],
        "kode_program": kode,
        "nama_program": normalize_text(row["nama"]),
        "jenis_akad": normalize_text(row["jenis_akad"]).lower() or "other",
        "nilai_program": nilai,
        "harga_unit": harga,
        "total_unit": total_unit,
        "unit_terjual": unit_terjual,
        "target_unit": int(row["target_unit"] or 0),
        "nisbah_investor_pct": float(row["nisbah_investor_pct"] or 0),
        "nisbah_swi_pct": float(row["nisbah_swi_pct"] or 0),
        "tim_fee_pct": float(row["tim_fee_pct"] or 0),
        "reserve_pct": float(row["reserve_pct"] or 0),
        "tenor_bulan": int(row["tenor_bulan"] or 0),
        "start_date": row["start_date"],
        "end_date": row["end_date"],
        "status": normalize_status(row["status"]),
        "source_system": "holding-swi",
        "source_db_sha256": source_hash,
        "migration_batch_id": batch_id,
        "review_status": "preview",
        "source_record": row_ref("sukuk", row),
    }
    return record, reasons


def transform_rab(row: sqlite3.Row, program_id: str, program_code: str, batch_id: str) -> Tuple[Dict[str, Any], List[str]]:
    kode = normalize_text(row["kode"])
    qty = float(row["qty"] or 0)
    harga = int(row["harga_satuan"] or 0)
    total = int(row["total"] or 0)
    reasons: List[str] = []
    if not kode:
        reasons.append("missing_kode_item")
    if not normalize_text(row["item"]):
        reasons.append("missing_item_name")
    if qty <= 0:
        reasons.append("invalid_qty")
    if harga < 0:
        reasons.append("invalid_harga_satuan")
    if total < 0:
        reasons.append("invalid_total")
    expected = int(qty * harga)
    calculation_exception = False
    if qty > 0 and harga >= 0 and total != expected:
        calculation_exception = True
        reasons.append(f"total_mismatch:expected_{expected}_actual_{total}")
    pillar = map_pillar(row["pic"], row["kategori"], row["item"])
    if pillar not in VALID_PILLARS:
        pillar = "Unknown"
    record = {
        "rab_item_id": f"RAB-{program_code}-{kode}" if kode else f"RAB-{program_code}-LEGACY-{row['id']}",
        "program_id": program_id,
        "legacy_id": row["id"],
        "kode_item": kode,
        "kategori": normalize_text(row["kategori"]),
        "sub_kategori": normalize_text(row["sub_kategori"]),
        "item_name": normalize_text(row["item"]),
        "qty": qty,
        "satuan": normalize_text(row["satuan"]),
        "harga_satuan": harga,
        "total": total,
        "expected_total": expected,
        "calculation_exception": calculation_exception,
        "sumber_dana": normalize_text(row["sumber_dana"]).lower() or "other",
        "pic": normalize_text(row["pic"]),
        "pilar_systemswi": pillar,
        "keterangan": normalize_text(row["keterangan"]),
        "fase": normalize_text(row["fase"]),
        "procurement_status": "planned",
        "approval_status": "preview",
        "source_system": "holding-swi",
        "migration_batch_id": batch_id,
        "review_status": "preview",
        "source_record": row_ref("rab_items", row),
    }
    return record, reasons


def mark_duplicates(records: Iterable[Dict[str, Any]], key_fields: List[str]) -> Dict[str, int]:
    seen: Dict[str, int] = {}
    duplicates: Dict[str, int] = {}
    for idx, rec in enumerate(records):
        key = "|".join(str(rec.get(f, "")) for f in key_fields)
        if key in seen:
            duplicates[key] = duplicates.get(key, 1) + 1
            rec.setdefault("validation_reasons", []).append(f"duplicate_key:{key}")
        else:
            seen[key] = idx
    return duplicates


def write_csv(path: Path, rows: List[Dict[str, Any]]) -> None:
    if not rows:
        path.write_text("")
        return
    scalar_rows = []
    fieldnames = []
    for row in rows:
        flat: Dict[str, Any] = {}
        for k, v in row.items():
            flat[k] = json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else v
            if k not in fieldnames:
                fieldnames.append(k)
        scalar_rows.append(flat)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(scalar_rows)


def main() -> int:
    parser = argparse.ArgumentParser(description="Preview Sukuk/RAB migration from holding-swi SQLite into SystemSWI.")
    parser.add_argument("--source", default="/home/ubuntu/holding-swi/db/sukuk.db", help="Path to legacy SQLite DB")
    parser.add_argument("--output-dir", default="/tmp/systemswi-artifacts/sukuk-rab-preview", help="Output directory for JSON/CSV preview")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Dry-run mode; always read-only")
    args = parser.parse_args()

    source = Path(args.source)
    if not source.exists():
        raise SystemExit(f"Source DB not found: {source}")
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    source_hash = sha256_file(source)
    batch_id = "sukuk-rab-" + dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    con = connect_readonly(source)
    try:
        programs_src = read_table(con, "sukuk")
        rab_src = read_table(con, "rab_items")
    finally:
        con.close()

    programs: List[Dict[str, Any]] = []
    rab_items: List[Dict[str, Any]] = []
    invalid: List[Dict[str, Any]] = []

    program_code = "UNKNOWN"
    program_id = "SUKUK-UNKNOWN"
    for row in programs_src:
        rec, reasons = transform_program(row, source_hash, batch_id)
        rec["validation_reasons"] = reasons
        rec["validation_status"] = "invalid" if reasons else "valid"
        if reasons:
            invalid.append({"record_type": "program", "record": rec, "reasons": reasons})
        programs.append(rec)
        program_code = rec["kode_program"] or program_code
        program_id = rec["program_id"] or program_id

    for row in rab_src:
        rec, reasons = transform_rab(row, program_id, program_code, batch_id)
        rec["validation_reasons"] = reasons
        rec["validation_status"] = "invalid" if reasons else "valid"
        if reasons:
            invalid.append({"record_type": "rab_item", "record": rec, "reasons": reasons})
        rab_items.append(rec)

    dup_program = mark_duplicates(programs, ["source_system", "kode_program"])
    dup_rab = mark_duplicates(rab_items, ["source_system", "program_id", "kode_item"])
    duplicate_count = sum(count - 1 for count in list(dup_program.values()) + list(dup_rab.values()))

    # Recompute invalid after duplicate marking.
    invalid = []
    valid_count = 0
    for record_type, rows in [("program", programs), ("rab_item", rab_items)]:
        for rec in rows:
            reasons = rec.get("validation_reasons", [])
            rec["validation_status"] = "invalid" if reasons else "valid"
            if reasons:
                invalid.append({"record_type": record_type, "record": rec, "reasons": reasons})
            else:
                valid_count += 1

    total_source = len(programs_src) + len(rab_src)
    skipped_records: List[Dict[str, Any]] = []
    summary = {
        "generated_at": now_iso(),
        "mode": "dry-run-read-only",
        "source_db": str(source),
        "source_db_sha256": source_hash,
        "migration_batch_id": batch_id,
        "approved_source_tables_read": sorted(APPROVED_TABLES),
        "sensitive_tables_excluded_not_read": SENSITIVE_TABLES_EXCLUDED,
        "total_source_records": total_source,
        "valid": valid_count,
        "invalid": len(invalid),
        "duplicate": duplicate_count,
        "skipped": len(skipped_records),
        "skip_reasons": skipped_records,
        "outputs": {},
    }
    preview = {
        "summary": summary,
        "programs": programs,
        "rab_items": rab_items,
        "invalid_records": invalid,
        "duplicates": {"program_keys": dup_program, "rab_keys": dup_rab},
    }

    json_path = out_dir / f"{batch_id}.json"
    programs_csv = out_dir / f"{batch_id}-programs.csv"
    rab_csv = out_dir / f"{batch_id}-rab-items.csv"
    invalid_csv = out_dir / f"{batch_id}-invalid.csv"
    summary["outputs"] = {
        "json": str(json_path),
        "programs_csv": str(programs_csv),
        "rab_items_csv": str(rab_csv),
        "invalid_csv": str(invalid_csv),
    }
    json_path.write_text(json.dumps(preview, indent=2, ensure_ascii=False), encoding="utf-8")
    write_csv(programs_csv, programs)
    write_csv(rab_csv, rab_items)
    write_csv(invalid_csv, invalid)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
