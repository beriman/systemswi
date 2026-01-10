"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { SheetRow } from "@/lib/sheets";

interface EditRowDialogProps {
    row: SheetRow | null;
    headers: string[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (rowIndex: number, values: Record<string, string | number | boolean | null>) => void;
}

export function EditRowDialog({
    row,
    headers,
    open,
    onOpenChange,
    onSave,
}: EditRowDialogProps) {
    const [values, setValues] = useState<Record<string, string>>(
        row ? Object.fromEntries(
            Object.entries(row.values).map(([k, v]) => [k, String(v ?? "")])
        ) : {}
    );

    const handleSave = () => {
        if (row) {
            onSave(row.rowIndex, values);
            onOpenChange(false);
        }
    };

    if (!row) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Row #{row.rowIndex}</DialogTitle>
                    <DialogDescription>
                        Modify the values below and save changes
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {headers.map((header) => (
                        <div key={header} className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm font-medium">
                                {header}
                            </label>
                            <Input
                                value={values[header] || ""}
                                onChange={(e) => setValues({ ...values, [header]: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface AddRowDialogProps {
    headers: string[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (values: Record<string, string>) => void;
}

export function AddRowDialog({
    headers,
    open,
    onOpenChange,
    onAdd,
}: AddRowDialogProps) {
    const [values, setValues] = useState<Record<string, string>>({});

    const handleAdd = () => {
        onAdd(values);
        setValues({});
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Row</DialogTitle>
                    <DialogDescription>
                        Fill in the values for the new row
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {headers.map((header) => (
                        <div key={header} className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm font-medium">
                                {header}
                            </label>
                            <Input
                                value={values[header] || ""}
                                onChange={(e) => setValues({ ...values, [header]: e.target.value })}
                                className="col-span-3"
                                placeholder={`Enter ${header}`}
                            />
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleAdd}>
                        Add Row
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default EditRowDialog;
