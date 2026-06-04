"use client";

import { useState, useEffect } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGate } from "@/components/auth/role-gate";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardData {
  investors: number;
  sukuk: number;
  pemasukan: number;
  pengeluaran: number;
  netCashflow: number;
  bankData: any;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  const { accessibleFeatures } = usePermissions();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Welcome to System SWI Dashboard
        </p>
      </div>

      {/* KPI Cards - CEO/COO only */}
      <RoleGate feature="dashboard:overview">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Pemasukan</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data?.pemasukan || 0)}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(data?.pengeluaran || 0)}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Net Cashflow</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className={`text-2xl font-bold ${(data?.netCashflow || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(data?.netCashflow || 0)}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Investor Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{data?.investors || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </RoleGate>

      {/* Feature Cards - Based on Role */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RoleGate feature="event-cde">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📅 Event CDE</CardTitle>
              <CardDescription>Event management</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage events, tenants, and webinar planning.
              </p>
            </CardContent>
          </Card>
        </RoleGate>

        <RoleGate feature="ai-features">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🤖 AI Features</CardTitle>
              <CardDescription>AI Chat & Assistance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI-powered document generation and workflow automation.
              </p>
            </CardContent>
          </Card>
        </RoleGate>

        <RoleGate feature="drive">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📁 Drive</CardTitle>
              <CardDescription>Google Drive access</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Browse and manage company files in Google Drive.
              </p>
            </CardContent>
          </Card>
        </RoleGate>

        <RoleGate feature="dashboard:overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💰 Finance</CardTitle>
              <CardDescription>Financial monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track cashflow, equity, and bank statements.
              </p>
            </CardContent>
          </Card>
        </RoleGate>

        <RoleGate feature="user-management" requiredLevel="admin">
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="text-lg">👥 User Management</CardTitle>
              <CardDescription>Manage users & invites</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Invite team members and manage permissions.
              </p>
            </CardContent>
          </Card>
        </RoleGate>
      </div>

      {/* Debug Info */}
      <div className="text-xs text-muted-foreground">
        Accessible features: {accessibleFeatures.join(", ") || "none"}
      </div>
    </div>
  );
}
