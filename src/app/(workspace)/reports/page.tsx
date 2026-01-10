"use client";

import { useState } from "react";
import { RoleGate } from "@/components/auth/role-gate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    getTaxReports,
    getBPJSStatus,
    getLegalDocuments,
    getFinancialReports,
    getFreelancers,
    getRevenueEntries,
    getSetorans,
    getAuditLog,
    getTotalRevenue,
    getTotalSetoran,
    getPaidSetoran,
    getPendingSetoran,
    TAX_TYPE_LABELS,
    LEGAL_DOC_LABELS,
} from "@/lib/finance";

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

function getStatusBadge(status: string): string {
    switch (status) {
        case "paid": case "compliant": case "active": return "bg-green-500/20 text-green-600";
        case "pending": case "warning": case "expiring_soon": return "bg-yellow-500/20 text-yellow-600";
        case "overdue": case "non_compliant": case "expired": return "bg-red-500/20 text-red-600";
        case "partial": return "bg-blue-500/20 text-blue-600";
        default: return "bg-gray-500/20 text-gray-600";
    }
}

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState("overview");

    const taxReports = getTaxReports();
    const bpjsStatus = getBPJSStatus();
    const legalDocs = getLegalDocuments();
    const finReports = getFinancialReports();
    const freelancers = getFreelancers();
    const revenues = getRevenueEntries();
    const setorans = getSetorans();
    const auditLog = getAuditLog();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">📊 Reports & Financial</h2>
                <p className="text-muted-foreground">Tax, compliance, legal, financial, and audit reports</p>
            </div>

            <RoleGate feature="dashboard">
                {/* Overview Stats */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(getTotalRevenue())}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Total Setoran</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(getTotalSetoran())}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Paid Setoran</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(getPaidSetoran())}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Pending Setoran</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(getPendingSetoran())}</div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="flex-wrap">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="tax">Tax</TabsTrigger>
                        <TabsTrigger value="bpjs">BPJS</TabsTrigger>
                        <TabsTrigger value="legal">Legal</TabsTrigger>
                        <TabsTrigger value="financial">Financial</TabsTrigger>
                        <TabsTrigger value="freelancer">Freelancer</TabsTrigger>
                        <TabsTrigger value="setoran">Setoran</TabsTrigger>
                        <TabsTrigger value="audit">Audit Log</TabsTrigger>
                    </TabsList>

                    {/* Tax Tab */}
                    <TabsContent value="tax" className="mt-6">
                        <div className="grid gap-4">
                            {taxReports.map((tax) => (
                                <Card key={tax.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle>{TAX_TYPE_LABELS[tax.type]}</CardTitle>
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(tax.status)}`}>
                                                {tax.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <CardDescription>Period: {tax.period}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex justify-between items-center">
                                        <div>
                                            <div className="text-xl font-bold">{formatCurrency(tax.amount)}</div>
                                            <div className="text-xs text-muted-foreground">Due: {tax.dueDate}</div>
                                        </div>
                                        {tax.fileUrl && <Button variant="outline" size="sm">📄 Download</Button>}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* BPJS Tab */}
                    <TabsContent value="bpjs" className="mt-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            {bpjsStatus.map((bpjs) => (
                                <Card key={bpjs.id}>
                                    <CardHeader>
                                        <CardTitle>{bpjs.employeeName}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span>BPJS Kesehatan</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(bpjs.bpjsKesehatan.status)}`}>
                                                {bpjs.bpjsKesehatan.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>BPJS Ketenagakerjaan</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(bpjs.bpjsKetenagakerjaan.status)}`}>
                                                {bpjs.bpjsKetenagakerjaan.status}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Legal Tab */}
                    <TabsContent value="legal" className="mt-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {legalDocs.map((doc) => (
                                <Card key={doc.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-primary">{LEGAL_DOC_LABELS[doc.type]}</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(doc.status)}`}>
                                                {doc.status}
                                            </span>
                                        </div>
                                        <CardTitle className="text-lg">{doc.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xs text-muted-foreground mb-2">
                                            Issued: {doc.issueDate}
                                            {doc.expiryDate && ` | Expires: ${doc.expiryDate}`}
                                        </div>
                                        <Button variant="outline" size="sm" className="w-full">📄 View Document</Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Financial Tab */}
                    <TabsContent value="financial" className="mt-6">
                        <div className="grid gap-4">
                            {finReports.map((report) => (
                                <Card key={report.id}>
                                    <CardHeader className="pb-2">
                                        <CardTitle>{report.name}</CardTitle>
                                        <CardDescription>Period: {report.period} | Created: {report.createdAt}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button variant="outline" size="sm">📄 Download Report</Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Freelancer Tab */}
                    <TabsContent value="freelancer" className="mt-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {freelancers.map((fl) => (
                                <Card key={fl.id}>
                                    <CardHeader>
                                        <CardTitle>{fl.name}</CardTitle>
                                        <CardDescription>{fl.skills.join(", ")}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Rate</span>
                                            <span>{formatCurrency(fl.rate)}/{fl.rateType}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Projects</span>
                                            <span>{fl.totalProjects}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Total Paid</span>
                                            <span className="text-green-600">{formatCurrency(fl.totalEarnings)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Setoran Tab */}
                    <TabsContent value="setoran" className="mt-6">
                        <div className="grid gap-4">
                            {setorans.map((setoran) => (
                                <Card key={setoran.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle>{setoran.eventName}</CardTitle>
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(setoran.status)}`}>
                                                {setoran.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-2 md:grid-cols-4">
                                            <div>
                                                <div className="text-xs text-muted-foreground">Revenue</div>
                                                <div className="font-medium">{formatCurrency(setoran.totalRevenue)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">Holding ({setoran.holdingPercentage}%)</div>
                                                <div className="font-medium">{formatCurrency(setoran.calculatedAmount)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">Paid</div>
                                                <div className="font-medium text-green-600">{formatCurrency(setoran.paidAmount || 0)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">Remaining</div>
                                                <div className="font-medium text-yellow-600">{formatCurrency(setoran.calculatedAmount - (setoran.paidAmount || 0))}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Audit Log Tab */}
                    <TabsContent value="audit" className="mt-6">
                        <Card>
                            <CardContent className="pt-4">
                                <div className="space-y-2">
                                    {auditLog.map((log) => (
                                        <div key={log.id} className="flex items-center gap-4 p-2 rounded hover:bg-muted">
                                            <div className="text-xs text-muted-foreground w-40">
                                                {new Date(log.timestamp).toLocaleString("id-ID")}
                                            </div>
                                            <div className="font-medium w-24">{log.userName}</div>
                                            <div className="text-xs px-2 py-1 bg-primary/10 rounded">{log.action}</div>
                                            <div className="text-xs text-muted-foreground">{log.module}</div>
                                            <div className="flex-1 text-sm">{log.details}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="mt-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Revenue</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {revenues.slice(0, 3).map((rev) => (
                                        <div key={rev.id} className="flex justify-between py-2 border-b last:border-0">
                                            <span>{rev.source}</span>
                                            <span className="font-medium text-green-600">{formatCurrency(rev.amount)}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pending Tax</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {taxReports.filter(t => t.status !== "paid").map((tax) => (
                                        <div key={tax.id} className="flex justify-between py-2 border-b last:border-0">
                                            <span>{TAX_TYPE_LABELS[tax.type]}</span>
                                            <span className="font-medium text-yellow-600">{formatCurrency(tax.amount)}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </RoleGate>
        </div>
    );
}
