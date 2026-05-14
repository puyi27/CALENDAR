import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { config } from '../config';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const queryResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (queryResult.rowCount === 0) {
      res.status(401).json({ error: "Invalid Credentials" });
      return;
    }

    const authenticatedUser = queryResult.rows[0];
    const passwordMatches = await bcrypt.compare(password, authenticatedUser.password);
    if (!passwordMatches) {
      res.status(401).json({ error: "Invalid Credentials" });
      return;
    }

    const sessionToken = jwt.sign(
      { id_user: authenticatedUser.id_user, role: authenticatedUser.role, department: authenticatedUser.department },
      config.SECRET_KEY,
      { expiresIn: '8h' }
    );

    const { password: _redactedPassword, ...securedUserPayload } = authenticatedUser;
    res.json({ token: sessionToken, user: securedUserPayload });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
