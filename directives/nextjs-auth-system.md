# Directive: Next.js Auth System

## Purpose
Panduan untuk setup authentication system di Next.js dengan Google OAuth native.

## When to Use
- Setting up new project dengan auth
- Implementing Google OAuth
- Adding RBAC

## Prerequisites
- Next.js 14+ dengan App Router
- shadcn/ui sudah terinstall

## Steps

### 1. Create Auth Library
```
src/lib/auth/
├── types.ts     # User, Session, GoogleToken types
├── index.ts     # OAuth functions, JWT utilities
└── permissions.ts  # Role definitions, permission matrix
```

Key functions:
- `getGoogleAuthUrl()` - Generate OAuth consent URL dengan state param
- `exchangeCodeForTokens()` - Exchange code for tokens
- `createSessionToken()` - Create JWT dengan user info
- `verifySessionToken()` - Verify dan decode JWT

### 2. Create API Routes
```
src/app/api/auth/
├── google/route.ts       # GET: Redirect to Google
├── callback/google/route.ts  # GET: Handle callback
├── me/route.ts           # GET: Current user
└── logout/route.ts       # POST: Clear session
```

### 3. Create Middleware
```
src/middleware.ts
```
- Protect routes: `/dashboard`, `/workspace/*`
- Redirect unauthenticated to `/login`
- Redirect authenticated away from `/login`

### 4. Create State Management
```
src/stores/auth-store.ts  # Zustand store
src/hooks/use-auth.ts     # Hook wrapper
src/hooks/use-permissions.ts  # Permission checks
```

### 5. Create RBAC Components
```
src/components/auth/role-gate.tsx
```
- `<RoleGate feature="..." requiredLevel="view|edit|admin">`
- `<AdminOnly feature="...">`
- `<CanEdit feature="...">`

## Environment Variables
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Common Issues

| Issue | Solution |
|-------|----------|
| OAuth callback URL mismatch | Ensure NEXT_PUBLIC_APP_URL matches Google Console |
| JWT verification fails | Check JWT_SECRET is same across all routes |
| Middleware not working | Check matcher config in middleware.ts |

## References
- [Story 1.2: Google OAuth Login]
- [Story 1.3: Session Management]
- [Story 1.4: RBAC]
