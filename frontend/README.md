# GrantGenie Frontend

React + TypeScript + Vite + Material UI powered frontend for GrantGenie, backed by Supabase (Auth, Postgres, and Edge Functions).

## Overview

GrantGenie helps track grants, budgets, and spending. Users authenticate with Supabase, create and browse grants, inspect budget and institutional rules, and submit transactions that are verified by a Supabase Edge Function before being recorded.

## Tech Stack

- **React + TypeScript**: Modern UI with type safety (React 19).
- **Vite**: Fast dev server and build tooling (React Compiler enabled via Babel plugin).
- **Material UI (MUI)**: UI components and layout.
- **React Router**: Client-side routing.
- **Supabase**: Auth, Postgres database, and Edge Functions via `@supabase/supabase-js` and `@supabase/auth-ui-react`.

## Architecture

- **App entry**: `src/main.tsx` mounts `<App />`.
- **Routing and auth gate**: `src/App.tsx` + `src/AppRoutes.tsx`.
  - If there’s no session, the app renders `<Auth />` from `@supabase/auth-ui-react`.
  - When authenticated, users see the main UI with routes: `/home`, `/grants`, `/transactions`.
- **Session and Supabase client**: `src/contexts/SessionProvider.tsx`.
  - Creates a single Supabase client and provides `useSession()` and `useSupabase()` hooks.
  - Subscribes to auth state changes and exposes a `logout` helper.
- **Supabase client query layer**: `src/utils/supabase-client-queries/*`.
  - `grants.ts`: `insertGrant`, `selectGrants`.
  - `categories.ts`: `selectCategoriesByGrant`.
  - `auth.ts`: `logout`.
- **UI components/pages**:
  - Navigation: `NavigationTabs` (MUI AppBar/Tabs).
  - Grants: `CreateGrantForm`, `GrantViewer`, `GrantDetailsModal`.
  - Transactions: `TransactionSubmitter` modal.

## How it works

1. **Boot & session**
   - `SessionProvider` creates a Supabase client, loads the current session, and updates on auth changes.
2. **Authentication**
   - Unauthenticated users see the Supabase `<Auth />` component styled with `ThemeSupa`.
   - Upon login, routes and data become available via the provided client.
3. **Grants**
   - Create grants with `CreateGrantForm` using `insertGrant()`; the DB sets ownership metadata via defaults/RLS.
   - View and select grants in `GrantViewer`. Selecting a grant opens `GrantDetailsModal` which fetches:
     - Budget items from `grant_budget_items` (with related `category_lookup`).
     - Institutional rules from `institutional_rules` (JSON ruleset).
     - Transactions from `transactions`.
     - The modal computes totals and percent of budget used.
4. **Transactions**
   - `TransactionSubmitter` loads user grants and related categories, then obtains a JWT from the session.
   - It calls the Supabase Edge Function `verify-transaction` with `grant_id`, `category_id`, `amount`, `description`.
   - The function validates business rules and returns a result that the UI displays.

## Setup

Prereqs: Node 18+ recommended.

1. Install deps
   - `npm install`
2. Run dev server
   - `npm run dev`
3. Build
   - `npm run build`
4. Preview production build
   - `npm run preview`

### Supabase configuration

- The Supabase URL and anon key are currently initialized in `src/contexts/SessionProvider.tsx`.
- For production, it’s recommended to use environment variables (e.g., `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and read them via `import.meta.env`.
- The Edge Function endpoint used by the UI is: `{SUPABASE_URL}/functions/v1/verify-transaction`.

## Project structure (frontend)

```
frontend/
  src/
    App.tsx
    AppRoutes.tsx
    main.tsx
    contexts/
      SessionProvider.tsx
    utils/
      supabase-client-queries/
        auth.ts
        grants.ts
        categories.ts
    components/
      NavigationTabs.tsx
      GrantCreator.tsx
      GrantViewer.tsx
      GrantDetailsModal.tsx
      TransactionSubmitter.tsx
    pages/
      Home.tsx
      Grants.tsx
      Transactions.tsx
```

## Notes

- MUI uses the default theme; customize by adding a `ThemeProvider` if needed.
- Vite is configured with the React Compiler via Babel for improved optimization.
