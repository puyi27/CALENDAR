import { Request, Response } from 'express';
import { pool } from '../db/pool';

export const getHolidays = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query("SELECT to_char(date, 'YYYY-MM-DD') as date, name_holiday FROM holidays ORDER BY date ASC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createHoliday = async (req: Request, res: Response): Promise<void> => {
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
};

export const bulkCreateHolidays = async (req: Request, res: Response): Promise<void> => {
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
};

export const deleteHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query("DELETE FROM holidays WHERE date = $1", [req.params.date]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
