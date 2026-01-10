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
import type { Event, EventStatus } from "@/lib/event";

interface CreateEventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (event: Partial<Event>) => void;
}

export function CreateEventDialog({ open, onOpenChange, onSubmit }: CreateEventDialogProps) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        date: "",
        endDate: "",
        location: "",
        budget: "",
        estimatedParticipants: "",
    });

    const handleSubmit = () => {
        const event: Partial<Event> = {
            name: formData.name,
            description: formData.description,
            date: formData.date,
            endDate: formData.endDate || undefined,
            location: formData.location,
            budget: Number(formData.budget) || 0,
            estimatedParticipants: Number(formData.estimatedParticipants) || 0,
            status: "draft" as EventStatus,
            spentBudget: 0,
        };
        onSubmit(event);
        setFormData({ name: "", description: "", date: "", endDate: "", location: "", budget: "", estimatedParticipants: "" });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                        Fill in the event details below
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Event Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Wedding Expo 2026"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Start Date *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location *</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g. Jakarta"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="budget">Budget (Rp)</Label>
                            <Input
                                id="budget"
                                type="number"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                placeholder="50000000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="participants">Est. Participants</Label>
                            <Input
                                id="participants"
                                type="number"
                                value={formData.estimatedParticipants}
                                onChange={(e) => setFormData({ ...formData, estimatedParticipants: e.target.value })}
                                placeholder="100"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!formData.name || !formData.date || !formData.location}>
                        Create Event
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default CreateEventDialog;
