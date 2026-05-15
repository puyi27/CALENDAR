import { Request, Response } from 'express';
import { pool } from '../db/pool.js';
import { transmitTeamsNotification } from '../services/notificationService.js';


export const getDepartments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows: fetchedDepartments } = await pool.query('SELECT d.name, d.webhook_url, d.default_category_id, c.name as category_name FROM departments d LEFT JOIN categories c ON d.default_category_id = c.id_category ORDER BY d.name ASC');
    res.json(fetchedDepartments);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, webhook_url, default_category_id } = req.body;
    if (!name) {
      res.status(400).json({ error: "Department identification name is required" });
      return;
    }

    const { rows: insertionResult } = await pool.query(
      'INSERT INTO departments (name, webhook_url, default_category_id) VALUES ($1, $2, $3) RETURNING *',
      [name, webhook_url || null, default_category_id || null]
    );
    res.status(201).json(insertionResult[0]);
  } catch (error: any) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { webhook_url, default_category_id } = req.body;
    const { rows: executionResult } = await pool.query(
      'UPDATE departments SET webhook_url = $1, default_category_id = $2 WHERE name = $3 RETURNING *',
      [webhook_url || null, default_category_id || null, req.params.name]
    );
    if (executionResult.length === 0) {
      res.status(404).json({ error: "Department entity not found" });
      return;
    }
    res.json(executionResult[0]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM departments WHERE name = $1', [req.params.name]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const testWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { webhook_url } = req.body;
    if (!webhook_url) {
      res.status(400).json({ error: "Webhook URL is required" });
      return;
    }

    const testCardBody = [
      {
        type: "TextBlock",
        text: "⚡ PresenceLink: Connection Test",
        weight: "Bolder",
        size: "Large",
        color: "Accent"
      },
      {
        type: "TextBlock",
        text: "This is a test notification to verify that the webhook integration is working correctly.",
        wrap: true,
        spacing: "Small"
      },
      {
        type: "FactSet",
        facts: [
          { title: "Status", value: "Operational ✅" },
          { title: "Timestamp", value: new Date().toLocaleString() }
        ],
        spacing: "Medium"
      }
    ];

    await transmitTeamsNotification(testCardBody, webhook_url);

    res.json({ success: true, message: "Test card sent successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to send test card", details: error.message });
  }
};

