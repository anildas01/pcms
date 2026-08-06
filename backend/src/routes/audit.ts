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

// GET all audit logs
router.get('/', async (req, res) => {
  try {
    // Only fetch the last 100 logs for performance
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    // We need to fetch user details manually since we didn't add a relation in schema.prisma for AuditLog -> User.
    // In a real app we'd add the relation, but this works fine for the MVP.
    const userIds = [...new Set(logs.map(l => l.userId).filter(id => id !== null))] as number[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const enrichedLogs = logs.map(log => ({
      ...log,
      user: log.userId ? userMap.get(log.userId) : null
    }));

    res.json(enrichedLogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
