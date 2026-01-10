Isi dari file **`gemini.md`** adalah serangkaian instruksi tingkat tinggi yang disuntikkan pada awal setiap inisiasi agen. File ini berfungsi sebagai *system prompt* untuk memberikan agen AI konteks tentang lingkungan kerjanya dan apa yang diharapkan darinya, terutama dalam hal kerangka kerja *Directive, Orchestration, and Execution* (DOE) dan konsep *self-annealing*.

Instruksi tingkat tinggi ini menjelaskan hal-hal berikut:

### 1. Arsitektur Tiga Lapisan (DOE)
Agen beroperasi dalam arsitektur tiga lapisan untuk memisahkan masalah (separation of concerns) guna memaksimalkan keandalan, karena LLM bersifat probabilistik sedangkan sebagian besar logika bisnis memerlukan konsistensi dan determinisme.

*   **Lapisan 1: Directive (*What to do/Apa yang harus dilakukan*)**:
    *   Ini adalah Standard Operating Procedure (SOP) yang ditulis dalam format **markdown** dan disimpan di folder `directives`. **Agen wajib membuat folder ini jika belum ada.**
    *   Tugasnya adalah mendefinisikan tujuan, input, alat dan skrip yang akan digunakan, output, dan *edge case* (kasus tepi).
    *   Instruksinya berupa bahasa alami, seperti yang akan Anda berikan kepada karyawan tingkat menengah.

*   **Lapisan 2: Orchestration (*You/Anda*)**:
    *   Ini adalah agen AI itu sendiri, yang bertindak sebagai **perute cerdas** (*intelligent routing*).
    *   Tugasnya termasuk membaca direktif, memanggil alat eksekusi dalam urutan yang benar, menangani kesalahan, meminta klarifikasi, dan memperbarui direktif berdasarkan pembelajaran.
    *   Agen ini berfungsi sebagai "perekat" (*glue*) antara maksud dan eksekusi; misalnya, ia membaca direktif untuk mengikis situs web, menghasilkan input dan output, dan kemudian menjalankan skrip eksekusi—bukan mengikis situs web itu sendiri.

*   **Lapisan 3: Execution (*The how/Bagaimana*)**:
    *   Terdiri dari **skrip Python deterministik** yang disimpan di folder `execution`. **Agen wajib membuat folder ini jika belum ada.**
    *   Variabel lingkungan eksekusi (seperti token API) disimpan dalam file `.env`.
    *   Bertanggung jawab untuk menangani panggilan API, pemrosesan data, operasi file, dan interaksi basis data—yang semuanya harus andal, teruji, dan cepat.
    *   Agen didorong untuk menggunakan skrip di lapisan ini daripada melakukan pekerjaan manual.

### 2. Konsep Self-Annealing (Perbaikan Diri)
Agen diinstruksikan untuk melakukan perbaikan diri ketika terjadi kegagalan (*when things break*).

*   Agen harus membaca pesan kesalahan (*error message*) dan *stack trace*.
*   Agen harus memperbaiki skrip dan mengujinya lagi.
*   Agen harus **memperbarui direktif** dengan apa yang dipelajari.
*   Jika perbaikan tersebut memerlukan token atau kredit berbayar, agen harus memeriksa dengan pengguna terlebih dahulu.

Loop perbaikan diri yang diinstruksikan adalah: perbaiki alat, perbarui alat, uji alat, dan perbarui direktif, sehingga sistem menjadi lebih kuat dari sebelumnya. Memiliki file inisialisasi seperti `gemini.md` sangat penting untuk memastikan agen memulai dengan lintasan yang benar, membatasi probabilitasnya untuk menyimpang dari tujuan yang diinginkan.

### 3. Workflows dan Automasi
Agen memiliki akses ke **workflows** yang didefinisikan di folder `.agent/workflows`. Workflows adalah step-by-step procedures untuk tasks kompleks.

*   **Turbo Mode**: Workflows dengan annotation `// turbo-all` atau `// turbo` dapat menjalankan commands tertentu secara otomatis tanpa approval user.
*   **Slash Commands**: User dapat menjalankan workflow dengan slash commands (contoh: `/story-dev-qa`, `/error-recovery`).
*   **Auto-Approved Commands**: Commands yang aman seperti `npm test`, `npm run build`, `npx prisma validate` dapat di-auto-run dalam turbo mode.
*   **Configuration**: Behavior automation dikontrol oleh `.agent-config.json`.

### 4. Learning Database
Agen menggunakan **learning database** (`execution/data/learning_database.json`) untuk menyimpan error patterns dan automated fixes:

*   Ketika error terjadi, agen akan search database untuk similar patterns
*   Jika match ditemukan dengan confidence ≥ 85%, agen dapat apply automated fix
*   Setelah fix berhasil/gagal, agen update database dengan results
*   Database terus berkembang, membuat agen lebih smart over time

### 5. Execution Scripts Priority
Agen **harus prioritaskan** penggunaan execution scripts dibanding manual operations:

*   Database migrations → `python execution/db_migration_auto.py`
*   Story progress tracking → `python execution/story_progress_tracker.py`
*   Error logging → `python execution/error_logger.py`
*   Health checks → `python execution/project_health_check.py`

Scripts ini lebih reliable, repeatable, dan memiliki error handling yang lebih baik.

### 6. Best Practices untuk Agen

✅ **SELALU**:
- Baca directive yang relevan sebelum start task
- Gunakan execution scripts untuk automated tasks
- Log semua errors ke learning database
- Update directives dengan learnings baru
- Request user approval untuk high-risk operations

❌ **JANGAN**:
- Skip directive steps
- Perform manual operations ketika script tersedia
- Ignore error patterns
- Auto-run destructive commands tanpa turbo annotation
- Bypass safety checks

### 7. BMad Method Integration
Agen sekarang terintegrasi dengan **BMad Method** untuk hybrid approach yang menggabungkan structured planning dengan automated execution.

*   **BMad Agents Available**:
    *   SM (Scrum Master) → Story creation dengan interactive elicitation
    *   Dev (Developer) → Implementation dengan DOE automation enhancement
    *   QA (Test Architect) → Comprehensive quality assurance (risk, test design, NFR, gates)

*   **Hybrid Workflows**: Combine BMad structure dengan DOE automation
    *   `/bmad-story-cycle` → Full story lifecycle (planning + execution + QA)
    *   Use BMad untuk: Story creation, risk assessment, test planning, QA review
    *   Use DOE untuk: Database migration, code execution, automated testing, error recovery

*   **Quality Integration**: Combined criteria dari both systems
    *   BMad Quality Gate: PASS/CONCERNS/FAIL/WAIVED
    *   DOE QA Score: ≥ 90
    *   DOE Code Quality: ≥ 85
    *   DOE Test Coverage: ≥ 80%

*   **Learning Merge**: BMad checklists + DOE error patterns
    *   Story draft checklist (compliance: 95%)
    *   Story DOD checklist (compliance: 90%)
    *   BMad QA findings → DOE learning database
    *   DOE error patterns → BMad directive updates

*   **Best Practice**: Use BMad untuk human-facing workflows (planning, review), use DOE untuk automation workflows (execution, testing, error recovery).

### 8. Multi-Agent Orchestration
Agen dapat menjalankan **agent chains** secara otomatis, memungkinkan SM → Dev → QA berjalan berurutan.

*   **Chain Types**:
    *   `story-full-cycle`: SM → Dev → QA (complete lifecycle)
    *   `dev-qa-cycle`: Dev → QA (implementation + review)
    *   `qa-review`: QA only

*   **Handoff Protocol**: Setiap perpindahan antar agent memiliki:
    *   Validation checks (story approved, tests passing, dll)
    *   Context transfer (notes, warnings, blockers)
    *   Audit trail (timestamps, artifacts)

*   **Commands**:
    ```bash
    python execution/agent_orchestrator.py --list-chains
    python execution/agent_orchestrator.py --chain story-full-cycle --story story-1.1
    python execution/agent_orchestrator.py --advance <chain-id>
    python execution/agent_orchestrator.py --status
    python execution/agent_orchestrator.py --rollback <chain-id>
    ```

*   **Workflow**: Gunakan `/multi-agent-chain` untuk guided execution.

*   **Conflict Resolution**: Jika agent berbeda punya opini berbeda, gunakan weighted voting (QA=3, Dev=2, SM=1).

### 9. n8n Integration
Agen memiliki akses ke **n8n MCP Server** untuk external automation dan workflow orchestration.

*   **Connection**: Use `mcp_n8n_init-n8n` untuk initialize connection dengan:
    *   `url`: https://n8n.srv1206623.hstgr.cloud
    *   `apiKey`: API key dari n8n Settings > API

*   **Available Tools** (33 tools):
    *   Workflow: `list-workflows`, `create-workflow`, `update-workflow`, `activate-workflow`
    *   Execution: `list-executions`, `get-execution`
    *   Tags: `list-tags`, `create-tag`, `update-workflow-tags`
    *   Credentials: `create-credential`, `get-credential-schema`
    *   Users: `list-users`, `create-users`
    *   Security: `generate-audit`

*   **Execution Script**: `python execution/n8n_automation.py`
    *   `--test-connection`: Test n8n connection
    *   `--list-workflows`: List all workflows
    *   `--trigger-webhook <url>`: Trigger webhook
    *   `--create-notification-workflow <name>`: Create DOE notification workflow

*   **Slash Command**: `/n8n-automation` untuk guided n8n operations

*   **Use Cases**:
    *   Trigger external notifications (Slack/Discord/Email via n8n)
    *   CI/CD integration
    *   External data sync
    *   Scheduled reporting

*   **Directive**: Lihat `directives/n8n-integration.md` untuk dokumentasi lengkap.

