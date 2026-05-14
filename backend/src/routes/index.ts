import { Router } from 'express';
import { pool } from '../db/pool';
import { authenticateSession, requireAdminPrivileges, requireSuperAdminPrivileges } from '../middleware/auth';
import * as authController from '../controllers/authController';
import * as userController from '../controllers/userController';
import * as holidayController from '../controllers/holidayController';
import * as categoryController from '../controllers/categoryController';
import * as departmentController from '../controllers/departmentController';
import * as presenceController from '../controllers/presenceController';
import { executeDailyTeamsNotifications } from '../services/notificationService';

const router = Router();

// Auth
router.post('/login', authController.login);

// Holidays
router.get('/holidays', authenticateSession, holidayController.getHolidays);
router.post('/holidays', authenticateSession, requireSuperAdminPrivileges, holidayController.createHoliday);
router.post('/holidays/bulk', authenticateSession, requireSuperAdminPrivileges, holidayController.bulkCreateHolidays);
router.delete('/holidays/:date', authenticateSession, requireSuperAdminPrivileges, holidayController.deleteHoliday);

// Users
router.get('/users', authenticateSession, userController.getUsers);
router.post('/users', authenticateSession, requireAdminPrivileges, userController.createUser);
router.put('/users/:id', authenticateSession, userController.updateUser);
router.delete('/users/:id', authenticateSession, requireAdminPrivileges, userController.deleteUser);

// Categories
router.get('/categories', categoryController.getCategories);
router.post('/categories', authenticateSession, requireSuperAdminPrivileges, categoryController.createCategory);
router.put('/categories/:id', authenticateSession, requireSuperAdminPrivileges, categoryController.updateCategory);
router.delete('/categories/:id', authenticateSession, requireSuperAdminPrivileges, categoryController.deleteCategory);

// Departments
router.get('/departments', authenticateSession, departmentController.getDepartments);
router.post('/departments', authenticateSession, requireSuperAdminPrivileges, departmentController.createDepartment);
router.put('/departments/:name', authenticateSession, requireSuperAdminPrivileges, departmentController.updateDepartment);
router.delete('/departments/:name', authenticateSession, requireSuperAdminPrivileges, departmentController.deleteDepartment);

// Presences
router.post('/presences', authenticateSession, presenceController.getPresences);
router.post('/presences/bulk', authenticateSession, presenceController.bulkPresences);
router.delete('/presences', authenticateSession, presenceController.deletePresence);
router.get('/calendar/:token.ics', presenceController.getCalendarIcs);

// Testing / Cron
router.all('/test-webhook', async (_req, res) => {
  try {
    await executeDailyTeamsNotifications();
    res.json({ success: true, message: "Test completed." });
  } catch (error) {
    res.status(500).json({ error: "Error", details: String(error) });
  }
});

export default router;
