# Patch Log — CI, Four Pillars, Sukuk/RAB Dry-run, Extractor, Locking

**Tanggal:** 2026-07-15  
**Operator:** HemuHemu / Hermes Agent  
**Scope:** follow-up approved hygiene roadmap  
**Status:** non-destruktif; tidak ada merge ke main wangi; tidak ada migrasi production; tidak ada cron dihentikan.

---

## Added

- PR `wangi-creations-hub` untuk CI package manager:
  - `https://github.com/beriman/wangi-creations-hub/pull/23`
- Spec SystemSWI Four Pillars Command Center:
  - `docs/plans/2026-07-15-systemswi-four-pillars-command-center.md`
- Utility dry-run Sukuk/RAB:
  - `scripts/preview-sukuk-rab-migration.py`
- Proposal utility resmi Finance/Sheets Extractor:
  - `docs/plans/2026-07-15-finance-sheets-extractor-utility-proposal.md`
- Proposal repository/task locking ringan:
  - `docs/plans/2026-07-15-agent-repository-locking-proposal.md`

---

## Changed

- PR #22 `ci: standardize npm lockfile` ditutup sebagai superseded.
- Keputusan package manager `wangi-creations-hub` direvisi dari npm ke Bun setelah Vercel log membuktikan deployment existing memakai Bun dan npm gagal dengan `Exit handler never called`.
- PR #23 menambahkan `packageManager: bun@1.3.14` dan mengubah GitHub Actions agar memakai `bun install --frozen-lockfile` + `bun run`.

---

## Fixed

- Masalah CI missing lockfile diselesaikan melalui pendekatan yang sesuai deployment existing:
  - mempertahankan `bun.lock` / `bun.lockb`;
  - mengubah CI dari npm ke Bun;
  - tidak menambahkan npm lockfile.

---

## Security

- Tidak ada dependency version yang diubah langsung.
- `bun audit --audit-level=high` PASS: no vulnerabilities found.
- Sukuk/RAB dry-run hanya membaca tabel bisnis `sukuk` dan `rab_items`.
- Script dry-run tidak membaca tabel legacy sensitif `users` dan `sessions`.
- Extractor legacy `extract-data3.mjs` tetap archive-only dan tidak dijalankan.
- Repository locking proposal mencegah stash/reset/overwrite perubahan asing.

---

## Verification

### wangi-creations-hub CI PR #23

Local:

```text
npx --yes bun install --frozen-lockfile: PASS
npx --yes bun audit --audit-level=high: PASS, no vulnerabilities found
npx --yes bun run typecheck: PASS
npx --yes bun run build: PASS
npx --yes bun run test:run: PASS, 53 tests
npx --yes bun run security:scan: PASS
npx --yes bun run security:rls-check: PASS
npx --yes bun run lint:security: PASS with 0 errors, existing warnings only
```

Remote PR checks:

```text
Vercel: PASS
GitHub Actions verify: PASS
Vercel Preview Comments: PASS
```

### Sukuk/RAB dry-run

Command:

```bash
python3 -m py_compile scripts/preview-sukuk-rab-migration.py
python3 scripts/preview-sukuk-rab-migration.py \
  --source /home/ubuntu/holding-swi/db/sukuk.db \
  --output-dir /tmp/systemswi-artifacts/sukuk-rab-preview
```

Result:

```text
total_source_records: 20
valid: 19
invalid: 1
duplicate: 0
skipped: 0
source_db_sha256: 504e2980412690e062ab5d03a61082aa3082df16e9240b6cb7b57c96130bfa60
```

Invalid item:

```text
RAB-SWQ-001-A.1 total mismatch: expected 24,000,000, actual 32,000,000
Reason: keterangan says 3 bulan + DP 1 bulan, requires review/exception approval.
```

Artifacts generated under:

```text
/tmp/systemswi-artifacts/sukuk-rab-preview/
```

---

## Impact

- `wangi-creations-hub` now has a passing PR to align CI with Bun lockfiles and Vercel behavior.
- SystemSWI has approved-planning artifacts for four-pillar command center, extractor replacement, and repository locking.
- Sukuk/RAB data can now be previewed safely without touching production or sensitive auth tables.

---

## Known Limitations

- PR #23 is open, not merged.
- No UI implementation for Four Pillars dashboard yet.
- Sukuk/RAB dry-run does not write to Google Sheets/SystemSWI source-of-truth.
- Extractor official utility is proposal-only; not implemented yet.
- Repository locking is proposal-only; cron prompts not updated yet.

---

## Next

1. Review/merge PR #23 if acceptable.
2. Approve Four Pillars data contract and source mappings.
3. Review Sukuk/RAB dry-run invalid record and decide exception handling.
4. Approve extractor utility proposal before implementation.
5. Approve repository locking proposal before applying to Hanks/ETIKA TARIF cron prompts.
