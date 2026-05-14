import { Router } from 'express';
import { authenticateSession, requireAdminPrivileges, requireSuperAdminPrivileges } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';
import * as holidayController from '../controllers/holidayController.js';
import * as categoryController from '../controllers/categoryController.js';
import * as departmentController from '../controllers/departmentController.js';
import * as presenceController from '../controllers/presenceController.js';
import { executeDailyTeamsNotifications } from '../services/notificationService.js';

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
