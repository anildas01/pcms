import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
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

// GET all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Manual join with users for MVP since no relation in schema
    const userIds = [...new Set(tasks.map(t => t.assignedTo).filter(id => id !== null))] as number[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, role: { select: { name: true } } }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const enrichedTasks = tasks.map(t => ({
      ...t,
      assignee: t.assignedTo ? userMap.get(t.assignedTo) : null
    }));

    res.json(enrichedTasks);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignedTo: z.number().int().optional().nullable(),
  status: z.string().optional(),
  dueDate: z.string().optional().transform((val) => val ? new Date(val) : null),
});

// POST new task
router.post('/', async (req: any, res) => {
  try {
    const data = taskSchema.parse(req.body);
    const task = await prisma.task.create({ data });
    await prisma.auditLog.create({
      data: { userId: req.user.id, module: 'Task', action: 'Create', newData: JSON.stringify(task) }
    });
    res.status(201).json(task);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.format() });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update task
router.put('/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = taskSchema.parse(req.body);
    const task = await prisma.task.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: { userId: req.user.id, module: 'Task', action: 'Update', newData: JSON.stringify(task) }
    });
    res.json(task);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.format() });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
