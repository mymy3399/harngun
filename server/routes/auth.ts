import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const authRouter = Router();

// Password hashing helpers using native crypto
function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}

function createSession(userId: string): { token: string; expiresAt: string } {
  const token = crypto.randomBytes(32).toString('hex');
  // Session lasts 30 days
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(token, userId, expiresAt);

  return { token, expiresAt };
}

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

// POST /api/auth/register - Email & Password Registration
authRouter.post('/register', (req, res) => {
  try {
    const { email, password, name, promptpay } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'กรุณากรอกอีเมล' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อของคุณ' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบ' });
    }

    const { hash, salt } = hashPassword(password);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;

    db.prepare(`
      INSERT INTO users (id, email, password_hash, salt, name, picture, promptpay, created_at, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(userId, cleanEmail, hash, salt, name.trim(), avatar, promptpay?.trim() || '');

    const user = db.prepare('SELECT id, email, name, picture, promptpay, created_at FROM users WHERE id = ?').get(userId) as any;
    const session = createSession(userId);

    res.status(201).json({
      token: session.token,
      user,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login - Email & Password Login
authRouter.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;

    if (!user || !user.password_hash || !user.salt) {
      return res.status(400).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      return res.status(400).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
    const session = createSession(user.id);

    res.json({
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        promptpay: user.promptpay,
        google_id: user.google_id,
        created_at: user.created_at,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/google - Real Google Login with Persistent Session Token
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
        return res.status(400).json({ error: 'Google credential ไม่ถูกต้อง' });
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
      return res.status(400).json({ error: 'กรุณาส่งข้อมูล Google Login' });
    }

    email = email.toLowerCase().trim();

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (user) {
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
      const userId = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      db.prepare(`
        INSERT INTO users (id, google_id, email, name, picture, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(userId, googleId || null, email, name, picture);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }

    // Create session token
    const session = createSession(user.id);

    res.json({
      token: session.token,
      user: {
        id: user.id,
        google_id: user.google_id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        promptpay: user.promptpay,
        created_at: user.created_at,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me - Verify current session & return user
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout - Invalidate session
authRouter.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.headers['x-auth-token'] as string);

  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
  res.json({ success: true });
});

// PUT /api/auth/profile - Update user profile
authRouter.put('/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { name, promptpay, picture } = req.body;
    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          promptpay = COALESCE(?, promptpay),
          picture = COALESCE(?, picture)
      WHERE id = ?
    `).run(name?.trim(), promptpay?.trim(), picture, req.user!.id);

    const updated = db.prepare('SELECT id, email, name, picture, promptpay, google_id, created_at FROM users WHERE id = ?').get(req.user!.id);
    res.json({ user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/config - Provide Google Client ID
authRouter.get('/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  });
});

// POST /api/auth/config/google-client-id - Save Google Client ID
authRouter.post('/config/google-client-id', (req, res) => {
  try {
    const { googleClientId } = req.body;
    const cleanId = (googleClientId || '').trim();

    process.env.GOOGLE_CLIENT_ID = cleanId;

    // Persist to .env file
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('GOOGLE_CLIENT_ID=')) {
        envContent = envContent.replace(/GOOGLE_CLIENT_ID=.*/g, `GOOGLE_CLIENT_ID=${cleanId}`);
      } else {
        envContent += `\nGOOGLE_CLIENT_ID=${cleanId}\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
    }

    res.json({
      success: true,
      googleClientId: cleanId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
