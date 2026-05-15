<p align="center">
  <img src="./docs/assets/presence-link-banner.svg" alt="PresenceLink Banner" width="800">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge" alt="Build Status">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/version-v1.0.0-orange?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Stack-React_19_|_Node_22-61dafb?style=for-the-badge" alt="Stack">
  <img src="https://img.shields.io/badge/White--Label-Ready-purple?style=for-the-badge" alt="White-Label Ready">
</p>

---

# 🔗 PresenceLink: The Enterprise Presence Engine

**PresenceLink** is the definitive infrastructure for presence management in hybrid and distributed teams. In a world where the office is no longer the only meeting point, visibility becomes the greatest operational challenge. PresenceLink resolves this chaos through a high-performance **B2B White-Label** platform that centralizes the location of every talent, automates internal communication, and integrates into the existing workflow.

### 🚩 The Problem: The Hybrid Visibility Gap
Modern companies lose thousands of hours a year on a constant question: *"Who is in the office tomorrow?"*. Slack messages get lost, Outlook calendars are tedious to update, and the lack of data prevents real optimization of the workspace (Real Estate Optimization).

### 💡 The Solution: Invisible Synchronization
PresenceLink is not just a calendar; it is a **Location Intelligence Engine**. It allows employees to declare their status in seconds using predictive autocompletion algorithms, while the backend synchronizes that reality with Microsoft Teams, and personal calendars in real-time.

---

## 📑 Interactive Table of Contents

1.  [🏗️ Architecture & Tech Stack (Deep Dive)](#️-architecture--tech-stack-deep-dive)
2.  [🚀 Exhaustive Feature Catalog](#-exhaustive-feature-catalog)
    *   [User Experience](#user-experience)
    *   [Administrative Capabilities](#administrative-capabilities)
    *   [Intelligent Notification Engine](#intelligent-notification-engine)
3.  [🎨 White-Labeling Guide](#-white-labeling-guide)
4.  [⚙️ Installation & Deployment](#️-installation--deployment)
5.  [📊 Environment Variables Matrix](#-environment-variables-matrix)
6.  [🖥️ Troubleshooting & FAQ](#️-troubleshooting--faq)
7.  [📜 License & Contribution](#-license--contribution)

---

## 🏗️ Architecture & Tech Stack (Deep Dive)

PresenceLink has been designed under the principles of **High Availability** and **Low Latency**. It is not a simple CRUD; it is a distributed system that separates interaction logic from automation logic.

```mermaid
graph TD
    subgraph "Frontend Layer (Client)"
        UI[React 19 + Vite]
        Store[Zustand State Engine]
    end

    subgraph "Backend Layer (Core)"
        API[Express API Node 22]
        Cron[Node-Cron Runner]
        ICal[iCal Generator]
        
    end

    subgraph "Storage Layer"
        DB[(PostgreSQL)]
    end

    subgraph "External Integrations"
        Teams[MS Teams Webhooks]
        Outlook[Outlook/iCal Clients]
    end

    UI <--> Store
    Store <--> API
    API <--> DB
    Cron --> API
    Cron --> Teams
    Cron --> WA
    API --> ICal
    ICal --> Outlook
```

### Why this Stack?
*   **React 19 + Vite:** We take advantage of the latest improvements in the React compiler and concurrent rendering for an interface that feels instantaneous.
*   **Node 22 (LTS):** Used for its optimized V8 engine and native support for the latest ESM specifications, ensuring a secure and fast backend.
*   **Zustand:** Chosen over Redux to avoid unnecessary re-renders. Its atomic architecture allows calendar components to update independently, vital when handling months with hundreds of presences.
*   **PostgreSQL:** The industry standard for data integrity. Its robustness allows us to handle complex relationships between departments, users, and dynamic categories.
*   **Node-cron:** Orchestration engine for sending massive daily notifications, allowing granular customization of schedules by time zone.

---

## 🚀 Exhaustive Feature Catalog

### User Experience
*   **Magic Fill🪄 (Predictive Autocomplete):** The system learns from routines. Users can define weekly patterns (e.g., Monday/Wednesday in the office, Tuesday/Thursday at home) and fill entire months with a single click. The algorithm automatically ignores holidays and non-working weekends.
*   **Real-Time iCal Sync:** Each user has a private `.ics` endpoint. This allows their presence in PresenceLink to appear as events in **Outlook, Google Calendar, or Apple Calendar** without manual intervention.
*   **Presence States (Confirmed vs. Predicted):** Icons in the calendar visually differentiate between a presence confirmed by the user and a presence suggested by the system based on their base configuration.

### Administrative Capabilities
*   **Role-Based Access Control (RBAC):** Multi-level permission system:
    *   **User:** Manages their own presence and views their team's.
    *   **Admin:** Manages users and webhooks for their department.
    *   **SuperAdmin:** Full control over categories, global departments, and system configurations.
*   **Dynamic Categories:** Admins can create custom "Locations" (e.g., "Client A", "Creative Hub", "In Flight") with specific icons and colors reflected across the platform.
*   **Working Weekend Management:** Granular permissions to allow certain roles (e.g., 24/7 Support) to register presence on traditionally non-working days.

### Intelligent Notification Engine
*   **Microsoft Teams Webhooks:** Automatic generation of highly visual **Adaptive Cards** sent to specific department channels every morning. Shows who is in the office, who is working remotely, and who is on leave.

---

## 🎨 White-Labeling Guide

PresenceLink is **Brand-Agnostic**. It has been built for other companies to adopt it as their official internal tool in less than 60 seconds.

> [!IMPORTANT]
> **No React code changes required.** All rebranding is managed through environment variable injection during the build process.

### Express Rebranding Steps:
1.  **App Name:** Change `VITE_APP_NAME` to rename the entire platform (Titles, Browser tabs, emails).
2.  **Visual Identity:** Provide a URL in `VITE_APP_LOGO_URL`. The system will automatically inject your logo into the navigation bar and login pages.
3.  **Corporate Color:** Adjust `VITE_APP_PRIMARY_COLOR` with your Hexadecimal code (e.g., `#FF5733`). The Tailwind system will generate a palette of shades and hover states based on your brand color.
4.  **Custom Copyright:** Modify `VITE_APP_COMPANY_NAME` so the footer and legal terms reflect your legal entity.

---

## ⚙️ Installation & Deployment

### 🐳 Option A: Docker (Production - The Easy Way)
Ideal for quick deployments on AWS, Azure, or DigitalOcean.

### 🐳 Docker Implementation (Recommended)

The platform is fully containerized for both development and production.

#### Local Development
```bash
# Start all services (Backend, Frontend, PostgreSQL)
docker-compose up --build
```

The system will automatically:
1. Spin up a **PostgreSQL 16** instance.
2. Initialize the backend and wait for the database to be healthy.
3. Start the **Vite** development server for the frontend.


#### Key Services
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:4000`
- **Database**: `localhost:5432`

---

```bash
# 1. Clone the professional repository
git clone https://github.com/puyi27/CALENDAR.git && cd CALENDAR

# 2. Configure the environment
# Edit the docker-compose.yml file or create specific .env files

# 3. Launch the infrastructure
docker-compose up -d --build
```
*The platform will be immediately available at `http://localhost:3000`.*

### 🛠️ Option B: Manual (Local Development)
For developers needing to extend functionality.

1.  **Install monorepo dependencies:**
    ```bash
    npm install
    npm run install:all # Installs frontend and backend simultaneously
    ```
2.  **Configure Environment Variables:**
    Copy the `.env.example` files to `.env` in the `frontend` and `backend` folders.
3.  **Run in watch mode:**
    ```bash
    # In separate terminals or using a runner:
    npm run dev --prefix backend
    npm run dev --prefix frontend
    ```

---

## 📊 Environment Variables Matrix

### Frontend (`/frontend/.env`)
| Variable | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | String | Yes | REST API Endpoint | `https://api.yourdomain.com/api` |
| `VITE_APP_NAME` | String | No | Public application name | `PresenceLink` |
| `VITE_APP_LOGO_URL` | URL | No | Brand logo (SVG/PNG) | `https://cdn.com/logo.svg` |
| `VITE_APP_PRIMARY_COLOR` | Hex | No | UI accent color | `#4f46e5` |
| `VITE_APP_COMPANY_NAME` | String | No | Copyright/Footer name | `Acme Inc.` |

### Backend (`/backend/.env`)
| Variable | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | URL | Yes | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `JWT_SECRET` | String | Yes | Session encryption seed | `super-secret-key-12345` |
| `PORT` | Int | No | Server listening port | `4000` |
| `CRON_TIME` | Cron | No | Notification delivery schedule | `0 9 * * 1-5` (9:00 AM) |


---

## 🖥️ Troubleshooting & FAQ

### 1. ❌ PostgreSQL Connection Error (ECONNREFUSED)
**Cause:** The database service hasn't started or the URL in `.env` is incorrect.
**Solution:** Verify that the DB container is `UP` or that your Neon/RDS instance allows connections from your server's IP.

### 2. ❌ .env changes not reflecting in the Frontend
**Cause:** Vite caches variables during the build.
**Solution:** Stop the dev server, run `npm run build`, or clear Vite's cache by deleting the `node_modules/.vite` folder.

### 3. ❌ iCal not syncing in Outlook
**Cause:** The user token is invalid or the firewall blocks external requests to the backend.
**Solution:** Generate a new token from the user profile and ensure the backend is publicly accessible.

### 4. ❌ Teams Webhook delivery failure
**Cause:** The webhook URL has expired or the Adaptive Card format has been rejected.
**Solution:** Validate the URL in the PresenceLink Admin panel and click the "Test Webhook" button.

---

## 📜 License & Contribution

This project is under the **MIT License**. If you wish to contribute, please open a Pull Request detailing the changes. For security bug reports, contact the architecture team directly.

---

<p align="center">
  <b>PresenceLink — Eliminating friction in modern work.</b><br>
  Built with ❤️ by <a href="https://github.com/puyi27">puyi27</a>
</p>
