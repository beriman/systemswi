import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investor Relations | Sensasi Wangi Indonesia",
  description: "Peluang investasi Sukuk Mikro Per Produk PT Sensasi Wangi Indonesia. Skema Musyarakah, nisbah 50:50, yield 8-12% p.a., minimum investasi Rp 1.000.000.",
  openGraph: {
    title: "Investor Relations — SWI",
    description: "Sukuk Mikro Per Produk. Investasi syariah dengan bagi hasil.",
  },
};

export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
