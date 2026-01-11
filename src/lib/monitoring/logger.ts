/**
 * Structured Logger
 * 
 * Provides consistent logging across the application with Sentry integration.
 * In development: logs to console
 * In production: logs to console + Sentry
 */

import * as Sentry from "@sentry/nextjs";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
    [key: string]: any;
}

/**
 * Log a message with context
 */
function log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logData = {
        timestamp,
        level,
        message,
        ...context,
    };

    // Console logging
    if (process.env.NODE_ENV === "development") {
        const consoleMethod = console[level] || console.log;
        consoleMethod(`[${timestamp}] [${level.toUpperCase()}]`, message, context || "");
    }

    // Sentry logging for errors and warnings in production
    if (process.env.NODE_ENV === "production") {
        if (level === "error") {
            Sentry.captureException(new Error(message), {
                level: "error",
                extra: context,
            });
        } else if (level === "warn") {
            Sentry.captureMessage(message, {
                level: "warning",
                extra: context,
            });
        }
    }
}

/**
 * Logger instance
 */
export const logger = {
    info: (message: string, context?: LogContext) => {
        log("info", message, context);
    },

    warn: (message: string, context?: LogContext) => {
        log("warn", message, context);
    },

    error: (message: string, context?: LogContext) => {
        log("error", message, context);
    },

    debug: (message: string, context?: LogContext) => {
        log("debug", message, context);
    },

    /**
     * Log an exception with full stack trace
     */
    exception: (error: Error, context?: LogContext) => {
        console.error("[EXCEPTION]", error);

        if (process.env.NODE_ENV === "production") {
            Sentry.captureException(error, {
                extra: context,
            });
        }
    },
};

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
    id: string;
    email?: string;
    name?: string;
}) {
    if (process.env.NODE_ENV === "production") {
        Sentry.setUser({
            id: user.id,
            email: user.email,
            username: user.name,
        });
    }
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
    if (process.env.NODE_ENV === "production") {
        Sentry.setUser(null);
    }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: LogContext) {
    if (process.env.NODE_ENV === "production") {
        Sentry.addBreadcrumb({
            message,
            data,
            level: "info",
        });
    }
}
