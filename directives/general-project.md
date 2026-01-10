# General Project Directive

## Tujuan
Memberikan panduan umum untuk bekerja dalam proyek ini menggunakan DOE framework.

## Arsitektur DOE

```
┌─────────────────────────────────────────────────────────────┐
│                    DIRECTIVE (What)                         │
│   SOP dalam markdown di folder directives/                 │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  ORCHESTRATION (Routing)                    │
│   AI Agent sebagai perekat antara directive dan execution  │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXECUTION (How)                          │
│   Python scripts di folder execution/                       │
└─────────────────────────────────────────────────────────────┘
```

## Prinsip Kerja

### 1. Baca Directive Dulu
Sebelum memulai task, selalu baca directive yang relevan untuk memahami:
- Tujuan yang ingin dicapai
- Tools/scripts yang tersedia
- Edge cases yang perlu diperhatikan

### 2. Gunakan Execution Scripts
Prioritaskan penggunaan scripts yang sudah ada:
- `execution/error_logger.py` - Logging error
- `execution/project_health_check.py` - Cek kesehatan proyek

### 3. Self-Annealing Loop
Ketika terjadi error:
1. Baca error message
2. Cari pattern serupa di learning database
3. Apply fix atau buat fix baru
4. Update directive dengan learning

## Available Workflows

| Command | Deskripsi |
|---------|-----------|
| `/error-recovery` | Recovery dari error |

## Quick Commands

```bash
# Cek kesehatan proyek
python execution/project_health_check.py

# Log error baru
python execution/error_logger.py --log "type" "message"

# Cari error serupa
python execution/error_logger.py --find "message"

# Lihat statistik
python execution/error_logger.py --stats
```
