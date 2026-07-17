# Catatan Bukti Transfer BRI — SWI 17 Juli 2026

**Tanggal catat:** 2026-07-17  
**Sumber:** screenshot bukti transaksi BRI QLola dari rekening SWI  
**Rekening sumber:** `**********6304 - SENSASI WANGI INDONE`  
**Status:** tercatat di SQLite lokal SystemSWI; sinkron Google Sheets menunggu re-auth OAuth.

---

## 1. Transfer untuk Modal/Pengembangan Aplikasi Store

| Field | Nilai |
|---|---:|
| Transaction ID | `110108212828823` |
| Tanggal transaksi | 17/07/2026 06:18:28 |
| Tujuan | BCA `4730048209 - BERIMAN JULIANO` |
| Berita | `SWI store os` |
| Nominal transfer | Rp 2.000.000 |
| Admin bank | Rp 6.500 |
| Total debit rekening | Rp 2.006.500 |
| Ref SystemSWI | `BRI-110108212828823-STORE-APP` |

### Treatment akuntansi

Dicatat sebagai **pengeluaran kas / project fund** untuk pengembangan aplikasi Store:

```text
Kategori: Store App Development Fund
Nilai pencatatan cash-out: Rp 2.006.500
```

Catatan: dana ini perlu ditentukan status finalnya kemudian: apakah menjadi expense pengembangan aplikasi, advance/accountability Beriman, atau kapitalisasi aset/software setelah ada kebijakan/approval.

---

## 2. Transfer ke TIM atas Road to Fragrantions Vol. II

| Field | Nilai |
|---|---:|
| Transaction ID | `110108212844311` |
| Tanggal transaksi | 17/07/2026 06:22:13 |
| Tujuan | Mandiri `1150076011370 - JAKARTA PROPERTINDO` |
| Berita | `RTF vol 2` |
| Nominal transfer | Rp 11.240.383 |
| Admin bank | Rp 6.500 |
| Total debit rekening | Rp 11.246.883 |
| Ref SystemSWI | `BRI-110108212844311-RTF2-TIM` |

### Treatment akuntansi

Nominal pokok **Rp 11.240.383** adalah bukti pembayaran bagian TIM 30% atas RTF Vol. II.

Dicatat sebagai cash-out settlement:

```text
Kategori: RTF Vol. II - TIM Share Settlement
Nilai pencatatan cash-out: Rp 11.246.883
```

Catatan GCG: pembayaran ini adalah settlement/pembayaran bagian partner TIM, bukan beban operasional SWI tambahan dalam P&L event. Dalam cashflow bank, tetap keluar sebesar total debit rekening.

---

## 3. Ringkasan Total Debit

| Komponen | Nilai |
|---|---:|
| Total nominal transfer | Rp 13.240.383 |
| Total admin bank | Rp 13.000 |
| **Total debit rekening SWI** | **Rp 13.253.383** |

---

## 4. Status Sinkronisasi

| Target | Status |
|---|---|
| SQLite lokal SystemSWI | Done |
| Audit log lokal SystemSWI | Done |
| Google Sheets source-of-truth | Blocked — `invalid_grant`, perlu re-auth OAuth |
| GitHub docs | Done setelah commit |

---

## 5. Next Action

1. Re-auth Google OAuth untuk sinkronisasi Google Sheets.
2. Sync dua ref transaksi ke sheet finance/cashflow yang disetujui.
3. Untuk Store App fund, tentukan status final: expense, advance/accountability, atau capitalized software asset.
4. Untuk RTF Vol. II, lampirkan bukti ini sebagai settlement bagian TIM.
