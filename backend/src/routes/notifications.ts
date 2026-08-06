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

// GET all notifications for the logged in user
router.get('/', async (req: any, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT mark notification as read
router.put('/:id/read', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
