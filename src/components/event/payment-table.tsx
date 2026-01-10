"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentRecord } from "@/lib/event";

interface PaymentTableProps {
    payments: PaymentRecord[];
    onVerify?: (id: string) => void;
}

// Mock payment data
const mockPayments: PaymentRecord[] = [
    { id: "pay-1", eventId: "evt-001", panitiaId: "pan-001", amount: 500000, description: "Transport panitia", status: "verified", paidAt: "2026-01-05", verifiedAt: "2026-01-06" },
    { id: "pay-2", eventId: "evt-001", panitiaId: "pan-002", amount: 750000, description: "Uang makan 3 hari", status: "paid", paidAt: "2026-01-08" },
    { id: "pay-3", eventId: "evt-001", panitiaId: "pan-003", amount: 300000, description: "Transport dokumentasi", status: "pending" },
];

export function PaymentTable({ payments = mockPayments, onVerify }: PaymentTableProps) {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const verified = payments.filter((p) => p.status === "verified").reduce((sum, p) => sum + p.amount, 0);

    const getStatusStyle = (status: PaymentRecord["status"]) => {
        switch (status) {
            case "verified": return "bg-green-500/20 text-green-500";
            case "paid": return "bg-blue-500/20 text-blue-500";
            case "pending": return "bg-yellow-500/20 text-yellow-500";
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>💸 Payment Tracking</span>
                    <div className="text-sm font-normal space-x-4">
                        <span>Total: Rp {total.toLocaleString("id-ID")}</span>
                        <span className="text-green-500">Verified: Rp {verified.toLocaleString("id-ID")}</span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2">Description</th>
                                <th className="text-right p-2">Amount</th>
                                <th className="text-center p-2">Status</th>
                                <th className="text-left p-2">Paid At</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment.id} className="border-b hover:bg-accent/50">
                                    <td className="p-2">{payment.description}</td>
                                    <td className="p-2 text-right font-medium">Rp {payment.amount.toLocaleString("id-ID")}</td>
                                    <td className="p-2 text-center">
                                        <span className={`text-xs px-2 py-1 rounded ${getStatusStyle(payment.status)}`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="p-2 text-muted-foreground">
                                        {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("id-ID") : "-"}
                                    </td>
                                    <td className="p-2">
                                        {payment.status === "paid" && onVerify && (
                                            <Button size="sm" variant="outline" onClick={() => onVerify(payment.id)}>
                                                Verify
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

export default PaymentTable;
