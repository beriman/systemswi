// E2E Workflow Automation Dashboard
// Connects all SWI modules into one operational flow visualization
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type WorkflowStep = {
  id: string;
  phase: string;
  title: string;
  description: string;
  module: string;
  status: "active" | "configured" | "ready";
  dependencies: string[];
  href: string;
};

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: "procurement",
    phase: "1. Sourcing",
    title: "Procurement & PO",
    description: "Purchase orders to suppliers, track goods receipts",
    module: "procurement",
    status: "configured",
    dependencies: [],
    href: "/procurement",
  },
  {
    id: "inventory",
    phase: "2. Inventory",
    title: "Inventory Receipt",
    description: "Receive goods, update stock levels (bahan baku & packaging)",
    module: "inventory",
    status: "configured",
    dependencies: ["procurement"],
    href: "/inventory",
  },
  {
    id: "production",
    phase: "3. Production",
    title: "Production & QC",
    description: "Batch production, HPP calculation, quality control checks",
    module: "production",
    status: "configured",
    dependencies: ["inventory"],
    href: "/production",
  },
  {
    id: "bpom",
    phase: "4. Compliance",
    title: "BPOM Registration",
    description: "Register products with BPOM, track expiry & renewals",
    module: "bpom",
    status: "configured",
    dependencies: ["production"],
    href: "/bpom",
  },
  {
    id: "brands",
    phase: "5. Brand",
    title: "Brand Management",
    description: "Manage brand portfolio, production tracking, sales analytics",
    module: "brands",
    status: "configured",
    dependencies: ["production"],
    href: "/brands",
  },
  {
    id: "events",
    phase: "6. Events",
    title: "Event & Exhibition",
    description: "Fragrantions, Road to Fragrantions — tenants, sponsors, timeline",
    module: "events",
    status: "configured",
    dependencies: ["brands"],
    href: "/workspace/event-cde",
  },
  {
    id: "finance",
    phase: "7. Finance",
    title: "Finance & Accounting",
    description: "Transactions, cashflow, RAB, tax tracking, financial reports",
    module: "finance",
    status: "configured",
    dependencies: ["events", "procurement"],
    href: "/finance",
  },
  {
    id: "documents",
    phase: "8. Documents",
    title: "Document Generator",
    description: "Auto-generate invoices, letters, contracts, reports",
    module: "documents",
    status: "configured",
    dependencies: ["finance", "events"],
    href: "/documents",
  },
];

const PHASE_COLORS: Record<string, string> = {
  "1. Sourcing": "bg-orange-100 text-orange-700 border-orange-200",
  "2. Inventory": "bg-blue-100 text-blue-700 border-blue-200",
  "3. Production": "bg-purple-100 text-purple-700 border-purple-200",
  "4. Compliance": "bg-red-100 text-red-700 border-red-200",
  "5. Brand": "bg-pink-100 text-pink-700 border-pink-200",
  "6. Events": "bg-green-100 text-green-700 border-green-200",
  "7. Finance": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "8. Documents": "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const STATUS_CONFIG = {
  active: { label: "Active", color: "bg-green-500" },
  configured: { label: "Configured", color: "bg-blue-500" },
  ready: { label: "Ready", color: "bg-gray-400" },
};

export default function WorkflowDashboard() {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const stepsByPhase = WORKFLOW_STEPS.reduce(
    (acc, step) => {
      if (!acc[step.phase]) acc[step.phase] = [];
      acc[step.phase].push(step);
      return acc;
    },
    {} as Record<string, WorkflowStep[]>
  );

  const configuredCount = WORKFLOW_STEPS.filter((s) => s.status === "configured" || s.status === "active").length;
  const totalSteps = WORKFLOW_STEPS.length;
  const progressPercent = Math.round((configuredCount / totalSteps) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">🔄 End-to-End Workflow</h2>
          <p className="text-muted-foreground">
            Operational flow dari procurement sampai dokumentasi — semua modul SWI terhubung.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{progressPercent}%</div>
            <div className="text-xs text-muted-foreground">{configuredCount}/{totalSteps} configured</div>
          </div>
          <div className="w-16 h-16 relative">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
              <circle
                cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3"
                strokeDasharray={`${progressPercent} ${100 - progressPercent}`}
                strokeLinecap="round"
                className="text-primary"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Workflow Steps */}
      <div className="space-y-4">
        {Object.entries(stepsByPhase).map(([phase, steps]) => (
          <div key={phase}>
            <div className="flex items-center gap-3 mb-3">
              <Badge className={`border ${PHASE_COLORS[phase] || "bg-gray-100 text-gray-700"}`}>
                {phase}
              </Badge>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {steps.map((step) => (
                <Card
                  key={step.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedStep === step.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{step.title}</CardTitle>
                      <div className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[step.status].color}`} />
                    </div>
                    <CardDescription className="text-xs">{step.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {step.dependencies.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            ← {step.dependencies.length} dep
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {STATUS_CONFIG[step.status].label}
                        </Badge>
                      </div>
                      <a href={step.href} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Buka →
                        </Button>
                      </a>
                    </div>

                    {/* Expanded details */}
                    {selectedStep === step.id && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Module</span>
                            <span className="font-medium">{step.module}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <span className="font-medium">{STATUS_CONFIG[step.status].label}</span>
                          </div>
                          {step.dependencies.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Dependencies</span>
                              <span className="font-medium">{step.dependencies.join(", ")}</span>
                            </div>
                          )}
                        </div>
                        <a href={step.href}>
                          <Button size="sm" className="w-full">
                            Buka {step.title}
                          </Button>
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Flow Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Flow Diagram</CardTitle>
          <CardDescription>Alur data dari procurement sampai dokumentasi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-2 min-w-[800px] py-4 px-2">
              {WORKFLOW_STEPS.map((step, i) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center gap-1 min-w-[90px]">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      step.status === "active" ? "bg-green-500" : step.status === "configured" ? "bg-blue-500" : "bg-gray-400"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="text-xs font-medium text-center leading-tight">{step.title}</div>
                    <Badge variant="outline" className="text-[10px]">
                      {step.module}
                    </Badge>
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div className="flex items-center mx-1">
                      <div className="w-6 h-0.5 bg-primary/40" />
                      <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px] border-l-primary/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Modules</CardDescription>
            <CardTitle className="text-3xl">{totalSteps}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Semua modul terhubung dalam workflow</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Configured</CardDescription>
            <CardTitle className="text-3xl text-green-600">{configuredCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Modul siap operasional</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Data Sources</CardDescription>
            <CardTitle className="text-3xl">3</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Sheets, Drive, Docs — semua terintegrasi</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>API Routes</CardDescription>
            <CardTitle className="text-3xl">35</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Semua endpoint aktif dan degraded-safe</CardContent>
        </Card>
      </div>
    </div>
  );
}
