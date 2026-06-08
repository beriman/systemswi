// Real data from Sensasi Hub (sensasi-hub.vercel.app)
import type { CompanyInfo, TeamMember, PortfolioItem, Product, UpcomingEvent } from "./types";

export const COMPANY_INFO: CompanyInfo = {
    name: "PT. Sensasi Wangi Indonesia",
    tagline: "Fragrance Ecosystem",
    description: "Sensasi Wangi Indonesia adalah functional holding company yang beroperasi di bidang events, digital platforms, dan fragrance production/incubation. Kami membangun ekosistem parfum Indonesia yang lengkap dari edukasi, produksi, hingga distribusi.",
    logo: "/logo-swi.png",
    address: "Jl. GADING KIRANA TIMUR A.11/15, Kelapa Gading Barat, Jakarta Utara",
    phone: "+62 811-855-6688",
    email: "sensasiwangi.id@gmail.com",
    instagram: "@sensasiwangi.id",
    whatsapp: "+62 811-855-6688",
    founded: 2021,
};

// Laboratory location
export const LABORATORY_ADDRESS = "Jl. Kutilang 2 Blok M5, Bintaro Sektor 2, Tangerang Selatan";

// Operating Hours
export const OPERATING_HOURS = {
    weekday: "Mon-Fri: 09:00 - 18:00 WIB",
    saturday: "Sat: 10:00 - 14:00 WIB",
    sunday: "Sun: Closed",
};

export const TEAM_MEMBERS: TeamMember[] = [
    {
        id: "1",
        name: "Beriman Juliano",
        role: "Chief Executive Officer (CEO)",
        photo: "/images/team/ceo.jpg",
        bio: "Leading strategic vision and company direction",
    },
    {
        id: "2",
        name: "Wapiq Rizya",
        role: "Chief Operating Officer (COO)",
        photo: "/images/team/coo.jpg",
        bio: "Managing operations across all business divisions",
    },
    {
        id: "3",
        name: "Muhamad Malsiaf",
        role: "Komisaris",
        photo: "/images/team/komisaris.jpg",
        bio: "Strategic oversight and governance",
    },
];

// Business Pillars
export const BUSINESS_PILLARS = {
    eventExperience: {
        name: "Event & Experience",
        items: [
            { name: "Fragrantions", description: "Main annual fragrance exhibition and talk show" },
            { name: "Workshop & Kelas", description: "Basic perfumery and advanced formulation" },
            { name: "B2B Event", description: "Corporate scent branding and private events" },
        ],
    },
    digitalPlatform: {
        name: "Digital & Platform",
        items: [
            { name: "SensasiWangi.id", description: "Premium fragrance marketplace" },
            { name: "Forum Komunitas", description: "Discussion space for perfume enthusiasts and perfumers" },
            { name: "Online Class", description: "Digital education platform for fragrance" },
        ],
    },
    productionBrands: {
        name: "Production & Brands",
        items: [
            { name: "R&D & Formulasi", description: "Laboratory services for scent development" },
            { name: "Produksi Parfum", description: "Manufacturing and distribution" },
            { name: "Brand Incubation", description: "Helping new fragrance brands launch" },
        ],
    },
};

// Brand Portfolio
export const BRAND_PORTFOLIO = [
    {
        id: "brand-1",
        name: "L'Arc~en~Scent",
        description: "Artisan perfumery specializing in high-end, complex French-style scents",
        category: "Premium",
        logo: "/images/brands/larcenscent.png",
    },
    {
        id: "brand-2",
        name: "Pixel Potion",
        description: "Energetic and unique scents inspired by Gamer and Pop Culture",
        category: "Youth",
        logo: "/images/brands/pixelpotion.png",
    },
    {
        id: "brand-3",
        name: "NUScentZa",
        description: "Artistic and affordable scents featuring Indonesian heritage (City Series and Heritage Collection)",
        category: "Heritage",
        logo: "/images/brands/nuscentza.png",
    },
];

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
    {
        id: "p1",
        title: "Road to Fragrantions Vol. 1",
        category: "exhibition",
        date: "2025-07-01",
        location: "Indonesia",
        description: "Road to Fragrantions pertama sebagai rangkaian pemanasan menuju acara utama Fragrantions 2025.",
        images: ["/images/portfolio/road-to-fragrantions-2025.jpg"],
    },
    {
        id: "p2",
        title: "Fragrantions 2025",
        category: "exhibition",
        date: "2025-11-01",
        location: "Indonesia",
        description: "Acara utama Fragrantions 2025 yang diselenggarakan pada November 2025.",
        images: ["/images/portfolio/fragrantions-2025.jpg"],
    },
    {
        id: "p3",
        title: "Road to Fragrantions 2026 Vol. 1",
        category: "exhibition",
        date: "2026-04-01",
        location: "Indonesia",
        description: "Road to Fragrantions 2026 Vol. 1 sebagai rangkaian menuju Fragrantions 2026.",
        images: ["/images/portfolio/road-to-fragrantions-2026-vol-1.jpg"],
    },
];

export const PRODUCTS: Product[] = [
    {
        id: "prod1",
        name: "Basic Perfumery Workshop",
        description: "Workshop dasar pembuatan parfum untuk pemula. Peserta akan belajar teori dasar parfum dan langsung praktik membuat parfum sendiri.",
        category: "event-organizer",
        image: "/images/products/workshop-basic.jpg",
        features: [
            "Teori dasar parfum & notes",
            "Pengenalan bahan baku",
            "Praktik membuat 3 parfum",
            "Sertifikat peserta",
            "Starter kit parfum",
        ],
        priceRange: "Rp 1.5jt - 2.5jt",
    },
    {
        id: "prod2",
        name: "Advanced Formulating Class",
        description: "Kelas lanjutan untuk yang ingin memperdalam formulasi parfum dengan teknik profesional.",
        category: "event-organizer",
        image: "/images/products/workshop-advanced.jpg",
        features: [
            "Advanced blending techniques",
            "Natural vs synthetic materials",
            "Formulation software",
            "Brand development guidance",
            "Industry networking",
        ],
        priceRange: "Rp 5jt - 8jt",
    },
    {
        id: "prod3",
        name: "R&D & Custom Formulation",
        description: "Layanan research & development untuk brand yang ingin mengembangkan signature scent.",
        category: "creative-services",
        image: "/images/products/rd-lab.jpg",
        features: [
            "Brief consultation",
            "Scent profiling",
            "3-5 formula iterations",
            "Stability testing",
            "Production-ready formula",
        ],
        priceRange: "Rp 15jt - 50jt",
    },
    {
        id: "prod4",
        name: "Event Booth & Exhibition",
        description: "Sewa booth dan partisipasi di event Fragrantions dan Road to Fragrantions series.",
        category: "venue",
        image: "/images/products/booth.jpg",
        features: [
            "Prime booth location",
            "Setup assistance",
            "Marketing exposure",
            "Community access",
            "Sales opportunity",
        ],
        priceRange: "Rp 5jt - 25jt",
    },
];

export const UPCOMING_EVENTS: UpcomingEvent[] = [
    {
        id: "ue1",
        name: "Road to Fragrantions 2026 Vol. 2",
        date: "2026-07-01",
        location: "Indonesia",
        description: "Next Road to Fragrantions 2026 Vol. 2, direncanakan Juli 2026.",
        image: "/images/events/road-to-fragrantions-2026-vol-2.jpg",
        registrationUrl: "https://instagram.com/fragrantions",
        isPublic: true,
    },
    {
        id: "ue2",
        name: "Fragrantions 2026",
        date: "2026-08-01",
        location: "Indonesia",
        description: "Acara utama Fragrantions 2026, estimasi antara Agustus atau November 2026.",
        image: "/images/events/fragrantions-2026.jpg",
        registrationUrl: "https://instagram.com/fragrantions",
        isPublic: true,
    },
];

// Helper functions
export function getPublicEvents(): UpcomingEvent[] {
    return UPCOMING_EVENTS.filter((e) => e.isPublic);
}

export function getPortfolioByCategory(category?: string): PortfolioItem[] {
    if (!category) return PORTFOLIO_ITEMS;
    return PORTFOLIO_ITEMS.filter((p) => p.category === category);
}

export function getProductsByCategory(category?: string): Product[] {
    if (!category) return PRODUCTS;
    return PRODUCTS.filter((p) => p.category === category);
}
