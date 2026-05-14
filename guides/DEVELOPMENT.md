# 🚀 Development Guide

This guide explains how to contribute to FAE Calendar and the standards we follow.

## 1. Coding Standards
- **TypeScript**: Use strict typing. Avoid `any` whenever possible.
- **Naming**: 
    - Components: `PascalCase` (e.g., `DayCell.tsx`)
    - Utils/Functions: `camelCase` (e.g., `getCategoryIcon.tsx`)
- **Linting**: Run `npm run lint` before committing.

## 2. Adding a New Category
To add a new presence type to the system:
1.  **Database**: Add a new row to the `categories` table.
2.  **Frontend Utils**: Update `getCategoryIcon` and `getCategoryColorClass` in `categoryUtils.tsx` to handle the new icon/color.
3.  **Translations**: Add the name in `frontend/src/i18n/locales/`.

## 3. Deployment Workflow
### To Vercel (Production)
- The frontend and backend are deployed as a monorepo.
- Ensure `VITE_API_URL` points to the production backend.

### Database Migrations
- Currently handled by the `initializeDatabase` function in `backend/index.ts` on startup. 
- For breaking changes, manual SQL execution in the Neon console is required.
