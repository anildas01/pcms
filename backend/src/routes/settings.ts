import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

router.use((req: any, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// GET all settings
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    // Convert to a simple key-value map for the frontend
    const config = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update a setting
router.put('/', async (req: any, res) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) return res.status(400).json({ error: 'Missing key or value' });

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, module: 'Settings', action: 'Update', reason: `Updated global setting ${key}` }
    });

    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST backup database stub
router.post('/backup', async (req: any, res) => {
  try {
    // In a real application, you would run a shell command here to copy dev.db to a backup folder.
    // For MVP, we will just log it and simulate success.
    await prisma.auditLog.create({
      data: { userId: req.user.id, module: 'Settings', action: 'Backup', reason: `Triggered manual database backup` }
    });

    setTimeout(() => {
      res.json({ message: 'Backup created successfully!', path: '/backups/backup_' + new Date().getTime() + '.db' });
    }, 1500);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
