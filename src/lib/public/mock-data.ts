// Real data from Sensasi Hub (sensasi-hub.vercel.app)
import type { CompanyInfo, TeamMember, PortfolioItem, Product, UpcomingEvent } from "./types";

export const COMPANY_INFO: CompanyInfo = {
    name: "PT. Sensasi Wangi Indonesia",
    tagline: "Fragrance Ecosystem",
    description: "Sensasi Wangi Indonesia adalah functional holding company yang beroperasi di bidang events, digital platforms, dan fragrance production/incubation. Kami membangun ekosistem parfum Indonesia yang lengkap dari edukasi, produksi, hingga distribusi.",
    logo: "/images/logo.png",
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
        title: "Fragrantions 2025",
        category: "exhibition",
        date: "2025-10-15",
        location: "Jakarta Convention Center",
        description: "Annual fragrance exhibition dan talk show terbesar di Indonesia dengan 50+ brand lokal dan internasional.",
        images: ["/images/portfolio/fragrantions.jpg"],
        participants: 5000,
    },
    {
        id: "p2",
        title: "Road to Fragrantions - Bandung",
        category: "exhibition",
        date: "2025-08-20",
        location: "Bandung",
        description: "Pop-up market, mini-workshop, dan community gathering sebagai bagian dari Road to Fragrantions series.",
        images: ["/images/portfolio/rtf-bandung.jpg"],
        participants: 500,
    },
    {
        id: "p3",
        title: "Road to Fragrantions - Surabaya",
        category: "exhibition",
        date: "2025-09-10",
        location: "Surabaya",
        description: "Pop-up market dan workshop di Surabaya sebagai bagian dari perjalanan menuju Fragrantions.",
        images: ["/images/portfolio/rtf-surabaya.jpg"],
        participants: 400,
    },
    {
        id: "p4",
        title: "Corporate Scent Branding - Bank XYZ",
        category: "corporate",
        date: "2025-07-15",
        location: "Jakarta",
        description: "Custom scent development untuk corporate branding Bank XYZ di seluruh cabang nasional.",
        images: ["/images/portfolio/corporate-scent.jpg"],
        client: "Bank XYZ",
    },
    {
        id: "p5",
        title: "Basic Perfumery Workshop Batch 12",
        category: "other",
        date: "2025-11-05",
        location: "Lab Bintaro, Tangerang Selatan",
        description: "Workshop dasar pembuatan parfum dengan hands-on experience membuat 3 jenis parfum.",
        images: ["/images/portfolio/workshop.jpg"],
        participants: 25,
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
        name: "Fragrantions 2026",
        date: "2026-10-17",
        location: "Jakarta Convention Center",
        description: "Annual fragrance exhibition terbesar di Indonesia! 100+ brand, talk show, workshop, dan networking session.",
        image: "/images/events/fragrantions-2026.jpg",
        registrationUrl: "https://fragrantions.sensasiwangi.id",
        isPublic: true,
    },
    {
        id: "ue2",
        name: "Road to Fragrantions - Bali",
        date: "2026-03-20",
        location: "Bali",
        description: "Pop-up market dan community gathering di Bali sebagai bagian dari Road to Fragrantions series.",
        image: "/images/events/rtf-bali.jpg",
        registrationUrl: "https://rtf-bali.sensasiwangi.id",
        isPublic: true,
    },
    {
        id: "ue3",
        name: "Road to Fragrantions - Medan",
        date: "2026-05-15",
        location: "Medan",
        description: "Pop-up market dan workshop di Medan.",
        image: "/images/events/rtf-medan.jpg",
        registrationUrl: "https://rtf-medan.sensasiwangi.id",
        isPublic: true,
    },
    {
        id: "ue4",
        name: "Basic Perfumery Workshop Batch 15",
        date: "2026-02-10",
        location: "Lab Bintaro, Tangerang Selatan",
        description: "Workshop dasar pembuatan parfum. Kuota terbatas 25 orang.",
        image: "/images/events/workshop.jpg",
        registrationUrl: "https://workshop.sensasiwangi.id",
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
