import { Request, Response } from 'express';
import { pool } from '../db/pool';

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows: fetchedCategories } = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(fetchedCategories);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
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
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, name_en, name_es, icon } = req.body;
    const { rows: executionResult } = await pool.query(
      'UPDATE categories SET name=$1, name_en=$2, name_es=$3, icon=$4 WHERE id_category=$5 RETURNING *',
      [name, name_en, name_es, icon, req.params.id]
    );
    if (executionResult.length === 0) {
      res.status(404).json({ error: "Category entity not found" });
      return;
    }
    res.json(executionResult[0]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM categories WHERE id_category = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
