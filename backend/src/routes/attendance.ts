import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Middleware to protect routes
router.use((req: any, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded; // { id, email, roleId }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// GET all attendance records
router.get('/', async (req, res) => {
  try {
    const records = await prisma.attendance.findMany({
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET today's attendance for the logged in user
router.get('/today', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const record = await prisma.attendance.findFirst({
      where: {
        userId,
        date: { gte: startOfDay, lte: endOfDay }
      }
    });

    res.json({ record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST clock in
router.post('/clock-in', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // Check if already clocked in today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let record = await prisma.attendance.findFirst({
      where: { userId, date: { gte: startOfDay, lte: endOfDay } }
    });

    if (record) {
      return res.status(400).json({ error: 'Already clocked in today' });
    }

    record = await prisma.attendance.create({
      data: {
        userId,
        date: now,
        clockIn: now,
        status: 'Present'
      }
    });

    // Also log this in Audit Trail
    await prisma.auditLog.create({
      data: {
        userId,
        module: 'Attendance',
        action: 'Clock In',
        reason: 'User started shift'
      }
    });

    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST clock out
router.post('/clock-out', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let record = await prisma.attendance.findFirst({
      where: { userId, date: { gte: startOfDay, lte: endOfDay } }
    });

    if (!record) {
      return res.status(400).json({ error: 'No clock-in record found for today' });
    }

    if (record.clockOut) {
      return res.status(400).json({ error: 'Already clocked out today' });
    }

    record = await prisma.attendance.update({
      where: { id: record.id },
      data: { clockOut: now }
    });

    // Also log this in Audit Trail
    await prisma.auditLog.create({
      data: {
        userId,
        module: 'Attendance',
        action: 'Clock Out',
        reason: 'User ended shift'
      }
    });

    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
