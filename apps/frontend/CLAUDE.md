# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Next.js Version Warning

This project uses **Next.js 16**, which has breaking changes from older versions. Before writing any Next.js-specific code (routing, data fetching, metadata, server actions, image optimization), read the relevant guide in `node_modules/next/dist/docs/`. APIs and conventions may differ from your training data — heed deprecation notices.

## Frontend-Specific Notes

- **Tailwind v4**: No `tailwind.config.js`. Use `@tailwindcss/postcss` in `postcss.config.mjs` and CSS-first configuration in `globals.css`.
- **All API calls** go through `lib/api.ts` — add new endpoints there as typed functions, do not call `fetch`/`axios` directly in components.
- **Auth**: Use the `useAuth()` hook from `contexts/AuthContext.tsx` to get the current user and token. Do not read `localStorage` directly.
- **Admin route guard**: Admin pages check `user.role === 'ADMIN'` via `AuthContext` — do not add Clerk middleware for this.
- **React 19**: This project uses React 19. Use the new `use()` hook and transitions API where appropriate.
