process.env.TZ = "Europe/Rome";
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import fetch from 'node-fetch';
import crypto from 'crypto';
import ical from 'ical-generator';

const { Pool } = pg;

/**
 * PostgreSQL connection pool initialized with the connection string from environment variables.
 * Used for all database interactions within the application.
 */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) throw new Error("JWT_SECRET env variable is required");

const PORT = process.env.PORT || 4000;
const WEB_URL = process.env.WA_WEB_URL || "https://faecalendar.vercel.app";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '5mb' }));

interface AuthRequest extends Request {
  user?: { id_user: number; role: string; department: string };
}

/**
 * Ensures all required database tables and columns exist on application startup.
 * Handles schema migrations such as adding default categories, calendar tokens, 
 * and weekend work flags.
 * 
 * @async
 * @returns {Promise<void>}
 */
const initializeDatabase = async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS departments (name VARCHAR(255) PRIMARY KEY, webhook_url TEXT);`);
    await pool.query(`ALTER TABLE departments ADD COLUMN IF NOT EXISTS default_category_id INT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS default_category_id INT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS calendar_token VARCHAR(255) UNIQUE;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS can_work_weekends BOOLEAN DEFAULT FALSE;`);
    await pool.query(`CREATE TABLE IF NOT EXISTS holidays (date DATE PRIMARY KEY, name_holiday VARCHAR(255));`);
    try { await pool.query(`ALTER TABLE holidays RENAME COLUMN name TO name_holiday;`); } catch(e) {}
    await pool.query(`UPDATE users SET calendar_token = md5(random()::text || clock_timestamp()::text) WHERE calendar_token IS NULL;`);
    await pool.query(`INSERT INTO departments (name) SELECT DISTINCT department FROM users WHERE department IS NOT NULL AND department != '' ON CONFLICT (name) DO NOTHING;`);
  } catch (error) {
    console.error("DB Error:", error);
  }
};
initializeDatabase();

/**
 * Express middleware to verify the JWT token provided in the 'Authorization' header.
 * Attaches the decoded user data to `req.user` if valid.
 * 
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next middleware function.
 */
const authenticateSession = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) { res.status(401).json({ error: "Access Denied" }); return; }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) { res.status(403).json({ error: "Invalid Token" }); return; }
    req.user = user as AuthRequest['user'];
    next();
  });
};

const requireAdminPrivileges = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const role = req.user?.role?.toLowerCase();
  if (role !== 'admin' && role !== 'superadmin') {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  next();
};

const requireSuperAdminPrivileges = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role?.toLowerCase() !== 'superadmin') {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  next();
};

app.get('/api/holidays', authenticateSession, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query("SELECT to_char(date, 'YYYY-MM-DD') as date, name_holiday FROM holidays ORDER BY date ASC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/holidays', authenticateSession, requireSuperAdminPrivileges, async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, name_holiday } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO holidays (date, name_holiday) VALUES ($1, $2) ON CONFLICT (date) DO UPDATE SET name_holiday = EXCLUDED.name_holiday RETURNING to_char(date, 'YYYY-MM-DD') as date, name_holiday",
      [date, name_holiday]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/holidays/bulk', authenticateSession, requireSuperAdminPrivileges, async (req: Request, res: Response): Promise<void> => {
  try {
    const { holidays } = req.body;
    for (const h of holidays) {
      await pool.query(
        "INSERT INTO holidays (date, name_holiday) VALUES ($1, $2) ON CONFLICT (date) DO NOTHING",
        [h.date, h.name_holiday]
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete('/api/holidays/:date', authenticateSession, requireSuperAdminPrivileges, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query("DELETE FROM holidays WHERE date = $1", [req.params.date]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/api/calendar/:token.ics', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { rows } = await pool.query('SELECT id_user, alias, full_name FROM users WHERE calendar_token = $1', [token]);

    if (rows.length === 0) {
      res.status(404).send('Calendar not found or invalid token');
      return;
    }

    const user = rows[0];

    const presencesQuery = await pool.query(
      `SELECT p.date, c.name, c.icon, c.name_en
       FROM presences p
       JOIN categories c ON p.id_category = c.id_category
       WHERE p.id_user = $1`,
      [user.id_user]
    );

    const calendar = ical({ name: `${process.env.APP_NAME || 'Calendar'} Presences - ${user.alias || user.full_name}` });

    presencesQuery.rows.forEach(p => {
      calendar.createEvent({
        start: new Date(p.date),
        allDay: true,
        summary: `${p.icon || ''} ${p.name_en || p.name}`.trim(),
      });
    });

    res.writeHead(200, {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="calendar-${user.alias || 'fae'}.ics"`
    });
    res.end(calendar.toString());
  } catch (error) {
    res.status(500).send('Internal server error');
  }
});

async function transmitTeamsNotification(cardBodyElements: any[], webhookUrl: string): Promise<void> {
  if (!webhookUrl || webhookUrl.trim() === '') {
    return;
  }
  
  try {
    const payload = {
      type: "message",
      attachments: [{
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          type: "AdaptiveCard",
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          version: "1.2",
          msteams: { width: "Full" }, 
          body: cardBodyElements,
          actions: [
            {
              type: "Action.OpenUrl",
              title: "📅 Open Calendar",
              url: WEB_URL
            }
          ]
        },
      }],
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Teams Webhook Error:", error);
  }
}

/**
 * Core business logic that aggregates user presence for the next workday and 
 * dispatches notifications to configured Microsoft Teams webhooks.
 * 
 * The logic follows these steps:
 * 1. Calculates the next working date.
 * 2. Fetches all users and resolves their presence (Manual > User Default > Dept Default).
 * 3. Groups users by location/category.
 * 4. Generates an Adaptive Card payload.
 * 5. Transmits the payload to each department's webhook.
 * 
 * @async
 */
async function executeDailyTeamsNotifications() {
  const currentDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }));
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const databaseDateString = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' 
  }).format(nextDate);
  
  const displayDateString = new Intl.DateTimeFormat('en-US', { 
    timeZone: 'Europe/Rome', weekday: 'long', day: 'numeric', month: 'long' 
  }).format(nextDate);

  try {
    const { rows: userRecords } = await pool.query(
      `SELECT u.full_name, u.department,
              p.id_category as presence_cat_id,
              pc.name as presence_cat_name, pc.icon as presence_icon, pc.name_en as presence_name_en,
              COALESCE(u.default_category_id, d.default_category_id) as resolved_def_cat_id,
              dc.name as def_cat_name, dc.icon as def_icon, dc.name_en as def_name_en
       FROM users u
       LEFT JOIN departments d ON u.department = d.name
       LEFT JOIN presences p ON u.id_user = p.id_user AND p.date::DATE = $1::DATE
       LEFT JOIN categories pc ON p.id_category = pc.id_category
       LEFT JOIN categories dc ON dc.id_category = COALESCE(u.default_category_id, d.default_category_id)`,
      [databaseDateString]
    );

    const consolidatedUsers = userRecords.map(u => {
       const computedCategoryId = u.presence_cat_id || u.resolved_def_cat_id;
       const computedCategoryName = u.presence_cat_id ? (u.presence_name_en || u.presence_cat_name) : (u.def_name_en || u.def_cat_name);
       const computedIcon = u.presence_cat_id ? u.presence_icon : u.def_icon;
       return { ...u, computedCategoryId, computedCategoryName, computedIcon };
    });

    const { rows: departmentRecords } = await pool.query('SELECT d.name, d.webhook_url, d.default_category_id FROM departments d');
    
    for (const department of departmentRecords) {
      if (!department.webhook_url) continue;

      const currentDepartmentName = department.name;
      const departmentDefaultCategoryId = department.default_category_id;
      const destinationWebhook = department.webhook_url;

      const nativeEmployees = consolidatedUsers.filter(u => u.department === currentDepartmentName);
      const visitingEmployees = consolidatedUsers.filter(u => u.department !== currentDepartmentName && u.computedCategoryId === departmentDefaultCategoryId && departmentDefaultCategoryId !== null);

      const presentInOffice: string[] = [];
      const externalLocationsMap: Record<string, string[]> = {};
      const pendingConfirmation: string[] = [];

      for (const employee of nativeEmployees) {
        if (employee.computedCategoryId) {
          if (departmentDefaultCategoryId && employee.computedCategoryId === departmentDefaultCategoryId) {
            presentInOffice.push(employee.full_name);
          } else {
            let contextIcon = "🏢";
            if (employee.computedIcon === 'Home') contextIcon = "🏠";
            if (employee.computedIcon === 'BeachAccess') contextIcon = "⛱️";
            if (employee.computedIcon === 'Sick') contextIcon = "🤒";
            if (employee.computedIcon === 'Work') contextIcon = "💼";
            
            const groupIdentifier = `${contextIcon} ${employee.computedCategoryName}`;
            if (!externalLocationsMap[groupIdentifier]) externalLocationsMap[groupIdentifier] = [];
            externalLocationsMap[groupIdentifier].push(employee.full_name);
          }
        } else {
          pendingConfirmation.push(employee.full_name);
        }
      }

      let cardBodyElements: any[] = [
        {
          type: "ColumnSet",
          columns: [
            {
              type: "Column",
              width: "stretch",
              items: [
                {
                  type: "TextBlock",
                  text: `📊 PRESENCE STATUS: ${String(currentDepartmentName).toUpperCase()}`,
                  weight: "Bolder",
                  size: "ExtraLarge",
                  color: "Accent",
                  wrap: true
                },
                {
                  type: "TextBlock",
                  text: `🗓️ Date: **${displayDateString.charAt(0).toUpperCase() + displayDateString.slice(1)}**`,
                  isSubtle: true,
                  size: "Medium",
                  spacing: "Small"
                }
              ]
            }
          ]
        }
      ];

      let isFirstSection = true;

      if (departmentDefaultCategoryId && presentInOffice.length > 0) {
        cardBodyElements.push({
          type: "Container",
          spacing: "Large",
          separator: !isFirstSection,
          items: [
            { type: "TextBlock", text: "🏢 IN OFFICE", color: "Good", weight: "Bolder", size: "Large", spacing: "Small" },
            { type: "TextBlock", text: presentInOffice.map(e => `* 👤 **${e}**`).join('\n'), wrap: true, spacing: "Small" }
          ]
        });
        isFirstSection = false;
      }

      if (visitingEmployees.length > 0) {
        cardBodyElements.push({
          type: "Container",
          spacing: "Large",
          separator: !isFirstSection,
          items: [
            { type: "TextBlock", text: "🌟 GUESTS IN HQ", color: "Accent", weight: "Bolder", size: "Large", spacing: "Small" },
            { type: "TextBlock", text: visitingEmployees.map(e => `* 👤 **${e.full_name}** _(${e.department})_`).join('\n'), wrap: true, spacing: "Small" }
          ]
        });
        isFirstSection = false;
      }

      for (const [locationKey, assignedEmployees] of Object.entries(externalLocationsMap)) {
        cardBodyElements.push({
          type: "Container",
          spacing: "Large",
          separator: !isFirstSection,
          items: [
            { type: "TextBlock", text: locationKey.toUpperCase(), color: "Warning", weight: "Bolder", size: "Large", spacing: "Small" },
            { type: "TextBlock", text: assignedEmployees.map(e => `* 👤 **${e}**`).join('\n'), wrap: true, spacing: "Small" }
          ]
        });
        isFirstSection = false;
      }

      if (pendingConfirmation.length > 0) {
        cardBodyElements.push({
          type: "Container",
          spacing: "Large",
          separator: !isFirstSection,
          items: [
            { type: "TextBlock", text: "⚠️ UNCONFIRMED", color: "Attention", weight: "Bolder", size: "Large", spacing: "Small" },
            { type: "TextBlock", text: pendingConfirmation.map(e => `* 👤 **${e}**`).join('\n'), wrap: true, spacing: "Small" }
          ]
        });
        isFirstSection = false;
      }

      cardBodyElements.push({
        type: "Container",
        spacing: "ExtraLarge",
        separator: true,
        items: [
          {
            type: "TextBlock",
            text: "💡 *If you don't specify a location, the system assumes you are at your default base.*",
            isSubtle: true,
            size: "Small",
            wrap: true,
            spacing: "Small"
          }
        ]
      });

      const enableTeams = process.env.ENABLE_TEAMS_WEBHOOKS === 'true';
      if (enableTeams) {
        await transmitTeamsNotification(cardBodyElements, destinationWebhook);
      } else {
        console.log(`Teams notification skipped for ${currentDepartmentName} (Feature disabled)`);
      }
    }
  } catch (error) {
    console.error("Cron Error:", error);
  }
}

app.all('/api/test-webhook', async (req: Request, res: Response) => {
  try {
    await executeDailyTeamsNotifications();
    res.json({ success: true, message: "Test completed." });
  } catch (error) {
    res.status(500).json({ error: "Error", details: String(error) });
  }
});

const CRON_SCHEDULE = process.env.CRON_TIME || "23 14 * * 1-5";

cron.schedule(CRON_SCHEDULE, () => {
  const enableNotifications = process.env.ENABLE_NOTIFICATIONS === 'true';
  if (enableNotifications) {
    executeDailyTeamsNotifications();
  } else {
    console.log("Daily notification cron skipped (ENABLE_NOTIFICATIONS is false)");
  }
}, { timezone: "Europe/Rome" });

app.post('/api/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ error: "Email and password are required" }); return; }

    const queryResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (queryResult.rowCount === 0) { res.status(401).json({ error: "Invalid Credentials" }); return; }

    const authenticatedUser = queryResult.rows[0];
    const passwordMatches = await bcrypt.compare(password, authenticatedUser.password);
    if (!passwordMatches) { res.status(401).json({ error: "Invalid Credentials" }); return; }

    const sessionToken = jwt.sign(
      { id_user: authenticatedUser.id_user, role: authenticatedUser.role, department: authenticatedUser.department },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    const { password: _redactedPassword, ...securedUserPayload } = authenticatedUser;
    res.json({ token: sessionToken, user: securedUserPayload });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const CONSTRUCT_USERS_PRESENCE_QUERY = `
  SELECT u.*, 
    (
      SELECT json_build_object(
        'id_category', c.id_category,
        'name', c.name,
        'name_en', c.name_en,
        'name_es', c.name_es,
        'icon', c.icon
      )
      FROM categories c
      WHERE c.id_category = COALESCE(u.default_category_id, (SELECT default_category_id FROM departments WHERE name = u.department))
    ) as default_category,
    COALESCE(
      (
        SELECT json_agg(json_build_object(
          'id_presence', p.id_presence,
          'date', p.date,
          'categories', json_build_object(
            'id_category', c2.id_category,
            'name', c2.name,
            'name_en', c2.name_en,
            'name_es', c2.name_es,
            'icon', c2.icon
          )
        ))
        FROM presences p
        JOIN categories c2 ON p.id_category = c2.id_category
        WHERE p.id_user = u.id_user
      ),
      '[]'
    ) AS presences
  FROM users u
`;

app.get('/api/users', authenticateSession, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const executableQuery = `${CONSTRUCT_USERS_PRESENCE_QUERY} ORDER BY u.department ASC, u.full_name ASC`;
    const { rows: fetchedUsers } = await pool.query(executableQuery);
    res.json(fetchedUsers.map(({ password: _redactedPassword, ...userProps }) => userProps));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', authenticateSession, requireAdminPrivileges, async (req: AuthRequest, res: Response): Promise<void> => {
  const { full_name, email, alias, phoneNumber, phone_number, work, role, department, password, default_category_id, can_work_weekends } = req.body;
  const normalizedPhone = phoneNumber || phone_number || null;
  const holdsSuperAdminRights = req.user!.role?.toLowerCase() === 'superadmin';
  const assignedDepartment = holdsSuperAdminRights ? (department || 'hub') : req.user!.department;

  try {
    if (!password) { res.status(400).json({ error: "Password is required" }); return; }

    const existingEmailValidation = await pool.query('SELECT id_user FROM users WHERE email = $1', [email]);
    if ((existingEmailValidation.rowCount ?? 0) > 0) { res.status(409).json({ error: "Email already registered" }); return; }

    const cryptographicHash = await bcrypt.hash(password, 12);
    const calendarToken = crypto.randomBytes(32).toString('hex');

    const { rows: insertionResult } = await pool.query(
      `INSERT INTO users (full_name, email, alias, "phoneNumber", work, role, department, password, default_category_id, calendar_token, can_work_weekends)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [full_name, email, alias, normalizedPhone, work, role, assignedDepartment, cryptographicHash, default_category_id || null, calendarToken, can_work_weekends || false]
    );
    
    const { password: _redactedPassword, ...securedUserPayload } = insertionResult[0];
    res.status(201).json(securedUserPayload);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put('/api/users/:id', authenticateSession, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { full_name, email, alias, phoneNumber, phone_number, work, role, department, password, avatar, description, status, theme, language, default_category_id, can_work_weekends } = req.body;
  const normalizedPhone = phoneNumber || phone_number || null;
  const holdsSuperAdminRights = req.user!.role?.toLowerCase() === 'superadmin';
  const representsSelfMutation = String(req.user!.id_user) === String(id);

  try {
    if (!holdsSuperAdminRights && !representsSelfMutation) {
      const crossDepartmentValidation = await pool.query('SELECT department FROM users WHERE id_user = $1', [id]);
      if ((crossDepartmentValidation.rowCount ?? 0) === 0 || crossDepartmentValidation.rows[0].department !== req.user!.department) {
        res.status(403).json({ error: "Unauthorized access to cross-department records" }); return;
      }
    }

    const assignedDepartment = holdsSuperAdminRights ? (department || 'hub') : req.user!.department;
    let executionResult;

    if (password?.trim()) {
      const cryptographicHash = await bcrypt.hash(password, 12);
      executionResult = await pool.query(
        `UPDATE users SET full_name=$1, email=$2, alias=$3, "phoneNumber"=$4, work=$5, role=$6, department=$7,
         avatar=$8, description=$9, status=$10, password=$11, theme=$12, language=$13, default_category_id=$14, can_work_weekends=$15
         WHERE id_user=$16 RETURNING *`,
        [full_name, email, alias, normalizedPhone, work, role, assignedDepartment, avatar, description, status, cryptographicHash, theme, language, default_category_id || null, can_work_weekends || false, id]
      );
    } else {
      executionResult = await pool.query(
        `UPDATE users SET full_name=$1, email=$2, alias=$3, "phoneNumber"=$4, work=$5, role=$6, department=$7,
         avatar=$8, description=$9, status=$10, theme=$11, language=$12, default_category_id=$13, can_work_weekends=$14
         WHERE id_user=$15 RETURNING *`,
        [full_name, email, alias, normalizedPhone, work, role, assignedDepartment, avatar, description, status, theme, language, default_category_id || null, can_work_weekends || false, id]
      );
    }

    if ((executionResult.rowCount ?? 0) === 0) { res.status(404).json({ error: "User entity not found" }); return; }
    
    const { password: _redactedPassword, ...securedUserPayload } = executionResult.rows[0];
    res.json(securedUserPayload);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete('/api/users/:id', authenticateSession, requireAdminPrivileges, async (req: AuthRequest, res: Response): Promise<void> => {
  const holdsSuperAdminRights = req.user!.role?.toLowerCase() === 'superadmin';
  try {
    if (!holdsSuperAdminRights) {
      const crossDepartmentValidation = await pool.query('SELECT department FROM users WHERE id_user = $1', [req.params.id]);
      if ((crossDepartmentValidation.rowCount ?? 0) === 0 || crossDepartmentValidation.rows[0].department !== req.user!.department) {
        res.status(403).json({ error: "Unauthorized access to cross-department records" }); return;
      }
    }
    const executionResult = await pool.query('DELETE FROM users WHERE id_user = $1', [req.params.id]);
    if ((executionResult.rowCount ?? 0) === 0) { res.status(404).json({ error: "User entity not found" }); return; }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/api/categories', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows: fetchedCategories } = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(fetchedCategories);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/categories', authenticateSession, requireSuperAdminPrivileges, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, name_en, name_es, icon } = req.body;
    const { rows: insertionResult } = await pool.query(
      'INSERT INTO categories (name, name_en, name_es, icon) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, name_en, name_es, icon]
    );
    res.status(201).json(insertionResult[0]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put('/api/categories/:id', authenticateSession, requireSuperAdminPrivileges, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, name_en, name_es, icon } = req.body;
    const { rows: executionResult } = await pool.query(
      'UPDATE categories SET name=$1, name_en=$2, name_es=$3, icon=$4 WHERE id_category=$5 RETURNING *',
      [name, name_en, name_es, icon, req.params.id]
    );
    if (executionResult.length === 0) { res.status(404).json({ error: "Category entity not found" }); return; }
    res.json(executionResult[0]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete('/api/categories/:id', authenticateSession, requireSuperAdminPrivileges, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM categories WHERE id_category = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/api/departments', authenticateSession, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows: fetchedDepartments } = await pool.query('SELECT d.name, d.webhook_url, d.default_category_id, c.name as category_name FROM departments d LEFT JOIN categories c ON d.default_category_id = c.id_category ORDER BY d.name ASC');
    res.json(fetchedDepartments);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/departments', authenticateSession, requireSuperAdminPrivileges, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, webhook_url, default_category_id } = req.body;
    if (!name) { res.status(400).json({ error: "Department identification name is required" }); return; }
    
    const { rows: insertionResult } = await pool.query(
      'INSERT INTO departments (name, webhook_url, default_category_id) VALUES ($1, $2, $3) RETURNING *',
      [name, webhook_url || null, default_category_id || null]
    );
    res.status(201).json(insertionResult[0]);
  } catch (error: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put('/api/departments/:name', authenticateSession, requireSuperAdminPrivileges, async (req: Request, res: Response): Promise<void> => {
  try {
    const { webhook_url, default_category_id } = req.body;
    const { rows: executionResult } = await pool.query(
      'UPDATE departments SET webhook_url = $1, default_category_id = $2 WHERE name = $3 RETURNING *',
      [webhook_url || null, default_category_id || null, req.params.name]
    );
    if (executionResult.length === 0) { res.status(404).json({ error: "Department entity not found" }); return; }
    res.json(executionResult[0]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete('/api/departments/:name', authenticateSession, requireSuperAdminPrivileges, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM departments WHERE name = $1', [req.params.name]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/presences', authenticateSession, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id_user, date, id_category } = req.body;
    if (!id_user || !date || !id_category) { res.status(400).json({ error: "Missing required identification parameters" }); return; }

    const { rows: upsertResult } = await pool.query(
      `INSERT INTO presences (id_user, date, id_category)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_user, date) DO UPDATE SET id_category = EXCLUDED.id_category
       RETURNING *`,
      [id_user, date, id_category]
    );
    res.json(upsertResult[0]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/presences/bulk', authenticateSession, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { presences } = req.body;
    if (!Array.isArray(presences)) { res.status(400).json({ error: "Invalid payload" }); return; }

    const queries = presences.map((p: any) =>
      pool.query(
        `INSERT INTO presences (id_user, date, id_category) VALUES ($1, $2, $3) ON CONFLICT (id_user, date) DO UPDATE SET id_category = EXCLUDED.id_category`,
        [p.id_user, p.date, p.id_category]
      )
    );
    await Promise.all(queries);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete('/api/presences', authenticateSession, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id_user, date } = req.body;
    if (!id_user || !date) { res.status(400).json({ error: "Missing required identification parameters" }); return; }
    await pool.query('DELETE FROM presences WHERE id_user = $1 AND date = $2', [id_user, date]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});