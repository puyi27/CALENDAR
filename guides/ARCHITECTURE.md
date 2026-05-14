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

## 4. White Labeling & Branding
The system is designed for multi-client distribution. You can customize the entire identity without modifying the source code.

### Branding via Environment Variables
- `VITE_APP_NAME`: Changes the name in the Navbar, browser tab, and login screen.
- `VITE_APP_LOGO_URL`: If set, replaces the default icon with a company logo.
- `VITE_APP_COMPANY_NAME`: Used in footers and automated messages.

### Modular Integrations (Opt-in)
Integrations are disabled by default to ensure privacy and stability. Enable them in `backend/.env`:
- `ENABLE_TEAMS_WEBHOOKS=true`: Activates the MS Teams notification engine.
- `ENABLE_WHATSAPP_BOT=true`: Boots the Puppeteer-based WhatsApp bridge.

---

## 5. Deployment Models

### Self-Hosted (On-Premise)
The recommended model for strict privacy. Each client deploys their own Docker stack.
- **Pros**: 100% data isolation, no maintenance overhead for the provider.
- **Cons**: Requires the client to manage a database.

### Multi-tenant SaaS (Future Roadmap)
To support multiple companies in a single instance:
- **Database**: Each table needs a `company_id`.
- **Auth**: JWT payload must include the `company_id`.
- **Filtering**: All repository queries must include `WHERE company_id = ...`.
