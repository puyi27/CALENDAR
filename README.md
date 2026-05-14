<p align="center">
  <img src="https://raw.githubusercontent.com/puyi27/CALENDAR/main/docs/assets/presence-link-banner.png" alt="PresenceLink Banner" width="800">
</p>

<p align="center">
  <img src="https://img.shields.io/github/actions/workflow/status/puyi27/CALENDAR/deploy.yml?branch=main&style=for-the-badge" alt="Build Status">
  <img src="https://img.shields.io/github/license/puyi27/CALENDAR?style=for-the-badge&color=blue" alt="License">
  <img src="https://img.shields.io/github/v/release/puyi27/CALENDAR?style=for-the-badge&color=orange" alt="Version">
  <img src="https://img.shields.io/badge/Stack-React_19_|_Node_22-61dafb?style=for-the-badge" alt="Stack">
</p>

---

# 🔗 PresenceLink
### **The Ultimate White-Label Presence Engine for Modern Teams.**

PresenceLink is an enterprise-ready, high-performance presence management platform. It empowers distributed teams to synchronize locations, automate notifications, and maintain visibility through a sophisticated, brand-agnostic architecture. Built for scale, designed for simplicity.

---

## 🎯 At a Glance

- **Zero-Touch Branding:** Fully customizable UI via environment variables. No code changes required.
- **Smart Automation:** Integrated Magic Fill🪄 engine and multi-channel notifications (Teams/WhatsApp).
- **Architecture First:** Decoupled Full-Stack design with React 19, Vite 7, and Node.js 22.

---

## 📑 Table of Contents
1. [🚀 Features](#-features)
2. [🏗️ Architecture](#️-architecture)
3. [⏱️ Quickstart](#️-quickstart)
4. [🛠️ White-Label Configuration](#️-white-label-configuration)
5. [🖥️ Troubleshooting](#️-troubleshooting)
6. [🤝 Contributing](#-contributing)
7. [📜 License](#-license)

---

## 🚀 Features

| Feature | Description | Visual Status |
| :--- | :--- | :--- |
| **Magic Fill🪄** | AI-driven bulk presence population based on recurring patterns. | <!-- ![Screenshot: Magic Fill Feature](/docs/assets/magic-fill.gif) --> |
| **Smart Status** | Distinctive visual differentiation between confirmed and predicted locations. | <!-- ![Screenshot: Smart Status](/docs/assets/smart-status.png) --> |
| **Multi-Channel Sync** | Automated updates to MS Teams and WhatsApp without manual input. | <!-- ![Screenshot: Notifications](/docs/assets/notifications.png) --> |
| **iCal Engine** | Real-time synchronization with Outlook, Google, and Apple calendars. | <!-- ![Screenshot: iCal Sync](/docs/assets/ical-sync.png) --> |
| **RBAC Security** | Granular permission levels: User, Admin, and SuperAdmin. | <!-- ![Screenshot: RBAC](/docs/assets/rbac.png) --> |

---

## 🏗️ Architecture

PresenceLink follows a **Decoupled Monorepo** pattern, ensuring high cohesion and low coupling between the UI and the automation engine.

> [!IMPORTANT]
> The system utilizes **PostgreSQL (Neon/Local)** as the source of truth, with a specialized Cron Engine for asynchronous notification delivery.

### Tech Stack
- **Frontend:** React 19 + TypeScript + Vite 7 + TailwindCSS 4
- **State Management:** Zustand (High-performance atomic state)
- **Backend:** Node.js 22 + Express + tsx
- **Infrastructure:** Docker Ready + Vercel Optimized

---

## ⏱️ Quickstart

### Option A: 🐳 Docker Deployment (Recommended - 1 min)
The fastest way to get PresenceLink up and running.

```bash
# 1. Clone the repository
git clone https://github.com/puyi27/CALENDAR.git && cd CALENDAR

# 2. Start the environment
docker-compose up -d
```
*The app will be available at `http://localhost:3000`.*

### Option B: 🛠️ Manual Setup
For developers who want full control over the environment.

1. **Install Dependencies:**
   ```bash
   npm run install:all
   ```

2. **Configure Environment:**
   Copy `.env.example` to `.env` in both `frontend` and `backend` directories.

3. **Launch Services:**
   ```bash
   # Start Backend (API + Cron)
   npm run dev --prefix backend

   # Start Frontend (HMR)
   npm run dev --prefix frontend
   ```

---

## 🛠️ White-Label Configuration

PresenceLink is designed to be **rebranded in seconds**. Change your identity without ever touching a line of React code.

Modify the following variables in `/frontend/.env`:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_APP_NAME` | Global application title | `PresenceLink` |
| `VITE_APP_LOGO_URL` | External URL for the brand logo | `https://cdn.com/logo.png` |
| `VITE_APP_PRIMARY_COLOR` | Theme primary accent (Hex) | `#4dabf7` |
| `VITE_APP_COMPANY_NAME` | Copyright and footer identity | `Acme Corp` |

> [!TIP]
> Use the **Dynamic Logo Injection** to support multi-tenant deployments with a single build artifact.

---

## 🖥️ Troubleshooting

### 1. ❌ Database Connection Refused
**Symptoms:** Backend logs show `ECONNREFUSED` or `Pool error`.
**Solution:** Ensure your PostgreSQL instance is running and the `DATABASE_URL` in `.env` includes the correct credentials and port (usually 5432).

### 2. ❌ TS6133: Unused Variables
**Symptoms:** Vercel deployment fails during type-check.
**Solution:** PresenceLink follows strict linting. Ensure all unused request parameters are prefixed with an underscore (e.g., `_req`).

### 3. ❌ WhatsApp Bot not scanning
**Symptoms:** QR code doesn't appear in logs.
**Solution:** Ensure the environment has `chromium` installed (already handled in Docker). If local, set `ENABLE_WHATSAPP_BOT=false` if not needed.

---

## 🤝 Contributing

We welcome high-quality contributions! Follow these steps:

1. **Fork** the repository.
2. **Create** a feature branch: `git checkout -b feature/AmazingFeature`.
3. **Commit** your changes: `git commit -m 'Add AmazingFeature'`.
4. **Push** to the branch: `git push origin feature/AmazingFeature`.
5. **Open** a Pull Request.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  <b>PresenceLink — Connecting Teams, One Presence at a Time.</b>
</p>
