// Expense Approval Flow types for SWI
// PIC: HemuHemu/OWL

export interface ExpenseSubmission {
  id: string;
  date: string;
  submitterName: string;
  relatedEvent: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  proofUrl: string;
  status: ExpenseStatus;
  reviewedBy: string;
  reviewedDate: string;
  notes: string;
}

export type ExpenseStatus = "pending" | "approved" | "rejected";

export type ExpenseCategory =
  | "venue"
  | "equipment"
  | "marketing"
  | "staff"
  | "catering"
  | "entertainment"
  | "logistics"
  | "permit"
  | "insurance"
  | "transportation"
  | "accommodation"
  | "consumption"
  | "misc";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  venue: "Venue & Tempat",
  equipment: "Peralatan & Equipment",
  marketing: "Marketing & Promosi",
  staff: "Staff & SDM",
  catering: "Konsumsi & Catering",
  entertainment: "Entertainment & Hiburan",
  logistics: "Logistik & Pengiriman",
  permit: "Perizinan & Legal",
  insurance: "Asuransi",
  transportation: "Transportasi",
  accommodation: "Akomodasi",
  consumption: "Konsumsi Operasional",
  misc: "Lain-lain",
};

export interface ExpenseApprover {
  id: string;
  name: string;
  role: string;
  email: string;
}

export interface ExpenseDashboardStats {
  totalPending: number;
  totalPendingAmount: number;
  totalApprovedThisMonth: number;
  totalApprovedAmountThisMonth: number;
  totalRejected: number;
  budgetVsActual: BudgetVsActual[];
}

export interface BudgetVsActual {
  eventId: string;
  eventName: string;
  budget: number;
  actual: number;
  remaining: number;
}

export interface CreateExpenseRequest {
  submitterName: string;
  relatedEvent: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  proofUrl?: string;
}

export interface UpdateExpenseRequest {
  status: ExpenseStatus;
  reviewedBy: string;
  notes?: string;
}
