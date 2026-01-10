// About Page with SEO metadata
import { Metadata } from "next";
import { COMPANY_INFO, TEAM_MEMBERS, generateAboutMetadata } from "@/lib/public";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = generateAboutMetadata();

export default function AboutPage() {
    const yearsInBusiness = new Date().getFullYear() - COMPANY_INFO.founded;

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Hero Section */}
            <section className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">{COMPANY_INFO.name}</h1>
                <p className="text-xl text-primary mb-4">{COMPANY_INFO.tagline}</p>
                <p className="text-muted-foreground max-w-3xl mx-auto">
                    {COMPANY_INFO.description}
                </p>
            </section>

            {/* Stats */}
            <section className="grid gap-4 md:grid-cols-4 mb-16">
                <Card className="text-center p-6">
                    <CardContent className="pt-4">
                        <div className="text-4xl font-bold text-primary">{yearsInBusiness}+</div>
                        <div className="text-sm text-muted-foreground">Tahun Pengalaman</div>
                    </CardContent>
                </Card>
                <Card className="text-center p-6">
                    <CardContent className="pt-4">
                        <div className="text-4xl font-bold text-primary">100+</div>
                        <div className="text-sm text-muted-foreground">Event Sukses</div>
                    </CardContent>
                </Card>
                <Card className="text-center p-6">
                    <CardContent className="pt-4">
                        <div className="text-4xl font-bold text-primary">50+</div>
                        <div className="text-sm text-muted-foreground">Klien Puas</div>
                    </CardContent>
                </Card>
                <Card className="text-center p-6">
                    <CardContent className="pt-4">
                        <div className="text-4xl font-bold text-primary">20+</div>
                        <div className="text-sm text-muted-foreground">Tim Profesional</div>
                    </CardContent>
                </Card>
            </section>

            {/* Team Section */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold text-center mb-8">Tim Kami</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {TEAM_MEMBERS.map((member) => (
                        <Card key={member.id} className="text-center overflow-hidden">
                            <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                {/* Placeholder avatar */}
                                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-4xl">
                                    {member.name.charAt(0)}
                                </div>
                            </div>
                            <CardContent className="pt-4">
                                <h3 className="font-semibold">{member.name}</h3>
                                <p className="text-sm text-primary">{member.role}</p>
                                {member.bio && (
                                    <p className="text-xs text-muted-foreground mt-2">{member.bio}</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Contact Section */}
            <section className="bg-muted rounded-lg p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Hubungi Kami</h2>
                <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto">
                    <a href={`mailto:${COMPANY_INFO.email}`} className="hover:text-primary transition-colors">
                        <span className="text-2xl">📧</span>
                        <p className="text-sm mt-2">{COMPANY_INFO.email}</p>
                    </a>
                    <a href={`https://wa.me/${COMPANY_INFO.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="hover:text-primary transition-colors">
                        <span className="text-2xl">📱</span>
                        <p className="text-sm mt-2">{COMPANY_INFO.whatsapp}</p>
                    </a>
                    <a href={`https://instagram.com/${COMPANY_INFO.instagram.replace("@", "")}`} target="_blank" rel="noopener" className="hover:text-primary transition-colors">
                        <span className="text-2xl">📸</span>
                        <p className="text-sm mt-2">{COMPANY_INFO.instagram}</p>
                    </a>
                </div>
                <p className="text-sm text-muted-foreground mt-6">
                    📍 {COMPANY_INFO.address}
                </p>
            </section>
        </div>
    );
}
