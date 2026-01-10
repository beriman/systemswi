// Application constants

export const APP_NAME = "system-swi";
export const APP_VERSION = "0.1.0";

// Role definitions
export const ROLES = {
    CEO: "ceo",
    COO: "coo",
    KOMISARIS: "komisaris",
    PANITIA: "panitia",
    FREELANCER: "freelancer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Route paths
export const ROUTES = {
    HOME: "/",
    DASHBOARD: "/dashboard",
    LOGIN: "/login",
} as const;

// API endpoints
export const API_ROUTES = {
    AUTH: "/api/auth",
} as const;
