import { Router } from 'express';
import { db } from '../db.js';

export const authRouter = Router();

// Helper to decode JWT payload safely without external deps
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(payloadBase64, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

// POST /api/auth/google - Login or Register with Google
authRouter.post('/google', (req, res) => {
  try {
    const { credential, profile } = req.body;

    let email = '';
    let name = '';
    let picture = '';
    let googleId = '';

    if (credential) {
      const decoded = decodeJwtPayload(credential);
      if (!decoded || !decoded.email) {
        return res.status(400).json({ error: 'Invalid Google credential token' });
      }
      email = decoded.email;
      name = decoded.name || decoded.email.split('@')[0];
      picture = decoded.picture || '';
      googleId = decoded.sub || '';
    } else if (profile && profile.email) {
      email = profile.email;
      name = profile.name || profile.email.split('@')[0];
      picture = profile.picture || '';
      googleId = profile.googleId || profile.sub || '';
    } else {
      return res.status(400).json({ error: 'Google credential or profile is required' });
    }

    email = email.toLowerCase().trim();

    // Check if user already exists
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (user) {
      // Update existing user
      db.prepare(`
        UPDATE users 
        SET name = COALESCE(?, name),
            picture = COALESCE(?, picture),
            google_id = COALESCE(?, google_id),
            last_login = datetime('now')
        WHERE email = ?
      `).run(name, picture, googleId || null, email);
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    } else {
      // Create new user in SQLite
      const userId = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      db.prepare(`
        INSERT INTO users (id, google_id, email, name, picture, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(userId, googleId || null, email, name, picture);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }

    res.json({
      user: {
        id: user.id,
        google_id: user.google_id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        created_at: user.created_at,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me - Fetch user profile
authRouter.get('/me', (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    if (!userId) {
      return res.status(401).json({ user: null });
    }

    const user = db.prepare('SELECT id, google_id, email, name, picture, created_at FROM users WHERE id = ?').get(userId);
    res.json({ user: user || null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/config - Provide Google Client ID to frontend
authRouter.get('/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  });
});
