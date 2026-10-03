import { Request, Response, NextFunction } from 'express';
import { db } from '../db.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    picture?: string;
    promptpay?: string;
    google_id?: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.headers['x-auth-token'] as string);

  if (!token) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนเข้าถึงข้อมูล' });
  }

  try {
    const session = db.prepare(`
      SELECT s.token, u.id, u.email, u.name, u.picture, u.promptpay, u.google_id
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).get(token) as any;

    if (!session) {
      return res.status(401).json({ error: 'เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' });
    }

    req.user = {
      id: session.id,
      email: session.email,
      name: session.name,
      picture: session.picture,
      promptpay: session.promptpay,
      google_id: session.google_id,
    };

    next();
  } catch (err: any) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' });
  }
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.headers['x-auth-token'] as string);

  if (token) {
    try {
      const session = db.prepare(`
        SELECT s.token, u.id, u.email, u.name, u.picture, u.promptpay, u.google_id
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > datetime('now')
      `).get(token) as any;

      if (session) {
        req.user = {
          id: session.id,
          email: session.email,
          name: session.name,
          picture: session.picture,
          promptpay: session.promptpay,
          google_id: session.google_id,
        };
      }
    } catch {}
  }
  next();
}
