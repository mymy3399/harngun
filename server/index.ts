import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';

import { initDb } from './db.js';
import { seedInitialData } from './seed.js';

import { tripsRouter } from './routes/trips.js';
import { membersRouter } from './routes/members.js';
import { expensesRouter } from './routes/expenses.js';
import { settlementsRouter } from './routes/settlements.js';
import { balancesRouter } from './routes/balances.js';
import { logsRouter } from './routes/logs.js';
import { authRouter } from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Prepare uploads directory
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage configuration for receipt images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve static uploads
app.use('/uploads', express.static(UPLOADS_DIR));

import { requireAuth } from './middleware/auth.js';

// Image upload endpoint (protected)
app.post('/api/upload', requireAuth, upload.single('receipt'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.filename });
});

// Mount modular API routers
app.use('/api/auth', authRouter);
app.use('/api/trips', tripsRouter); // Has its own public invite preview and requireAuth
app.use('/api/trips/:tripId/members', requireAuth, membersRouter);
app.use('/api/trips/:tripId/expenses', requireAuth, expensesRouter);
app.use('/api/trips/:tripId/settlements', requireAuth, settlementsRouter);
app.use('/api/trips/:tripId/balances', requireAuth, balancesRouter);
app.use('/api/trips/:tripId/logs', requireAuth, logsRouter);

// Serve frontend static build if available (production mode)
const CLIENT_DIST = path.resolve(__dirname, '../dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

// Initialize database & seed
initDb();
seedInitialData();

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Harngun API Server running on http://0.0.0.0:${PORT}`);
});
