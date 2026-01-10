"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RABItem } from "@/lib/event";

interface RABTableProps {
    items: RABItem[];
    onApprove?: (id: string) => void;
    onEdit?: (item: RABItem) => void;
}

// Mock RAB data
const mockRABItems: RABItem[] = [
    { id: "rab-1", eventId: "evt-001", category: "Venue", item: "Sewa Hall", quantity: 3, unitPrice: 5000000, totalPrice: 15000000, status: "approved" },
    { id: "rab-2", eventId: "evt-001", category: "Catering", item: "Makan Siang", quantity: 500, unitPrice: 50000, totalPrice: 25000000, status: "planned" },
    { id: "rab-3", eventId: "evt-001", category: "Dekorasi", item: "Backdrop", quantity: 1, unitPrice: 3000000, totalPrice: 3000000, status: "approved" },
    { id: "rab-4", eventId: "evt-001", category: "Equipment", item: "Sound System", quantity: 1, unitPrice: 2000000, totalPrice: 2000000, status: "purchased" },
];

export function RABTable({ items = mockRABItems, onApprove, onEdit }: RABTableProps) {
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const getStatusBadge = (status: RABItem["status"]) => {
        const colors = {
            planned: "bg-gray-500/20 text-gray-500",
            approved: "bg-green-500/20 text-green-500",
            purchased: "bg-blue-500/20 text-blue-500",
            cancelled: "bg-red-500/20 text-red-500",
        };
        return <span className={`text-xs px-2 py-1 rounded ${colors[status]}`}>{status}</span>;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>💰 RAB (Rencana Anggaran Biaya)</span>
                    <span className="text-sm font-normal">
                        Total: Rp {(total / 1000000).toFixed(1)}jt
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2">Category</th>
                                <th className="text-left p-2">Item</th>
                                <th className="text-right p-2">Qty</th>
                                <th className="text-right p-2">Unit Price</th>
                                <th className="text-right p-2">Total</th>
                                <th className="text-center p-2">Status</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-b hover:bg-accent/50">
                                    <td className="p-2">{item.category}</td>
                                    <td className="p-2">{item.item}</td>
                                    <td className="p-2 text-right">{item.quantity}</td>
                                    <td className="p-2 text-right">Rp {item.unitPrice.toLocaleString("id-ID")}</td>
                                    <td className="p-2 text-right font-medium">Rp {item.totalPrice.toLocaleString("id-ID")}</td>
                                    <td className="p-2 text-center">{getStatusBadge(item.status)}</td>
                                    <td className="p-2">
                                        <div className="flex gap-1">
                                            {item.status === "planned" && onApprove && (
                                                <Button size="sm" variant="outline" onClick={() => onApprove(item.id)}>Approve</Button>
                                            )}
                                            {onEdit && (
                                                <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>Edit</Button>
                                            )}
                                        </div>
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

export default RABTable;
