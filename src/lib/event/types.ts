// Event Management types for Fragrantions & SWI Events
// PIC: Wapiq Rizya Zaelan
// Instagram: @fragrantions

// ── Core Event (Fragrantions-specific) ──
export interface Event {
  id: string;
  name: string;
  slug: string;
  type: "festival" | "workshop" | "webinar" | "pop-up" | "bazaar" | "conference" | "other";
  status: "planning" | "open-registration" | "ongoing" | "completed" | "cancelled" | "postponed";
  description: string;
  pic: string;
  instagram?: string;
  startDate: string;
  endDate: string;
  location: string;
  venue?: string;
  budget: number;
  actualCost: number;
  revenue: number;
  tenantCount: number;
  sponsorCount: number;
  attendeeTarget: number;
  attendeeActual: number;
  notes?: string;
  created: string;
  updated: string;
}

// ── Budget ──
export interface EventBudget {
  id: string;
  eventId: string;
  category: "venue" | "equipment" | "marketing" | "staff" | "catering" | "entertainment" | "logistics" | "permit" | "insurance" | "misc";
  itemName: string;
  plannedAmount: number;
  actualAmount: number;
  notes?: string;
  created: string;
}

// ── Tenant / Exhibitor ──
export interface EventTenant {
  id: string;
  eventId: string;
  brandName: string;
  contactPerson: string;
  email: string;
  phone: string;
  boothNumber?: string;
  boothSize?: string;
  packageType: "basic" | "premium" | "vip" | "sponsor";
  fee: number;
  paymentStatus: "pending" | "partial" | "paid" | "waived";
  paymentAmount: number;
  contractDate?: string;
  notes?: string;
  created: string;
}

// ── Sponsor ──
export interface EventSponsor {
  id: string;
  eventId: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  tier: "platinum" | "gold" | "silver" | "bronze" | "media" | "community";
  sponsorshipAmount: number;
  inKind: boolean;
  inKindDescription?: string;
  inKindValue?: number;
  paymentStatus: "pending" | "partial" | "paid" | "declined";
  contractDate?: string;
  logoUrl?: string;
  notes?: string;
  created: string;
}

// ── Timeline ──
export interface EventTimeline {
  id: string;
  eventId: string;
  phase: string;
  milestone: string;
  dueDate: string;
  completed: boolean;
  completedDate?: string;
  notes?: string;
  created: string;
}

// ── Stats ──
export interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  totalBudget: number;
  totalActualCost: number;
  totalRevenue: number;
  totalMargin: number;
  totalTenants: number;
  totalSponsors: number;
  totalAttendees: number;
}

// ── Legacy types (for backward compatibility with existing components) ──

export type EventStatus = "draft" | "planning" | "approved" | "ongoing" | "completed" | "cancelled";

export interface LegacyEvent {
  id: string;
  name: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  status: EventStatus;
  budget: number;
  spentBudget: number;
  estimatedParticipants: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  driveFolderId?: string;
}

export type Division = "koordinator" | "acara" | "dokumentasi" | "sponsorship" | "tenant" | "marketing" | "keamanan" | "konsumsi" | "transportasi" | "keuangan" | "medis" | "lainnya";

export const DIVISION_LABELS: Record<Division, string> = {
  koordinator: "Koordinator",
  acara: "Acara",
  dokumentasi: "Dokumentasi",
  sponsorship: "Sponsorship",
  tenant: "Tenant",
  marketing: "Marketing",
  keamanan: "Keamanan",
  konsumsi: "Konsumsi",
  transportasi: "Transportasi",
  keuangan: "Keuangan",
  medis: "Medis",
  lainnya: "Lainnya",
};

export type PanitiaRole = "ketua" | "wakil" | "sekretaris" | "bendahara" | "anggota";

export interface Panitia {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  eventId: string;
  division: Division;
  role: PanitiaRole;
  assignedAt: string;
  ktpStatus: "pending" | "uploaded" | "verified" | "rejected";
  ktpFileId?: string;
}

export type TaskStatus = "pending" | "in-progress" | "completed" | "blocked";
export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface Task {
  id: string;
  eventId: string;
  assignedTo: string;
  title: string;
  description?: string;
  status: TaskStatus;
  deadline: string;
  priority: TaskPriority;
  createdAt: string;
  completedAt?: string;
}

export interface RABItem {
  id: string;
  eventId: string;
  category: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  status: "planned" | "approved" | "purchased" | "paid";
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  eventId: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  date: string;
  proofUrl?: string;
  notes?: string;
}
