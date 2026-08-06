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

// GET all active sessions for user
router.get('/sessions', async (req: any, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { 
        userId: req.user.id,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE / revoke a session
router.delete('/sessions/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const session = await prisma.session.findUnique({ where: { id } });
    
    if (!session || session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.session.update({
      where: { id },
      data: { isActive: false }
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, module: 'Security', action: 'Revoke Session', reason: `Revoked access for device ${session.device}` }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
