import { Request } from 'express';

export interface UserPayload {
  id_user: number;
  role: string;
  department: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}
