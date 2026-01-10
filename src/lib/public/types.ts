// Public Profile types

export interface CompanyInfo {
    name: string;
    tagline: string;
    description: string;
    logo: string;
    address: string;
    phone: string;
    email: string;
    instagram: string;
    whatsapp: string;
    founded: number;
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    photo: string;
    bio?: string;
}

export interface PortfolioItem {
    id: string;
    title: string;
    category: "wedding" | "corporate" | "music" | "exhibition" | "other";
    date: string;
    location: string;
    description: string;
    images: string[];
    client?: string;
    participants?: number;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    category: "event-organizer" | "media-production" | "creative-services" | "venue";
    image: string;
    features: string[];
    priceRange?: string;
}

export interface UpcomingEvent {
    id: string;
    name: string;
    date: string;
    location: string;
    description: string;
    image: string;
    registrationUrl?: string;
    isPublic: boolean;
}

// Category labels
export const PORTFOLIO_CATEGORIES = {
    wedding: "Wedding",
    corporate: "Corporate Event",
    music: "Music Festival",
    exhibition: "Exhibition",
    other: "Other",
};

export const PRODUCT_CATEGORIES = {
    "event-organizer": "Event Organizer",
    "media-production": "Media Production",
    "creative-services": "Creative Services",
    venue: "Venue Rental",
};

// Brand Portfolio type
export interface Brand {
    id: string;
    name: string;
    description: string;
    category: string;
    logo: string;
}

// Business Pillar type
export interface BusinessPillarItem {
    name: string;
    description: string;
}

export interface BusinessPillar {
    name: string;
    items: BusinessPillarItem[];
}
