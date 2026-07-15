# Proposal — Lightweight Repository/Task Locking untuk Cron dan Agent

**Tanggal:** 2026-07-15  
**Status:** Proposal; belum menghentikan cron aktif  
**Scope:** HemuHemu, Hanks, ETIKA TARIF, dan agent engineering lain yang bekerja di repo SWI.

---

## 1. Latar Belakang

Terjadi perubahan paralel pada file SystemSWI:

```text
src/app/api/governance/vendor-register/route.ts
src/lib/governance/vendor-register.ts
```

Agent harus menghindari overwrite/stash/reset perubahan asing. Dibutuhkan locking ringan untuk mendeteksi concurrent work sebelum task dimulai dan sebelum commit.

---

## 2. Prinsip

1. Lock tidak menggantikan Git; lock hanya guard operasional agent.
2. Lock bersifat file-scope, bukan repo-wide jika tidak perlu.
3. Lock punya expiry agar tidak menggantung permanen.
4. Agent hanya boleh commit file yang dibuat/diubah oleh task itu.
5. Jangan stash, reset, checkout, atau overwrite perubahan asing.
6. Jika konflik scope, status task: `BLOCKED_BY_CONCURRENT_WORK`.
7. Jangan menghentikan cron aktif tanpa approval.

---

## 3. Lokasi Lock

Usulan lokal per repo:

```text
.hermes/locks/
```

Contoh file:

```text
.hermes/locks/task-<task_id>.json
```

Jika `.hermes/` repo-local belum ada, gunakan:

```text
/tmp/hermes-repo-locks/<repo_hash>/task-<task_id>.json
```

Untuk tahap awal, `/tmp` cukup agar tidak mencemari repo. Untuk audit permanen, ringkasan bisa ditulis ke SystemSWI Agent_Audit_Log.

---

## 4. Lock Schema

```json
{
  "lock_id": "lock-20260715-001",
  "task_id": "etika-tarif-20260715-1000",
  "task_owner": "ETIKA TARIF",
  "cron_id": "d8a50f52cab6",
  "repo": "/home/ubuntu/systemswi",
  "branch": "main",
  "base_head": "<git sha>",
  "file_scope": [
    "src/lib/governance/vendor-register.ts",
    "src/app/api/governance/vendor-register/route.ts"
  ],
  "created_at": "2026-07-15T10:00:00+08:00",
  "expires_at": "2026-07-15T11:00:00+08:00",
  "status": "active",
  "notes": "Vendor register update task"
}
```

---

## 5. Task Start Protocol

Sebelum task dimulai:

1. `git status --porcelain=v1`.
2. Tentukan `file_scope` dari task/spec.
3. Jika ada modified/untracked file dalam scope yang bukan milik task:
   ```text
   STATUS: BLOCKED_BY_CONCURRENT_WORK
   ```
4. Jika ada modified file di luar scope:
   - boleh lanjut hanya jika tidak akan disentuh;
   - catat sebagai foreign dirty state.
5. Buat lock dengan expiry.
6. Simpan `base_head`.

Pseudo:

```bash
git status --porcelain=v1
# parse dirty paths
# compare with file_scope
# create lock JSON if safe
```

---

## 6. Pre-Commit Protocol

Sebelum commit:

1. Baca lock task.
2. `git diff --name-only` dan `git diff --cached --name-only`.
3. Pastikan semua changed/staged files subset dari `file_scope` + file baru yang tercatat task.
4. Jika ada file asing:
   - jangan commit;
   - status `BLOCKED_BY_FOREIGN_CHANGES`;
   - laporkan file asing.
5. Pastikan lock belum expired.
6. Commit hanya file scope task:
   ```bash
   git add <explicit file list>
   git commit -m "..."
   ```

---

## 7. Lock Expiry

Default expiry:

| Task Type | Expiry |
|---|---:|
| read-only audit | 15 menit |
| documentation | 30 menit |
| small safe fix | 60 menit |
| medium branch task | 120 menit |
| long-running audit | custom, max 6 jam |

Jika lock expired:

- task harus re-check git status;
- jangan auto-extend tanpa mencatat reason;
- stale lock bisa diabaikan hanya jika process/task owner sudah selesai dan file scope bersih.

---

## 8. Status Codes

| Status | Meaning |
|---|---|
| `LOCK_ACQUIRED` | Scope aman, task boleh jalan |
| `NO_ACTION` | Tidak ada pekerjaan aman/bernilai |
| `BLOCKED_BY_CONCURRENT_WORK` | File scope sudah modified oleh proses lain |
| `BLOCKED_BY_FOREIGN_CHANGES` | Pre-commit menemukan file asing |
| `LOCK_EXPIRED` | Lock melewati expiry |
| `COMMITTED` | Task commit sukses |
| `ABORTED_SAFE` | Task berhenti tanpa mengubah file asing |

---

## 9. Minimal CLI Proposal

Script future:

```text
scripts/agent-repo-lock.py
```

Commands:

```bash
python3 scripts/agent-repo-lock.py acquire \
  --task-id etika-tarif-20260715-1000 \
  --owner "ETIKA TARIF" \
  --cron-id d8a50f52cab6 \
  --repo /home/ubuntu/systemswi \
  --scope src/lib/governance/vendor-register.ts \
  --scope src/app/api/governance/vendor-register/route.ts \
  --ttl-minutes 60

python3 scripts/agent-repo-lock.py precommit \
  --task-id etika-tarif-20260715-1000 \
  --repo /home/ubuntu/systemswi

python3 scripts/agent-repo-lock.py release \
  --task-id etika-tarif-20260715-1000 \
  --status COMMITTED
```

---

## 10. Cron Prompt Rule

Setiap cron engineering harus memulai dengan:

```text
1. Check git status.
2. Define file scope.
3. If scope dirty, report BLOCKED_BY_CONCURRENT_WORK.
4. Do not stash/reset/overwrite.
5. Commit only explicit task files.
```

---

## 11. Integration dengan Patch Log

Patch log wajib mencatat:

- task owner;
- cron ID;
- repo;
- branch;
- file scope;
- lock acquired/released;
- foreign dirty files;
- commit SHA jika ada;
- blocked reason jika tidak jalan.

---

## 12. Acceptance Criteria

- [ ] Agent cek git status sebelum task.
- [ ] Agent mendefinisikan file scope.
- [ ] Modified file dalam scope memblokir task jika bukan milik task.
- [ ] Agent commit explicit file list saja.
- [ ] No stash/reset/overwrite foreign changes.
- [ ] Lock punya expiry.
- [ ] Lock mencatat owner, cron ID, timestamp, repo, branch, file scope.
- [ ] Status `BLOCKED_BY_CONCURRENT_WORK` dilaporkan jelas.

---

## 13. Open Decisions

1. Lock disimpan di repo `.hermes/locks` atau `/tmp/hermes-repo-locks`?
2. Apakah lock perlu dipersist ke Google Sheets/SystemSWI audit log?
3. Apakah setiap cron perlu auto-update prompt dengan rule ini?
4. Apakah branch-based tasks wajib lock juga, atau hanya main-working-tree tasks?
5. Siapa boleh clear stale lock?

---

## 14. Next

1. Approve proposal.
2. Implement script `scripts/agent-repo-lock.py` sebagai utility kecil.
3. Update prompt Hanks/ETIKA TARIF untuk memakai start/precommit protocol.
4. Uji pada task dokumentasi low-risk.
5. Baru setelah stabil, wajibkan untuk cron engineering.
