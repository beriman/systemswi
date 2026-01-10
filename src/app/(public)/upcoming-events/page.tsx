// Upcoming Events Page
import { getPublicEvents } from "@/lib/public";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EventsPage() {
    const events = getPublicEvents();

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Header */}
            <section className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Upcoming Events</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Event-event menarik yang akan datang
                </p>
            </section>

            {/* Events Grid */}
            <section className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => {
                    const eventDate = new Date(event.date);
                    const isUpcoming = eventDate > new Date();

                    return (
                        <Card key={event.id} className="overflow-hidden flex flex-col">
                            <div className="h-48 bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center relative">
                                <span className="text-6xl">🎪</span>
                                {isUpcoming && (
                                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                                        Coming Soon
                                    </div>
                                )}
                            </div>
                            <CardHeader>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                    <span>📅 {eventDate.toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}</span>
                                </div>
                                <CardTitle>{event.name}</CardTitle>
                                <CardDescription className="flex items-center gap-1">
                                    📍 {event.location}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <p className="text-sm text-muted-foreground flex-1">
                                    {event.description}
                                </p>
                                {event.registrationUrl && (
                                    <Link href={event.registrationUrl} target="_blank">
                                        <Button className="w-full mt-4">
                                            Register Now →
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </section>

            {events.length === 0 && (
                <div className="text-center py-12">
                    <span className="text-6xl">🎪</span>
                    <p className="text-muted-foreground mt-4">
                        Belum ada event yang upcoming. Stay tuned!
                    </p>
                </div>
            )}

            {/* CTA Section */}
            <section className="mt-16 text-center bg-primary/10 rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-4">Ingin Mengadakan Event?</h2>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                    Konsultasikan kebutuhan event Anda dengan tim profesional kami. Free consultation!
                </p>
                <Button size="lg">
                    💬 Hubungi Kami
                </Button>
            </section>
        </div>
    );
}
