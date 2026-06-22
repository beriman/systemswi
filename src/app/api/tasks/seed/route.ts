import { NextRequest, NextResponse } from "next/server";
import { appendRows, readRange } from "@/lib/sheets/sheets-real";

// Seed data: 8 sample tasks + 3 sample comments
// Status mix: 2 Done, 2 In Progress, 2 To Do, 1 Review, 1 Overdue

const TASK_HEADERS = [
  "Task ID", "Title", "Description", "Assignee", "PIC Name",
  "Due Date", "Priority", "Status", "Related Event/Project",
  "Created By", "Created Date", "Completed Date", "Notes",
];

const COMMENT_HEADERS = ["Comment ID", "Task ID", "Author", "Date", "Comment"];

const SEED_TASKS = [
  // 1. Done — completed task
  [
    "TSK-001", "Finalisasi Laporan Q1 2026",
    "Menyusun laporan keuangan kuartal pertama untuk semua divisi",
    "Beriman", "Beriman", "2026-04-15", "High", "Done",
    "Laporan Keuangan Q1", "System", "2026-03-20", "2026-04-14",
    "Laporan sudah direvisi dan disetujui oleh direksi",
  ],
  // 2. Done — completed task
  [
    "TSK-002", "Update Data Customer CRM",
    "Migrasi data customer lama ke sistem CRM baru",
    "Siti Aminah", "Siti Aminah", "2026-03-30", "Medium", "Done",
    "CRM Migration", "System", "2026-03-01", "2026-03-28",
    "12.500 records berhasil dimigrasi",
  ],
  // 3. In Progress
  [
    "TSK-003", "Desain Kemasan Velvet Cloud",
    "Membuat desain kemasan baru untuk line Velvet Cloud EDP 100ml",
    "Dewi Lestari", "Dewi Lestari", "2026-07-15", "High", "In Progress",
    "Velvet Cloud Launch", "System", "2026-06-10", "",
    "Menunggu approval dari brand manager",
  ],
  // 4. In Progress
  [
    "TSK-004", "RAB Proyeksi Q3 2026",
    "Penyusunan RAB untuk proyeksi sukuk kuartal ketiga",
    "Ahmad Rizki", "Ahmad Rizki", "2026-07-30", "High", "In Progress",
    "Sukuk Planning", "System", "2026-06-15", "",
    "Perlu koordinasi dengan tim finance",
  ],
  // 5. To Do
  [
    "TSK-005", "Audit Stok Gudang B",
    "Melakukan audit stok bahan baku dan packaging di Gudang B",
    "Rudi Hartono", "Rudi Hartono", "2026-07-20", "Medium", "To Do",
    "Inventory Audit", "System", "2026-06-20", "",
    "Jadwalkan dengan tim gudang",
  ],
  // 6. To Do
  [
    "TSK-006", "Training BPOM Compliance",
    "Pelatihan tim produksi tentang regulasi BPOM terbaru",
    "Siti Aminah", "Siti Aminah", "2026-08-01", "Medium", "To Do",
    "BPOM Compliance", "System", "2026-06-22", "",
    "Narasumber dari konsultan BPOM",
  ],
  // 7. Review
  [
    "TSK-007", "Review Formula Aura Bloom 2.0",
    "Review dan validasi formula baru Aura Bloom versi 2.0",
    "Beriman", "Beriman", "2026-06-30", "High", "Review",
    "Product Development", "System", "2026-06-01", "",
    "Menunggu hasil lab test dari supplier",
  ],
  // 8. Overdue — due date in the past
  [
    "TSK-008", "Pembayaran Vendor Packaging",
    "Proses pembayaran vendor packaging untuk bulan Mei 2026",
    "Ahmad Rizki", "Ahmad Rizki", "2026-06-15", "High", "To Do",
    "Procurement", "System", "2026-05-25", "",
    "Invoice sudah diterima, menunggu approval finance",
  ],
];

const SEED_COMMENTS = [
  ["CMT-001", "TSK-003", "Beriman", "2026-06-18", "Desain sudah bagus, tolong tambahkan logo SWI di bagian belakang"],
  ["CMT-002", "TSK-003", "Dewi Lestari", "2026-06-19", "Siap, akan saya revisi hari ini"],
  ["CMT-003", "TSK-007", "Siti Aminah", "2026-06-22", "Lab test sudah keluar, semua parameter passed"],
];

async function ensureHeaders() {
  try {
    const existing = await readRange("Tasks!A1:M1");
    if (!existing || existing.length === 0 || !existing[0]?.[0]) {
      await appendRows("Tasks", [TASK_HEADERS]);
    }
  } catch {
    // ignore
  }

  try {
    const existing = await readRange("Task_Comments!A1:E1");
    if (!existing || existing.length === 0 || !existing[0]?.[0]) {
      await appendRows("Task_Comments", [COMMENT_HEADERS]);
    }
  } catch {
    // ignore
  }
}

export async function POST() {
  try {
    await ensureHeaders();

    let tasksAppended = 0;
    let commentsAppended = 0;

    // Check existing tasks to avoid duplicates
    const existingRange = await readRange("Tasks!A1:M1000");
    const existingIds = new Set<string>();
    for (let i = 1; i < existingRange.length; i++) {
      if (existingRange[i]?.[0]) existingIds.add(existingRange[i][0]);
    }

    const newTasks = SEED_TASKS.filter((t) => !existingIds.has(t[0]));
    if (newTasks.length > 0) {
      await appendRows("Tasks", newTasks);
      tasksAppended = newTasks.length;
    }

    // Check existing comments to avoid duplicates
    const existingComments = await readRange("Task_Comments!A1:E1000");
    const existingCommentIds = new Set<string>();
    for (let i = 1; i < existingComments.length; i++) {
      if (existingComments[i]?.[0]) existingCommentIds.add(existingComments[i][0]);
    }

    const newComments = SEED_COMMENTS.filter((c) => !existingCommentIds.has(c[0]));
    if (newComments.length > 0) {
      await appendRows("Task_Comments", newComments);
      commentsAppended = newComments.length;
    }

    return NextResponse.json({
      success: true,
      seeded: {
        tasks: tasksAppended,
        comments: commentsAppended,
        skipped: {
          tasks: SEED_TASKS.length - tasksAppended,
          comments: SEED_COMMENTS.length - commentsAppended,
        },
      },
      totalSeeded: tasksAppended + commentsAppended,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to seed task data" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Task Management Seed Endpoint",
    usage: "POST to seed 8 sample tasks and 3 sample comments",
    taskBreakdown: {
      total: 8,
      done: 2,
      inProgress: 2,
      toDo: 2,
      review: 1,
      overdue: 1,
    },
    assignees: ["Beriman", "Siti Aminah", "Ahmad Rizki", "Dewi Lestari", "Rudi Hartono"],
  });
}
