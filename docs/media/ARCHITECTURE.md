# 🏗️ System Architecture Deep Dive

## 1. Data Flow Overview
FAE Calendar operates as a distributed system with a strict separation of concerns.

### Frontend (The Visual Layer)
- **Framework**: React 19 (Strict Mode).
- **State Management**: Zustand (Atomic state updates).
- **API Interaction**: Centralized via `useStore` actions using the Fetch API.
- **Rendering Strategy**: Client-Side Rendering (CSR) with optimized memoization in the Calendar Grid (`DayCell`).

### Backend (The Logic Layer)
- **Runtime**: Node.js 22 (LTS).
- **Process Management**: Single entry-point (`index.ts`) for easier containerization.
- **Persistence**: PostgreSQL with a connection pool to handle concurrent requests.

---

## 2. The Notification Lifecycle
This is the most critical automated process in the application.

1. **Trigger**: A `node-cron` schedule fires daily (configured via `WA_CRON_SCHEDULE`).
2. **Aggregation**: The system queries the `presences` table for `date = tomorrow`.
3. **Resolution Logic**: 
    - If a user has a specific entry, use it.
    - If not, check `users.default_category_id`.
    - If not, check `departments.default_category_id`.
    - If it's a weekend, check `users.can_work_weekends`.
4. **Dispatch**: 
    - **Teams**: Adaptive Cards sent via POST to Webhooks.
    - **WhatsApp**: Message sent via the headless Puppeteer instance.

---

## 3. State Management Strategy (Zustand)
The `useStore` is the "Single Source of Truth". 
- **Persistence**: Authentication state is persisted in `localStorage`.
- **Reactivity**: Components subscribe only to the slices of state they need, preventing global re-renders.
- **Optimistic Updates**: (Planned) The UI reflects changes immediately before the server confirms.
