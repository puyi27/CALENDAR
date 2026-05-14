import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthRequest, UserPayload } from '../types/index.js';

export const authenticateSession = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: "Access Denied" });
    return;
  }

  jwt.verify(token, config.SECRET_KEY, (err, user) => {
    if (err) {
      res.status(403).json({ error: "Invalid Token" });
      return;
    }
    req.user = user as UserPayload;
    next();
  });
};

export const requireAdminPrivileges = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const role = req.user?.role?.toLowerCase();
  if (role !== 'admin' && role !== 'superadmin') {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
};

export const requireSuperAdminPrivileges = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role?.toLowerCase() !== 'superadmin') {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
};
