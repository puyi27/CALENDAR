import { Request, Response } from 'express';
import ical from 'ical-generator';
import { pool } from '../db/pool.js';
import { config } from '../config/index.js';

export const getPresences = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_user, date, id_category } = req.body;
    if (!id_user || !date || !id_category) {
      res.status(400).json({ error: "Missing required identification parameters" });
      return;
    }

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
};

export const bulkPresences = async (req: Request, res: Response): Promise<void> => {
  try {
    const { presences } = req.body;
    if (!Array.isArray(presences)) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }

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
};

export const deletePresence = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_user, date } = req.body;
    if (!id_user || !date) {
      res.status(400).json({ error: "Missing required identification parameters" });
      return;
    }
    await pool.query('DELETE FROM presences WHERE id_user = $1 AND date = $2', [id_user, date]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCalendarIcs = async (req: Request, res: Response): Promise<void> => {
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

    const calendar = ical({ name: `${config.APP_NAME} Presences - ${user.alias || user.full_name}` });

    presencesQuery.rows.forEach(p => {
      calendar.createEvent({
        start: new Date(p.date),
        allDay: true,
        summary: `${p.icon || ''} ${p.name_en || p.name}`.trim(),
      });
    });

    res.writeHead(200, {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="calendar-${user.alias || 'presence'}.ics"`
    });
    res.end(calendar.toString());
  } catch (error) {
    res.status(500).send('Internal server error');
  }
};
