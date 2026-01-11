# Sentry Setup Guide

## 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up or log in
3. Create a new project
4. Select **Next.js** as the platform

## 2. Get Your DSN

After creating the project:
1. Go to **Settings** → **Projects** → **[Your Project]** → **Client Keys (DSN)**
2. Copy the **DSN** value
3. Add to your `.env.local` file:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```

## 3. Get Auth Token (for Source Maps)

1. Go to **Settings** → **Account** → **API** → **Auth Tokens**
2. Create a new token with scopes:
   - `project:read`
   - `project:releases`
3. Add to `.env.local`:
   ```
   SENTRY_AUTH_TOKEN=your_auth_token_here
   ```

## 4. Test Error Tracking

### In Development:
```typescript
// Add this to any page to test
import { logger } from "@/lib/monitoring/logger";

// Test error
try {
  throw new Error("Test error from development");
} catch (error) {
  logger.exception(error as Error, { test: true });
}
```

### In Production:
Errors will be automatically captured and sent to Sentry.

## 5. Configure Alerts

1. Go to **Alerts** → **Create Alert**
2. Set up alerts for:
   - New issues
   - Error rate spikes
   - Performance degradation

Recommended channels:
- Email
- Slack (optional)

## Files Created

- `sentry.client.config.ts` - Client-side config
- `sentry.server.config.ts` - Server-side config
- `sentry.edge.config.ts` - Edge runtime config
- `src/lib/monitoring/logger.ts` - Logger utility
- `src/app/error.tsx` - Root error boundary
- `src/app/(workspace)/error.tsx` - Workspace error boundary
- `src/components/error-boundary.tsx` - Reusable component

## Usage Examples

### Basic Logging
```typescript
import { logger } from "@/lib/monitoring/logger";

logger.info("User logged in", { userId: "123" });
logger.warn("API rate limit approaching", { remaining: 10 });
logger.error("Database connection failed", { database: "postgres" });
```

### Exception Tracking
```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.exception(error as Error, {
    operation: "riskyOperation",
    params: { id: 123 }
  });
}
```

### User Context
```typescript
import { setUserContext } from "@/lib/monitoring/logger";

// After login
setUserContext({
  id: user.id,
  email: user.email,
  name: user.name
});
```

### Error Boundary
```typescript
import { ErrorBoundary } from "@/components/error-boundary";

<ErrorBoundary>
  <ComplexComponent />
</ErrorBoundary>
```

## Free Tier Limits

- **Errors**: 5,000/month
- **Performance**: 10,000 transactions/month
- **Session Replay**: 50 replays/month

If you exceed limits, errors will be dropped.

## Next Steps

1. Set up `.env.local` with DSN and auth token
2. Deploy to production
3. Test error reporting
4. Configure alerts
5. Monitor dashboard regularly
