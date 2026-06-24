"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BoothAssignment {
  boothNumber: string;
  brandName: string;
  packageType: string;
  paymentStatus: string;
  boothSize: string;
}

interface BoothMapProps {
  tenants: BoothAssignment[];
}

// Visual booth map: grid layout showing booth assignments
export function BoothMap({ tenants }: BoothMapProps) {
  if (!tenants.length) {
    return (
      <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
        <div className="text-4xl mb-2">🏪</div>
        <p>Belum ada booth assignment.</p>
        <p className="text-xs mt-1">Tambah tenant untuk mulai assign booth.</p>
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-emerald-100 border-emerald-300 text-emerald-800";
      case "partial": return "bg-amber-100 border-amber-300 text-amber-800";
      case "pending":
        return "bg-gray-100 border-gray-300 text-gray-700";
      case "waived":
        return "bg-blue-100 border-blue-300 text-blue-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-700";
    }
  };

  const packageColor = (pkg: string) => {
    switch (pkg) {
      case "vip": return "bg-purple-500 text-white";
      case "premium": return "bg-amber-500 text-white";
      case "sponsor": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  // Arrange booths in a grid (max 8 columns)
  const sorted = [...tenants].sort((a, b) => a.boothNumber.localeCompare(b.boothNumber));

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" /> Paid</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block" /> Partial</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300 inline-block" /> Pending</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300 inline-block" /> Waived</span>
      </div>

      {/* Booth Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {sorted.map((tenant) => (
          <div
            key={tenant.boothNumber}
            className={`rounded-lg border-2 p-2 text-center transition-all hover:shadow-md cursor-default ${statusColor(tenant.paymentStatus)}`}
          >
            <div className="text-xs font-bold text-lg">{tenant.boothNumber}</div>
            <div className="text-xs font-medium truncate mt-1" title={tenant.brandName}>
              {tenant.brandName.split(" ").slice(0, 2).join(" ")}
            </div>
            <Badge className={`mt-1 text-[10px] px-1 py-0 ${packageColor(tenant.packageType)}`}>
              {tenant.packageType}
            </Badge>
            <div className="text-[10px] mt-1 opacity-70">{tenant.boothSize}</div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
        <span>Total: {tenants.length} booth</span>
        <span>Paid: {tenants.filter(t => t.paymentStatus === "paid").length}</span>
        <span>Pending: {tenants.filter(t => t.paymentStatus === "pending").length}</span>
        <span>Partial: {tenants.filter(t => t.paymentStatus === "partial").length}</span>
      </div>
    </div>
  );
}
