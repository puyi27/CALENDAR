import 'dotenv/config';

export const config = {
  PORT: process.env.PORT || 4000,
  SECRET_KEY: process.env.JWT_SECRET || 'fallback-secret-for-dev-only',
  FRONTEND_URL: process.env.FRONTEND_URL || "https://faecalendar.vercel.app",
  APP_NAME: process.env.APP_NAME || 'PresenceLink',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  ENABLE_TEAMS_WEBHOOKS: process.env.ENABLE_TEAMS_WEBHOOKS === 'true',
  ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS === 'true',
  CRON_TIME: process.env.CRON_TIME || "23 14 * * 1-5",
};

if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET env variable is not set. Using fallback for development.");
}
