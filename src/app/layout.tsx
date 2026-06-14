import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://systemswi.vercel.app"),
  title: {
    default: "Sensasi Wangi Indonesia | Fragrance Ecosystem",
    template: "%s | Sensasi Wangi Indonesia",
  },
  description:
    "PT Sensasi Wangi Indonesia membangun ekosistem wewangian Nusantara: brand parfum, Fragrantions, store experience, produksi, dan sistem operasional perusahaan.",
  keywords: [
    "Sensasi Wangi Indonesia",
    "systemswi",
    "parfum Indonesia",
    "fragrance ecosystem",
    "Fragrantions",
    "brand parfum",
    "workshop parfum",
  ],
  authors: [{ name: "PT Sensasi Wangi Indonesia" }],
  creator: "PT Sensasi Wangi Indonesia",
  publisher: "PT Sensasi Wangi Indonesia",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://systemswi.vercel.app",
    siteName: "Sensasi Wangi Indonesia",
    title: "Sensasi Wangi Indonesia | Fragrance Ecosystem",
    description:
      "Rumah bagi brand parfum, Fragrantions, komunitas kreator aroma, dan operational command center SWI.",
    images: [
      {
        url: "/images/swi/logosensasiwangi.png",
        width: 1200,
        height: 630,
        alt: "Logo Sensasi Wangi Indonesia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sensasi Wangi Indonesia | Fragrance Ecosystem",
    description:
      "Brand parfum, Fragrantions, store experience, dan systemswi operational dashboard dalam satu ekosistem.",
    images: ["/images/swi/logosensasiwangi.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
