"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Division, DIVISION_LABELS, PanitiaRole } from "@/lib/event";

interface AssignPanitiaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAssign: (data: { email: string; division: Division; role: PanitiaRole }) => void;
    eventId: string;
}

export function AssignPanitiaDialog({ open, onOpenChange, onAssign }: AssignPanitiaDialogProps) {
    const [formData, setFormData] = useState({
        email: "",
        division: "acara" as Division,
        role: "anggota" as PanitiaRole,
    });

    const handleSubmit = () => {
        onAssign(formData);
        setFormData({ email: "", division: "acara", role: "anggota" });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Panitia</DialogTitle>
                    <DialogDescription>Add a new team member to this event</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="panitia@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="division">Division</Label>
                        <select
                            id="division"
                            value={formData.division}
                            onChange={(e) => setFormData({ ...formData, division: e.target.value as Division })}
                            className="w-full border rounded-md p-2"
                        >
                            {Object.entries(DIVISION_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <select
                            id="role"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as PanitiaRole })}
                            className="w-full border rounded-md p-2"
                        >
                            <option value="ketua">Ketua</option>
                            <option value="anggota">Anggota</option>
                        </select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!formData.email}>Assign</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AssignPanitiaDialog;
