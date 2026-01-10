---
description: Workflow untuk recovery dari error yang terjadi
---

# Error Recovery Workflow

Workflow ini digunakan ketika terjadi error dan perlu melakukan perbaikan.

## Prerequisites
- File `.error.md` berisi informasi error (jika user bilang "cek error")
- Learning database tersedia di `execution/data/learning_database.json`

## Steps

1. **Identifikasi Error**
   - Baca file `.error.md` atau error message dari user
   - Catat error type dan stack trace

2. **Cari Pattern Serupa**
   // turbo
   ```bash
   python execution/error_logger.py --find "ERROR_MESSAGE"
   ```

3. **Jika pattern ditemukan dengan confidence ≥ 85%:**
   - Apply automated fix yang tersimpan
   - Test hasil fix

4. **Jika tidak ada pattern:**
   - Analisis error secara manual
   - Buat fix baru
   - Log error dan fix ke database:
   // turbo
   ```bash
   python execution/error_logger.py --log "ERROR_TYPE" "ERROR_MESSAGE"
   ```

5. **Update Directive**
   - Jika error terkait dengan directive tertentu
   - Update directive dengan learning baru

6. **Verifikasi**
   - Pastikan error sudah resolved
   - Update learning database jika berhasil
