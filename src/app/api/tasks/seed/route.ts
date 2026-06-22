// POST /api/tasks/seed — Seed sample tasks & comments
import { NextRequest, NextResponse } from "next/server";
import {
  initializeTaskSheets,
  readTaskSheet,
  appendTaskRows,
  TASK_SHEETS,
} from "@/lib/tasks/sheets";

function daysFromNow(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export async function POST() {
  try {
    await initializeTaskSheets();
    const existing = await readTaskSheet(TASK_SHEETS.Tasks);
    if (existing.length > 1) {
      return NextResponse.json({ message: "Seed data already exists", taskCount: existing.length - 1 });
    }

    const today = daysFromNow(0);
    const d3 = daysFromNow(3);
    const d7 = daysFromNow(7);
    const d14 = daysFromNow(14);
    const dPast15 = daysFromNow(-15);
    const dPast7 = daysFromNow(-7);
    const dPast3 = daysFromNow(-3);

    const tasks = [
      ["TSK-001", "Laporan Keuangan Q1", "Siapkan laporan keuangan kuartal 1 2026", "Beriman", "Beriman", dPast15, "High", "Done", "Laporan Berunan", "System", daysFromNow(-60), daysFromNow(-10), "Selesai tepat waktu"],
      ["TSK-002", "Event Monitoring Jakarta", "Pantau persiapan event monitoring di Jakarta", "Siti Aminah", "Siti Aminah", dPast7, "High", "Done", "Event Monitoring", "System", daysFromNow(-30), daysFromNow(-5), "Event berjalan lancar"],
      ["TSK-003", "Update SOP Produksi", "Revisi SOP produksi sesuai standar terbaru", "Ahmad Rizki", "Ahmad Rizki", d3, "High", "In Progress", "SOP Revisi", "System", daysFromNow(-20), "", "Progress 60%"],
      ["TSK-004", "Supplier Evaluation", "Evaluasi performa supplier bahan baku Q1", "Dewi Lestari", "Dewi Lestari", d7, "Medium", "In Progress", "Supplier Review", "System", daysFromNow(-10), "", "3 supplier sudah dievaluasi"],
      ["TSK-005", "QC Checklist Review", "Review dan update QC checklist untuk produk baru", "Beriman", "Beriman", today, "Medium", "Review", "QC Audit", "System", daysFromNow(-5), "", "Menunggu approval manager"],
      ["TSK-006", "Inventory Audit", "Audit stok gudang akhir bulan", "Rudi Hartono", "Rudi Hartono", d14, "Medium", "Todo", "Stock Opname", "System", daysFromNow(-3), "", "Belum dimulai"],
      ["TSK-007", "Pembaruan Data Customer", "Update database customer CRM divisi Bandung", "Siti Aminah", "Siti Aminah", dPast15, "High", "Todo", "CRM Update", "System", daysFromNow(-45), "", "Terlambat - perlu tindak lanjut"],
      ["TSK-008", "Training Karyawan Baru", "Onboarding dan training untuk karyawan baru produksi", "Ahmad Rizki", "Ahmad Rizki", dPast7, "Medium", "Todo", "HRD Training", "System", daysFromNow(-30), "", "Terlambat - reschedule"],
    ];

    await appendTaskRows(TASK_SHEETS.Tasks, tasks);

    const comments = [
      ["CMT-001", "TSK-001", "Beriman", daysFromNow(-10), "Laporan sudah selesai dan direview oleh manajemen"],
      ["CMT-002", "TSK-003", "Ahmad Rizki", daysFromNow(-5), "Draft SOP sudah selesai, sedang proses review internal"],
      ["CMT-003", "TSK-007", "Dewi Lestari", daysFromNow(-2), "Perlu follow up dengan tim CRM Bandung untuk data yang belum update"],
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
