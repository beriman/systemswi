// POST /api/tasks/seed — Seed sample tasks & comments
import { NextRequest, NextResponse } from "next/server";
import {
  initializeTaskSheets,
  readTaskSheet,
  appendTaskRows,
  TASK_SHEETS,
} from "@/lib/tasks/sheets";

export async function POST() {
  try {
    await initializeTaskSheets();
    const existing = await readTaskSheet(TASK_SHEETS.Tasks);
    if (existing.length > 1) {
      return NextResponse.json({ message: "Seed data already exists", taskCount: existing.length - 1 });
    }

    const now = new Date().toISOString().slice(0, 10);
    const pastDate = "2025-12-15";
    const tasks = [
      ["TSK-001", "Laporan Keuangan Q4", "Siapkan laporan keuangan kuartal 4", "Beriman", "Beriman", "2025-12-31", "High", "Done", "Laporan Berunan", "System", "2025-10-01", "2025-12-28", "Selesai tepat waktu"],
      ["TSK-002", "Event Monitoring Jakarta", "Pantau persiapan event monitoring di Jakarta", "Siti Aminah", "Siti Aminah", "2025-12-20", "High", "Done", "Event Monitoring", "System", "2025-11-01", now, "Event berjalan lancar"],
      ["TSK-003", "Update SOP Produksi", "Revisi SOP produksi sesuai standar terbaru", "Ahmad Rizki", "Ahmad Rizki", "2025-12-25", "High", "In Progress", "SOP Revisi", "System", "2025-11-15", "", "Progress 60%"],
      ["TSK-004", "Supplier Evaluation", "Evaluasi performa supplier bahan baku Q4", "Dewi Lestari", "Dewi Lestari", "2025-12-28", "Medium", "In Progress", "Supplier Review", "System", "2025-12-01", "", "3 supplier sudah dievaluasi"],
      ["TSK-005", "QC Checklist Review", "Review dan update QC checklist untuk produk baru", "Beriman", "Beriman", now, "Medium", "Review", "QC Audit", "System", "2025-12-10", "", "Menunggu approval manager"],
      ["TSK-006", "Inventory Audit", "Audit stok gudang akhir bulan", "Rudi Hartono", "Rudi Hartono", "2025-12-22", "Medium", "Todo", "Stock Opname", "System", "2025-12-18", "", "Belum dimulai"],
      ["TSK-007", "Pembaruan Data Customer", "Update database customer CRM divisi Bandung", "Siti Aminah", "Siti Aminah", pastDate, "High", "Todo", "CRM Update", "System", "2025-10-15", "", "Terlambat - perlu tindak lanjut"],
      ["TSK-008", "Training K Baru", "Onboarding dan training untuk karyawan baru produksi", "Ahmad Rizki", "Ahmad Rizki", pastDate, "Medium", "Todo", "HRD Training", "System", "2025-10-20", "", "Terlambat - reschedule"],
    ];

    await appendTaskRows(TASK_SHEETS.Tasks, tasks);

    const comments = [
      ["CMT-001", "TSK-001", "Beriman", "2025-12-28", "Laporan sudah selesai dan direview oleh manajemen"],
      ["CMT-002", "TSK-003", "Ahmad Rizki", "2025-12-10", "Draft SOP sudah selesai, sedang proses review internal"],
      ["CMT-003", "TSK-007", "Dewi Lestari", "2025-12-20", "Perlu follow up dengan tim CRM Bandung untuk data yang belum update"],
    ];
    await appendTaskRows(TASK_SHEETS.TaskComments, comments);

    return NextResponse.json({
      success: true,
      message: "Seed data created",
      tasksSeeded: tasks.length,
      commentsSeeded: comments.length,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to seed data", details: String(error) }, { status: 500 });
  }
}
