import { Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { pool } from '../db/pool.js';
import { AuthRequest } from '../types/index.js';

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

export const getUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const executableQuery = `${CONSTRUCT_USERS_PRESENCE_QUERY} ORDER BY u.department ASC, u.full_name ASC`;
    const { rows: fetchedUsers } = await pool.query(executableQuery);
    res.json(fetchedUsers.map(({ password: _redactedPassword, ...userProps }) => userProps));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { full_name, email, alias, phoneNumber, phone_number, work, role, department, password, default_category_id, can_work_weekends } = req.body;
  const normalizedPhone = phoneNumber || phone_number || null;
  const holdsSuperAdminRights = req.user!.role?.toLowerCase() === 'superadmin';
  const assignedDepartment = holdsSuperAdminRights ? (department || 'hub') : req.user!.department;

  try {
    if (!password) {
      res.status(400).json({ error: "Password is required" });
      return;
    }

    const existingEmailValidation = await pool.query('SELECT id_user FROM users WHERE email = $1', [email]);
    if ((existingEmailValidation.rowCount ?? 0) > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

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
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { full_name, email, alias, phoneNumber, phone_number, work, role, department, password, avatar, description, status, theme, language, default_category_id, can_work_weekends } = req.body;
  const normalizedPhone = phoneNumber || phone_number || null;
  const holdsSuperAdminRights = req.user!.role?.toLowerCase() === 'superadmin';
  const representsSelfMutation = String(req.user!.id_user) === String(id);

  try {
    if (!holdsSuperAdminRights && !representsSelfMutation) {
      const crossDepartmentValidation = await pool.query('SELECT department FROM users WHERE id_user = $1', [id]);
      if ((crossDepartmentValidation.rowCount ?? 0) === 0 || crossDepartmentValidation.rows[0].department !== req.user!.department) {
        res.status(403).json({ error: "Unauthorized access to cross-department records" });
        return;
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

    if ((executionResult.rowCount ?? 0) === 0) {
      res.status(404).json({ error: "User entity not found" });
      return;
    }

    const { password: _redactedPassword, ...securedUserPayload } = executionResult.rows[0];
    res.json(securedUserPayload);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const holdsSuperAdminRights = req.user!.role?.toLowerCase() === 'superadmin';
  try {
    if (!holdsSuperAdminRights) {
      const crossDepartmentValidation = await pool.query('SELECT department FROM users WHERE id_user = $1', [req.params.id]);
      if ((crossDepartmentValidation.rowCount ?? 0) === 0 || crossDepartmentValidation.rows[0].department !== req.user!.department) {
        res.status(403).json({ error: "Unauthorized access to cross-department records" });
        return;
      }
    }
    const executionResult = await pool.query('DELETE FROM users WHERE id_user = $1', [req.params.id]);
    if ((executionResult.rowCount ?? 0) === 0) {
      res.status(404).json({ error: "User entity not found" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
