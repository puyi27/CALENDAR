process.env.TZ = "Europe/Rome";
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { config } from './src/config';
import { initializeDatabase } from './src/db/init';
import apiRoutes from './src/routes';
import { executeDailyTeamsNotifications } from './src/services/notificationService';

const app = express();

// Initialize Database
initializeDatabase();

// Middleware
app.use(cors({
  origin: config.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '5mb' }));

// Routes
app.use('/api', apiRoutes);

// Cron Jobs
cron.schedule(config.CRON_TIME, () => {
  if (config.ENABLE_NOTIFICATIONS) {
    executeDailyTeamsNotifications();
  } else {
    console.log("Daily notification cron skipped (ENABLE_NOTIFICATIONS is false)");
  }
}, { timezone: "Europe/Rome" });

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.PORT, () => {
    console.log(`PresenceLink API running on port ${config.PORT}`);
  });
}

export default app;