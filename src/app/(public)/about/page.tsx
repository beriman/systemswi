// About Page with enhanced design from prototype
import { Metadata } from "next";
import { COMPANY_INFO, TEAM_MEMBERS, LABORATORY_ADDRESS } from "@/lib/public";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Tentang Kami | Sensasi Wangi Indonesia",
    description: "PT Sensasi Wangi Indonesia - Membangun Ekosistem Wewangian Utama di Indonesia. Visi, Misi, Tim, dan Nilai-nilai kami.",
    openGraph: {
        title: "Tentang Sensasi Wangi Indonesia",
        description: "Membangun Ekosistem Wewangian Utama di Indonesia",
    },
};

// Icon components
const EyeIcon = () => (
    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const TargetIcon = () => (
    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const UsersIcon = () => (
    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

export default function AboutPage() {
    const yearsInBusiness = new Date().getFullYear() - COMPANY_INFO.founded;

    return (
        <div className="flex flex-col">
            {/* Hero */}
            <section className="gradient-hero text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Tentang SWI</h1>
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                        PT Sensasi Wangi Indonesia - Membangun Ekosistem Wewangian Utama di Indonesia
                    </p>
                </div>
            </section>

            {/* Company Story & Ideology */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4 max-w-4xl text-center md:text-left">
                    <h2 className="text-3xl font-bold mb-8 text-center text-primary">Filosofi & Jati Diri</h2>

                    <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-foreground mb-2">Dimana Kita Berada?</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Kita hidup di surga aroma, namun ironisnya <strong>terjebak dalam ketergantungan</strong>. Bahan baku kita diekspor murah, lalu kita membelinya kembali sebagai produk jadi dengan biaya mahal. Kita belum menjadi tuan di rumah sendiri.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground mb-2">Mengapa Kita Ada?</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Sensasi Wangi Indonesia lahir dengan <strong>spirit perlawanan</strong> terhadap status quo. Kita ada untuk memutus rantai ketergantungan dan membangun struktur ekonomi wewangian baru yang berdikari, efisien, dan mensejahterakan semua.
                                </p>
                            </div>
                        </div>
                        <div className="bg-muted/30 p-8 rounded-2xl border border-border/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
                            <div className="relative z-10">
                                <h3 className="font-bold text-lg mb-4 text-foreground text-center">Legalitas & Identitas</h3>
                                <ul className="space-y-3 text-sm text-left">
                                    <li className="flex justify-between border-b border-border/50 pb-2">
                                        <span className="text-muted-foreground">Badan Hukum</span>
                                        <span className="font-medium">PT Sensasi Wangi Indonesia</span>
                                    </li>
                                    <li className="flex justify-between border-b border-border/50 pb-2">
                                        <span className="text-muted-foreground">Akta Pendirian</span>
                                        <span className="font-medium">No. 61 (06/10/2023)</span>
                                    </li>
                                    <li className="flex justify-between border-b border-border/50 pb-2">
                                        <span className="text-muted-foreground">Notaris</span>
                                        <span className="font-medium truncate max-w-[150px]" title="EKA ASTRI MAERISA, SH., MH., M.Kn">Eka Astri Maerisa, SH...</span>
                                    </li>
                                    <li className="pt-2">
                                        <span className="block text-muted-foreground text-xs mb-1">Bidang Usaha (KBLI)</span>
                                        <span className="font-medium block">Kosmetik, Event Khusus, Bahan Kimia, Pelatihan Kerja</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="text-center max-w-3xl mx-auto">
                            <h3 className="text-2xl font-bold mb-4">Cita-Cita Besar Kami</h3>
                            <p className="text-lg text-muted-foreground">
                                &ldquo;Menjadi arsitek utama kemandirian wewangian Indonesia, merancang masa depan dimana kekayaan Nusantara menjadi tuan rumah yang berdaulat dan disegani dunia.&rdquo;
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Vision & Mission Cards */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                        {/* Vision Card - The Role */}
                        <Card className="shadow-elegant border-none h-full relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <CardHeader>
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                                    <EyeIcon />
                                </div>
                                <CardTitle className="text-2xl mb-2">Visi & Peran</CardTitle>
                                <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">The Sovereign Architect</p>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg text-foreground mb-6 font-medium">
                                    Merancang dan membangun fondasi ekosistem wewangian yang mandiri.
                                </p>
                                <p className="text-muted-foreground leading-relaxed">
                                    Kami mengambil peran strategis sebagai <strong>arsitek</strong> yang menyusun ulang tata kelola industri. Dari hulu (petani) hingga hilir (brand), kami menjahit setiap elemen yang terpisah menjadi kekuatan kolektif yang tak tergoyahkan.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Mission Card - The Output */}
                        <Card className="shadow-elegant border-none h-full relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <CardHeader>
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
                                    <TargetIcon />
                                </div>
                                <CardTitle className="text-2xl mb-2">Misi & Pencapaian</CardTitle>
                                <p className="text-sm font-medium text-amber-600 uppercase tracking-wider">Concrete Outcomes</p>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-4 text-muted-foreground">
                                    <li className="flex items-start">
                                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3 mt-0.5 shrink-0 text-sm font-bold">1</div>
                                        <span><strong>Ekosistem Terintegrasi:</strong> Mengorkestrasi industri wewangian dari hulu (agrikultur) hingga hilir (ritel & edukasi) sebagai satu kesatuan.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3 mt-0.5 shrink-0 text-sm font-bold">2</div>
                                        <span><strong>Kedaulatan Inovasi:</strong> Menegakkan kemandirian bangsa melalui penguasaan teknologi dan riset mendalam.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3 mt-0.5 shrink-0 text-sm font-bold">3</div>
                                        <span><strong>Warisan Nusantara:</strong> Mengangkat kekayaan biodiversitas lokal ke panggung global sebagai tuan rumah yang bermartabat.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3 mt-0.5 shrink-0 text-sm font-bold">4</div>
                                        <span><strong>Standar Peradaban:</strong> Menjadi teladan integritas & pusat rujukan (Center of Excellence) wewangian dunia.</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Management Team */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-16 text-center">Tim Kepemimpinan</h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {TEAM_MEMBERS.map((member, index) => {
                            const gradients = [
                                "from-purple-500 to-pink-600",
                                "from-blue-500 to-indigo-600",
                                "from-amber-500 to-orange-600",
                            ];
                            return (
                                <Card key={member.id} className="text-center hover:shadow-elegant transition-smooth border-none shadow-md">
                                    <CardHeader className="pb-2">
                                        <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${gradients[index % 3]} mx-auto mb-6 flex items-center justify-center shadow-inner`}>
                                            <UsersIcon />
                                        </div>
                                        <CardTitle className="text-xl mb-1">{member.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{member.role}</p>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground text-sm">
                                            {member.bio}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-12 text-center">Nilai-Nilai Inti</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        {[
                            { title: "Kualitas Tinggi", desc: "Komitmen pada standar tertinggi dalam setiap produk dan layanan" },
                            { title: "Inovasi & Kreativitas", desc: "Terus berinovasi dan mendorong kreativitas dalam industri wewangian" },
                            { title: "Keberagaman & Keterbukaan", desc: "Menghargai keberagaman dan terbuka terhadap ide-ide baru" },
                            { title: "Integritas", desc: "Beroperasi dengan kejujuran dan transparansi penuh" },
                            { title: "Pelayanan Pelanggan", desc: "Mengutamakan kepuasan dan pengalaman pelanggan" },
                            { title: "Tanggung Jawab Sosial", desc: "Berkontribusi positif bagi masyarakat dan lingkungan" },
                            { title: "Komitmen terhadap Keunggulan", desc: "Selalu berusaha mencapai yang terbaik dalam segala hal" },
                        ].map((value, index) => (
                            <Card key={index} className="border-none shadow-sm hover:shadow-md transition-smooth">
                                <CardHeader>
                                    <CardTitle className="text-lg">{value.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{value.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Locations */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-12 text-center">Lokasi Kami</h2>
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <Card className="shadow-elegant border-none">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    Kantor Pusat
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Jl. GADING KIRANA TIMUR A.11/15<br />
                                    Kelapa Gading Barat<br />
                                    Jakarta Utara
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-elegant border-none">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                                    Laboratorium & Pabrik
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    {LABORATORY_ADDRESS.split(",")[0]}<br />
                                    {LABORATORY_ADDRESS.split(",").slice(1).join(",")}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Holding Structure */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-6 text-center">Struktur Holding Kami</h2>
                    <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-16 text-lg">
                        SWI beroperasi sebagai holding fungsional dengan fungsi pendukung terpusat (Keuangan, Legal, SDM, R&D) yang melayani tiga divisi bisnis yang berbeda:
                    </p>
                    <div className="max-w-4xl mx-auto">
                        <Card className="p-8 shadow-elegant border-none">
                            <div className="space-y-8">
                                <div className="flex items-start space-x-6 group">
                                    <div className="shrink-0 w-12 h-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xl shadow-md group-hover:scale-110 transition-transform">
                                        1
                                    </div>
                                    <div className="pt-1">
                                        <h3 className="text-xl font-bold mb-2 text-primary">Divisi Event & Experience</h3>
                                        <p className="text-muted-foreground">Workshop, kelas, acara B2B, dan pemasaran eksperiensial</p>
                                    </div>
                                </div>
                                <div className="w-full h-px bg-border"></div>
                                <div className="flex items-start space-x-6 group">
                                    <div className="shrink-0 w-12 h-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xl shadow-md group-hover:scale-110 transition-transform">
                                        2
                                    </div>
                                    <div className="pt-1">
                                        <h3 className="text-xl font-bold mb-2 text-primary">Divisi Digital & Platform</h3>
                                        <p className="text-muted-foreground">sensasiwangi.id, platform SaaS masa depan seperti Scentrium</p>
                                    </div>
                                </div>
                                <div className="w-full h-px bg-border"></div>
                                <div className="flex items-start space-x-6 group">
                                    <div className="shrink-0 w-12 h-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xl shadow-md group-hover:scale-110 transition-transform">
                                        3
                                    </div>
                                    <div className="pt-1">
                                        <h3 className="text-xl font-bold mb-2 text-primary">Divisi Production & Sales</h3>
                                        <p className="text-muted-foreground">Manufaktur dan penjualan brand L&apos;Arc~en~Scent, Pixel Potion, dan Nuscentza</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-16 bg-primary text-primary-foreground">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold mb-8">Hubungi Kami</h2>
                    <div className="grid gap-6 md:grid-cols-3 max-w-2xl mx-auto">
                        <a href={`mailto:${COMPANY_INFO.email}`} className="hover:opacity-80 transition-opacity">
                            <span className="text-3xl block mb-2">📧</span>
                            <p className="text-sm">{COMPANY_INFO.email}</p>
                        </a>
                        <a href={`https://wa.me/${COMPANY_INFO.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="hover:opacity-80 transition-opacity">
                            <span className="text-3xl block mb-2">📱</span>
                            <p className="text-sm">{COMPANY_INFO.whatsapp}</p>
                        </a>
                        <a href={`https://instagram.com/${COMPANY_INFO.instagram.replace("@", "")}`} target="_blank" rel="noopener" className="hover:opacity-80 transition-opacity">
                            <span className="text-3xl block mb-2">📸</span>
                            <p className="text-sm">{COMPANY_INFO.instagram}</p>
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
