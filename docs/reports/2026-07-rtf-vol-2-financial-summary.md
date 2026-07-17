# Laporan Keuangan Event — Road to Fragrantions Vol. II 2026

**Event:** Road to Fragrantions Vol. II  
**Tanggal event:** 4–5 Juli 2026  
**Sumber data:** Laporan user + Google Sheets event  
**Dicatat di System SWI:** 2026-07-11

---

## 1. Sumber Laporan

### Laporan Revenue Sharing Fragrantions x TIM

Google Sheets:
https://docs.google.com/spreadsheets/d/1Lz8w5U_mJh6IoJA7xi4szpN9dQv8RUXzIe-zocBK6Yc/edit?usp=drivesdk

### Laporan CashFlow Event RTF Vol II 2026

Google Sheets:
https://docs.google.com/spreadsheets/d/1ccEG9Rubk2k3akmBq3wqJ-kV_3nmLvo9-cvoKuCeUmo/edit?usp=drivesdk

---

## 2. Revenue Sharing Fragrantions x TIM

| Komponen | Nilai |
|---|---:|
| Total revenue sharing | Rp 37.467.944 |
| Bagian TIM 30% | Rp 11.240.383 |
| Bagian SWI 70% | Rp 26.227.561 |

Verifikasi:

```text
Rp 11.240.383 + Rp 26.227.561 = Rp 37.467.944
```

---

## 3. Cashflow Event untuk SWI

| Komponen | Nilai |
|---|---:|
| Revenue sharing SWI | Rp 26.227.561 |
| Sewa meja / tambahan pemasukan event | Rp 3.330.000 |
| Total pemasukan untuk SWI | Rp 29.557.561 |
| Total pengeluaran operasional | Rp 20.568.177 |
| Net masuk untuk SWI | Rp 8.989.384 |

Verifikasi:

```text
Rp 29.557.561 - Rp 20.568.177 = Rp 8.989.384
```

---

## 4. Transfer dari SWI ke Wapiq untuk Operasional

| No | Nominal |
|---:|---:|
| 1 | Rp 500.000 |
| 2 | Rp 5.550.000 |
| 3 | Rp 6.000.000 |
| 4 | Rp 10.000.000 |
| **Total transfer ke Wapiq** | **Rp 22.050.000** |

---

## 5. Kembalian Operasional dari Wapiq

| Komponen | Nilai |
|---|---:|
| Total transfer SWI ke Wapiq | Rp 22.050.000 |
| Total pengeluaran operasional | Rp 20.568.177 |
| Kembalian seharusnya | Rp 1.481.823 |

Verifikasi:

```text
Rp 22.050.000 - Rp 20.568.177 = Rp 1.481.823
```

Catatan:

- Wapiq sempat kasbon.
- Perlu dicatat secara eksplisit di System SWI apakah kasbon Wapiq sudah dipotong/dikembalikan/masih outstanding.

---

## 6. Treatment Akuntansi / System SWI

Rekomendasi pencatatan di System SWI:

### Event_Budget / Event Closeout

Masukkan sebagai event closeout:

- Total revenue sharing: Rp 37.467.944
- TIM share: Rp 11.240.383
- SWI share: Rp 26.227.561
- Sewa meja / pemasukan tambahan: Rp 3.330.000
- Total income SWI: Rp 29.557.561
- Operational expense: Rp 20.568.177
- Net event result for SWI: Rp 8.989.384

### Distribusi Laba Bersih Internal SWI

Karena sistem SWI menggunakan struktur holding, laba bersih event dibagi antara Holding SWI dan Divisi EO/Event.

| Penerima Internal | Persentase | Nilai |
|---|---:|---:|
| Holding SWI | 30% | Rp 2.696.815 |
| Divisi EO/Event | 70% | Rp 6.292.569 |
| **Total net SWI** | **100%** | **Rp 8.989.384** |

Verifikasi:

```text
Rp 2.696.815 + Rp 6.292.569 = Rp 8.989.384
```

### Buku_Kas / Cash_Harian

Transfer dari SWI ke Wapiq harus dicatat sebagai **advance operasional event / kasbon PIC event**, bukan langsung expense final, sampai realisasi biaya dan kembalian dicocokkan.

### Accountable Person

- PIC Operasional / penerima transfer: Wapiq
- Total advance: Rp 22.050.000
- Realisasi expense: Rp 20.568.177
- Kembalian: Rp 1.481.823
- Status kasbon: perlu konfirmasi apakah sudah settled.

### Governance Note

Untuk prinsip GCG dan etika keuangan:

- Semua transfer ke PIC event harus punya bukti transfer.
- Semua pengeluaran operasional harus punya bukti nota/invoice/receipt.
- Kembalian harus dicatat sebagai pengembalian kas/event settlement.
- Kasbon Wapiq harus punya status: settled / partially settled / outstanding.

---

## 7. Status Data

| Item | Status |
|---|---|
| Revenue sharing total | Verified by arithmetic |
| TIM 30% | Verified by arithmetic |
| SWI 70% | Verified by arithmetic |
| Total income SWI | Verified by arithmetic |
| Operational expense | User-provided source |
| Net SWI | Verified by arithmetic |
| Transfer to Wapiq | Verified by arithmetic |
| Kembalian Wapiq | Verified by arithmetic |
| Kasbon Wapiq | Needs settlement status |

---

## 8. Status Pencatatan Pemasukan/Pengeluaran SWI

**Update pencatatan:** 2026-07-17  
**Instruksi:** BA/laporan RTF Vol. II dicatat di pemasukan dan pengeluaran SWI.

### Transaksi yang dicatat di SQLite lokal SystemSWI

| Ref | Tanggal | Jenis | Kategori | Nilai |
|---|---|---|---|---:|
| `RTF2-INCOME-SWI-2026` | 2026-07-05 | pemasukan | Event Revenue / RTF Vol. II | Rp 29.557.561 |
| `RTF2-OPEX-SWI-2026` | 2026-07-05 | pengeluaran | Beban Operasional Event / RTF Vol. II | Rp 20.568.177 |

Verifikasi net:

```text
Rp 29.557.561 - Rp 20.568.177 = Rp 8.989.384
```

### Treatment kasbon/advance Wapiq

Transfer SWI ke Wapiq sebesar **Rp 22.050.000** dicatat sebagai konteks rekonsiliasi **advance/kasbon PIC event**, bukan sebagai beban tambahan, agar pengeluaran tidak double-count terhadap realisasi operasional **Rp 20.568.177**.

```text
Rp 22.050.000 - Rp 20.568.177 = Rp 1.481.823 expected kembalian
```

Status settlement/kembalian Wapiq: **needs confirmation**.

### Bukti transfer TIM

Pada 17 Juli 2026, SWI melakukan transfer pembayaran bagian TIM 30% atas RTF Vol. II:

| Field | Nilai |
|---|---:|
| Transaction ID | `110108212844311` |
| Rekening sumber | `**********6304 - SENSASI WANGI INDONE` |
| Tujuan | Mandiri `1150076011370 - JAKARTA PROPERTINDO` |
| Berita | `RTF vol 2` |
| Nominal pokok | Rp 11.240.383 |
| Admin bank | Rp 6.500 |
| Total debit rekening | Rp 11.246.883 |
| Ref SystemSWI | `BRI-110108212844311-RTF2-TIM` |

Catatan: pembayaran ini adalah settlement bagian partner TIM, bukan beban operasional tambahan SWI dalam P&L event. Dalam cashflow bank tetap dicatat sebagai cash-out.

### Status Google Sheets

Sinkronisasi ke Google Sheets source-of-truth masih **blocked** karena OAuth token lokal mengembalikan:

```text
invalid_grant
```

Setelah Google OAuth re-auth selesai, row yang perlu disinkronkan adalah dua transaksi pemasukan/pengeluaran closeout, bukti transfer TIM, dan catatan rekonsiliasi kasbon/kembalian Wapiq.

---

## 9. Next Action

- Re-auth Google Sheets token untuk sinkronisasi ke source-of-truth.
- Sinkronkan `RTF2-INCOME-SWI-2026` dan `RTF2-OPEX-SWI-2026` ke sheet finance yang disetujui.
- Pastikan bukti transfer dan bukti pengeluaran tersimpan di Drive.
- Konfirmasi status kembalian/kasbon Wapiq sebesar Rp 1.481.823.
- Jadikan event ini contoh pertama penerapan `Event Closeout Report` di rencana ETIKA TARIF.
