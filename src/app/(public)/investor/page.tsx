// Investor Relations Page — Sukuk Deck & Financial Projections
import Link from "next/link";
import { COMPANY_INFO, BRAND_PORTFOLIO, BUSINESS_PILLARS } from "@/lib/public";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Icon components
const TrendingUpIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const HandshakeIcon = () => (
  <svg className="w-16 h-16 mx-auto mb-6 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const sukukHighlights = [
  { label: "Akad", value: "Musyarakah", desc: "Kemitraan berdasarkan syariah Islam" },
  { label: "Nisbah", value: "50:50", desc: "Bagi hasil yang adil untuk investor & pengelola" },
  { label: "Minimum Investasi", value: "Rp 1.000.000", desc: "Terjangkau untuk semua kalangan" },
  { label: "Yield Estimasi", value: "8-12% p.a.", desc: "Berdasarkan proyeksi profit produk" },
  { label: "Tenor", value: "3 Tahun", desc: "Dengan pembayaran bagi hasil per kuartal" },
  { label: "Pembayaran", value: "Per Kuartal", desc: "Distribusi profit setiap 3 bulan" },
];

const businessMetrics = [
  { label: "Brand Portfolio", value: "3", suffix: "brand", desc: "L'Arc~en~Scent, Pixel Potion, Nuscentza" },
  { label: "Pilar Bisnis", value: "3", suffix: "divisi", desc: "Event, Digital, Production" },
  { label: "Event Series", value: "5+", suffix: "event", desc: "Fragrantions & Road to Fragrantions" },
  { label: "Produk Sukuk", value: "5", suffix: "produk", desc: "Batch 1 — T-Shirt, Tumbler, Candle, Tote Bag, Discovery Kit" },
];

const sukukProducts = [
  { name: "SWI T-Shirt Collection", category: "Apparel", target: "Rp 50.000.000", unitPrice: "Rp 250.000", units: 200, margin: "45%", status: "Batch 1" },
  { name: "SWI Tumbler Edition", category: "Lifestyle", target: "Rp 30.000.000", unitPrice: "Rp 150.000", units: 200, margin: "50%", status: "Batch 1" },
  { name: "SWI Scented Candle", category: "Home & Living", target: "Rp 20.000.000", unitPrice: "Rp 100.000", units: 200, margin: "55%", status: "Batch 1" },
  { name: "SWI Tote Bag", category: "Accessories", target: "Rp 15.000.000", unitPrice: "Rp 75.000", units: 200, margin: "48%", status: "Batch 1" },
  { name: "Perfume Discovery Kit", category: "Fragrance", target: "Rp 40.000.000", unitPrice: "Rp 200.000", units: 200, margin: "60%", status: "Batch 1" },
];

function InvestorCTA() {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      <a
        href={`https://wa.me/628118556688?text=${encodeURIComponent("Halo, saya tertarik dengan peluang investasi Sukuk Mikro Per Produk SWI. Mohon informasi lebih lanjut.")}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button size="lg" className="bg-white text-primary hover:bg-white/90">
          📱 Hubungi Tim Investor
        </Button>
      </a>
      <Link href="/sukuk">
        <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
          🪙 Lihat Produk Sukuk
        </Button>
      </Link>
    </div>
  );
}

function BottomCTA() {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      <a
        href={`https://wa.me/628118556688?text=${encodeURIComponent("Halo, saya tertarik dengan peluang investasi Sukuk Mikro Per Produk SWI. Mohon informasi lebih lanjut.")}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button size="lg" className="bg-white text-primary hover:bg-white/90">
          📱 WhatsApp Tim Investor
        </Button>
      </a>
      <Link href="/about">
        <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
          ℹ️ Tentang SWI
        </Button>
      </Link>
      <Link href="/portfolio">
        <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
          🎉 Lihat Portfolio Event
        </Button>
      </Link>
    </div>
  );
}

export default function InvestorPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="gradient-hero text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/30">
            📈 Investor Relations
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Investasi Syariah
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-2">
            Sukuk Mikro Per Produk — Skema Musyarakah dengan Bagi Hasil Adil
          </p>
          <p className="text-base text-white/70 max-w-2xl mx-auto mb-8">
            PT Sensasi Wangi Indonesia membuka peluang investasi syariah untuk semua kalangan.
            Minimum Rp 1.000.000, nisbah 50:50, yield estimasi 8-12% p.a.
          </p>
          <InvestorCTA />
        </div>
      </section>

      {/* Sukuk Highlights */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-primary">Ringkasan Sukuk</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sukuk Mikro Per Produk SWI menggunakan akad Musyarakah (kemitraan) dengan bagi hasil yang transparan dan sesuai prinsip syariah Islam.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
            {sukukHighlights.map((item) => (
              <Card key={item.label} className="text-center hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-primary mb-1">{item.value}</div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Business Overview */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-primary">Overview Bisnis</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              SWI adalah functional holding company yang membangun ekosistem wewangian Nusantara secara terintegrasi.
            </p>
          </div>

          {/* Metrics */}
          <div className="grid gap-6 md:grid-cols-4 mb-16">
            {businessMetrics.map((m) => (
              <Card key={m.label} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-primary mb-1">{m.value}<span className="text-base text-muted-foreground ml-1">{m.suffix}</span></div>
                  <div className="text-sm font-medium mb-1">{m.label}</div>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Business Pillars */}
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { pillar: BUSINESS_PILLARS.eventExperience, icon: <TrendingUpIcon />, color: "from-amber-500 to-orange-500" },
              { pillar: BUSINESS_PILLARS.digitalPlatform, icon: <ChartIcon />, color: "from-indigo-500 to-purple-500" },
              { pillar: BUSINESS_PILLARS.productionBrands, icon: <ShieldIcon />, color: "from-emerald-500 to-teal-500" },
            ].map(({ pillar, icon, color }) => (
              <Card key={pillar.name} className="overflow-hidden">
                <div className={`bg-gradient-to-br ${color} p-6 flex items-center gap-4`}>
                  {icon}
                  <h3 className="text-xl font-bold text-white">{pillar.name}</h3>
                </div>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    {pillar.items.map((item) => (
                      <li key={item.name} className="flex items-start gap-3">
                        <span className="text-primary mt-0.5">✦</span>
                        <div>
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Portfolio */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-primary">Portfolio Brand</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tiga brand parfum dengan positioning unik yang mencakup segmen premium, youth, dan heritage Nusantara.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {BRAND_PORTFOLIO.map((brand) => (
              <Card key={brand.id} className="hover:border-primary/50 transition-colors overflow-hidden">
                <div className="h-3 bg-gradient-to-r from-primary/80 to-primary" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{brand.name}</CardTitle>
                    <Badge variant="secondary">{brand.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{brand.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sukuk Products Table */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-primary">Produk Sukuk Batch 1</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Lima produk pilihan dengan margin sehat 45-60%. Setiap produk dikelola secara terpisah dengan laporan transparan.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold">Produk</th>
                  <th className="text-left p-4 font-semibold">Kategori</th>
                  <th className="text-right p-4 font-semibold">Target Dana</th>
                  <th className="text-right p-4 font-semibold">Harga Jual</th>
                  <th className="text-right p-4 font-semibold">Unit</th>
                  <th className="text-right p-4 font-semibold">Est. Margin</th>
                  <th className="text-center p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {sukukProducts.map((p) => (
                  <tr key={p.name} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{p.name}</td>
                    <td className="p-4 text-muted-foreground">{p.category}</td>
                    <td className="p-4 text-right font-mono">{p.target}</td>
                    <td className="p-4 text-right font-mono">{p.unitPrice}</td>
                    <td className="p-4 text-right">{p.units}</td>
                    <td className="p-4 text-right text-green-600 font-medium">{p.margin}</td>
                    <td className="p-4 text-center">
                      <Badge variant="outline" className="border-primary/30 text-primary">{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 p-4 rounded-lg border bg-muted/30 text-sm text-muted-foreground">
            <strong>Catatan:</strong> Target dana, harga jual, dan margin bersifat estimasi berdasarkan riset pasar dan proyeksi biaya produksi. Hasil aktual dapat berbeda. Distribusi bagi hasil dihitung dari profit bersih setelah dikurangi biaya operasional.
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-primary">Cara Kerja Investasi</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Proses investasi yang sederhana, transparan, dan sesuai prinsip syariah.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { step: "1", title: "Registrasi", desc: "Daftar sebagai investor dan lengkapi verifikasi KYC.", icon: "📝" },
              { step: "2", title: "Pilih Produk", desc: "Pilih produk sukuk yang sesuai dengan profil risiko Anda.", icon: "🎯" },
              { step: "3", title: "Setor Dana", desc: "Lakukan penyetoran minimal Rp 1.000.000 per produk.", icon: "💳" },
              { step: "4", title: "Terima Bagi Hasil", desc: "Profit dibagikan per kuartal sesuai nisbah 50:50.", icon: "📊" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                  {s.icon}
                </div>
                <div className="text-xs text-primary font-bold mb-1">Langkah {s.step}</div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Disclosure */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldIcon /> Pemberitahuan Risiko
              </CardTitle>
              <CardDescription>
                Harap dibaca sebelum berinvestasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Risiko Pasar:</strong> Harga bahan baku dan biaya produksi dapat berfluktuasi, yang mempengaruhi margin profit dan jumlah bagi hasil.
              </p>
              <p>
                <strong className="text-foreground">Risiko Likuiditas:</strong> Sukuk ini tidak dapat diperdagangkan di pasar sekunder. Investor harus menahan hingga tenor berakhir.
              </p>
              <p>
                <strong className="text-foreground">Risiko Usaha:</strong> Kinerja bisnis SWI dapat dipengaruhi oleh faktor-faktor di luar kendali, termasuk kondisi ekonomi dan persaingan pasar.
              </p>
              <p>
                <strong className="text-foreground">Tidak Dijamin:</strong> Investasi ini tidak dijamin oleh lembaga penjamin simpanan manapun. Bagi hasil bersifat estimasi dan tidak merupakan jaminan.
              </p>
              <p>
                <strong className="text-foreground">Kepatuhan Syariah:</strong> Struktur akad Musyarakah telah dirancang sesuai prinsip syariah Islam. Fatwa resmi sedang dalam proses pengurusan.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <HandshakeIcon />
          <h2 className="text-3xl font-bold mb-4 mt-6">Siap Berinvestasi?</h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Hubungi tim Investor Relations kami untuk informasi lebih lanjut, prospektus lengkap, dan konsultasi investasi syariah.
          </p>
          <BottomCTA />
          <div className="mt-8 text-sm text-white/60">
            <p>PT Sensasi Wangi Indonesia | {COMPANY_INFO.address}</p>
            <p>Email: {COMPANY_INFO.email} | WhatsApp: {COMPANY_INFO.whatsapp}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
