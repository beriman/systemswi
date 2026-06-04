"use client";

import { useEffect } from "react";

// Redirect to new Event Management page
// Legacy page — kept for backward compatibility
export default function EventCDE() {
  useEffect(() => {
    window.location.href = "/events";
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-xl font-bold mb-2">Event Management</h2>
        <p className="text-muted-foreground">Mengarah ke halaman Event Management...</p>
      </div>
    </div>
  );
}
