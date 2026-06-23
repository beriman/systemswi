// Initialize SQLite DB with customer schema
// Called at app startup to ensure tables exist
import { customerSchemaSql } from "./schema";

let initialized = false;

export function ensureCustomerTables(db: any): boolean {
  if (initialized) return true;
  try {
    db.exec(customerSchemaSql);
    initialized = true;
    return true;
  } catch (error) {
    console.error("[CustomerDB] Failed to init schema:", error);
    return false;
  }
}

export function resetInitFlag() {
  initialized = false;
}
