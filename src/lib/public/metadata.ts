import { Metadata } from "next";

// SEO metadata for public pages
export const siteMetadata: Metadata = {
    title: {
        default: "Sensasi Wangi Indonesia | Event Organizer Profesional",
        template: "%s | Sensasi Wangi Indonesia",
    },
    description: "Event organizer profesional di Jakarta. Wedding, corporate event, music festival, exhibition. Creating unforgettable moments since 2021.",
    keywords: ["event organizer", "wedding organizer", "jakarta", "Indonesia", "corporate event", "music festival"],
    authors: [{ name: "PT. Sensasi Wangi Indonesia" }],
    creator: "PT. Sensasi Wangi Indonesia",
    openGraph: {
        type: "website",
        locale: "id_ID",
        url: "https://sensasiwangi.id",
        siteName: "Sensasi Wangi Indonesia",
        title: "Sensasi Wangi Indonesia | Event Organizer Profesional",
        description: "Creating Unforgettable Moments. Wedding, corporate event, music festival, exhibition.",
        images: [
            {
                url: "/images/og-image.jpg",
                width: 1200,
                height: 630,
                alt: "Sensasi Wangi Indonesia",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Sensasi Wangi Indonesia | Event Organizer Profesional",
        description: "Creating Unforgettable Moments. Wedding, corporate event, music festival, exhibition.",
        images: ["/images/og-image.jpg"],
    },
    robots: {
        index: true,
        follow: true,
    },
};

// Page-specific metadata generators
export function generateAboutMetadata(): Metadata {
    return {
        title: "Tentang Kami",
        description: "Kenali tim profesional di balik Sensasi Wangi Indonesia. Event organizer berpengalaman 5+ tahun.",
        openGraph: {
            title: "Tentang Kami | Sensasi Wangi Indonesia",
            description: "Kenali tim profesional di balik Sensasi Wangi Indonesia.",
        },
    };
}

export function generatePortfolioMetadata(): Metadata {
    return {
        title: "Portfolio",
        description: "Lihat portfolio event yang telah kami selenggarakan. Wedding, corporate, music festival, dan exhibition.",
        openGraph: {
            title: "Portfolio | Sensasi Wangi Indonesia",
            description: "Portfolio event wedding, corporate, music festival, dan exhibition.",
        },
    };
}

export function generateProductsMetadata(): Metadata {
    return {
        title: "Layanan Kami",
        description: "Layanan event organizer lengkap: wedding package, corporate event, media production, creative services.",
        openGraph: {
            title: "Layanan | Sensasi Wangi Indonesia",
            description: "Layanan event organizer profesional di Jakarta.",
        },
    };
}

export function generateEventsMetadata(): Metadata {
    return {
        title: "Upcoming Events",
        description: "Event-event menarik yang akan datang. Daftar sekarang dan jangan sampai ketinggalan!",
        openGraph: {
            title: "Upcoming Events | Sensasi Wangi Indonesia",
            description: "Event-event menarik yang akan datang.",
        },
    };
}
