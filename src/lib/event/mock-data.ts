// Mock Event data for MVP
import type { Event, Panitia, Task, RABItem } from "./types";

// Fix types.ts typo - PaymentRecord eventId visibilityId should be eventId
export const mockEvents: Event[] = [
    {
        id: "evt-fragrantions-2026",
        name: "Fragrantions 2026",
        slug: "fragrantions-2026",
        type: "festival",
        status: "planning",
        description: "Parfum festival tahunan Indonesia — mempertemukan kreator, brand, dan pecinta parfum",
        pic: "Wapiq Rizya Zaelan",
        instagram: "@fragrantions",
        startDate: "2026-08-01",
        endDate: "2026-08-03",
        location: "Jakarta",
        venue: "TBA",
        budget: 500000000,
        actualCost: 0,
        revenue: 0,
        tenantCount: 0,
        sponsorCount: 0,
        attendeeTarget: 5000,
        attendeeActual: 0,
        notes: "Event tahunan utama SWI. Road to Fragrantions dimulai Juni 2026.",
        created: "2026-01-01T10:00:00Z",
        updated: "2026-01-09T14:00:00Z",
    },
    {
        id: "evt-001",
        name: "Wedding Expo 2026",
        slug: "wedding-expo-2026",
        type: "bazaar",
        status: "planning",
        description: "Pameran pernikahan terbesar di Jakarta",
        pic: "Wapiq Rizya Zaelan",
        startDate: "2026-03-15",
        endDate: "2026-03-17",
        location: "JCC Senayan",
        budget: 50000000,
        actualCost: 15000000,
        revenue: 0,
        tenantCount: 0,
        sponsorCount: 0,
        attendeeTarget: 500,
        attendeeActual: 0,
        created: "2026-01-01T10:00:00Z",
        updated: "2026-01-09T14:00:00Z",
    },
    {
        id: "evt-002",
        name: "Corporate Gathering",
        slug: "corporate-gathering-2026",
        type: "conference",
        status: "planning",
        description: "Annual gathering PT ABC",
        pic: "Wapiq Rizya Zaelan",
        startDate: "2026-04-20",
        endDate: "2026-04-20",
        location: "Bandung",
        budget: 25000000,
        actualCost: 0,
        revenue: 0,
        tenantCount: 0,
        sponsorCount: 0,
        attendeeTarget: 150,
        attendeeActual: 0,
        created: "2026-01-05T09:00:00Z",
        updated: "2026-01-05T09:00:00Z",
    },
    {
        id: "evt-003",
        name: "Music Festival",
        slug: "music-festival-2026",
        type: "festival",
        status: "planning",
        description: "Festival musik indie terbesar",
        pic: "Wapiq Rizya Zaelan",
        startDate: "2026-05-10",
        endDate: "2026-05-12",
        location: "Bali",
        budget: 100000000,
        actualCost: 35000000,
        revenue: 0,
        tenantCount: 0,
        sponsorCount: 0,
        attendeeTarget: 2000,
        attendeeActual: 0,
        created: "2025-12-15T10:00:00Z",
        updated: "2026-01-08T16:00:00Z",
    },
];

export const mockPanitia: Panitia[] = [
    {
        id: "pan-001",
        userId: "user-panitia-1",
        userName: "Ahmad Fauzi",
        userEmail: "ahmad@example.com",
        eventId: "evt-001",
        division: "koordinator",
        role: "ketua",
        assignedAt: "2026-01-02T10:00:00Z",
        ktpStatus: "verified",
        ktpFileId: "ktp-001",
    },
    {
        id: "pan-002",
        userId: "user-panitia-2",
        userName: "Dewi Sari",
        userEmail: "dewi@example.com",
        eventId: "evt-001",
        division: "acara",
        role: "ketua",
        assignedAt: "2026-01-03T10:00:00Z",
        ktpStatus: "uploaded",
        ktpFileId: "ktp-002",
    },
    {
        id: "pan-003",
        userId: "user-panitia-3",
        userName: "Budi Santoso",
        userEmail: "budi@example.com",
        eventId: "evt-001",
        division: "dokumentasi",
        role: "anggota",
        assignedAt: "2026-01-04T10:00:00Z",
        ktpStatus: "pending",
    },
];

export const mockTasks: Task[] = [
    {
        id: "task-001",
        eventId: "evt-001",
        assignedTo: "pan-001",
        title: "Koordinasi dengan vendor venue",
        description: "Meeting dengan pihak JCC untuk konfirmasi booking",
        status: "completed",
        deadline: "2026-01-15",
        priority: "high",
        createdAt: "2026-01-02T11:00:00Z",
        completedAt: "2026-01-10T14:00:00Z",
    },
    {
        id: "task-002",
        eventId: "evt-001",
        assignedTo: "pan-002",
        title: "Susun rundown acara",
        status: "in-progress",
        deadline: "2026-02-01",
        priority: "normal",
        createdAt: "2026-01-05T09:00:00Z",
    },
    {
        id: "task-003",
        eventId: "evt-001",
        assignedTo: "pan-003",
        title: "Siapkan equipment dokumentasi",
        status: "pending",
        deadline: "2026-03-01",
        priority: "low",
        createdAt: "2026-01-06T10:00:00Z",
    },
];

// Store functions
export function getEvents(): Event[] {
    return mockEvents;
}

export function getEventById(id: string): Event | undefined {
    return mockEvents.find((e) => e.id === id);
}

export function getPanitiaByEvent(eventId: string): Panitia[] {
    return mockPanitia.filter((p) => p.eventId === eventId);
}

export function getTasksByEvent(eventId: string): Task[] {
    return mockTasks.filter((t) => t.eventId === eventId);
}

export function getTasksByPanitia(panitiaId: string): Task[] {
    return mockTasks.filter((t) => t.assignedTo === panitiaId);
}
