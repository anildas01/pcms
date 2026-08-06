import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
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
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// GET all invoices
router.get('/', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        patient: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(invoices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const invoiceSchema = z.object({
  patientId: z.number().int(),
  amount: z.number().positive(),
  status: z.string().optional(),
  dueDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  description: z.string().optional()
});

// POST new invoice
router.post('/', async (req, res) => {
  try {
    const data = invoiceSchema.parse(req.body);
    const invoice = await prisma.invoice.create({ data });
    res.status(201).json(invoice);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.format() });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT (update) invoice
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = invoiceSchema.parse(req.body);
    const invoice = await prisma.invoice.update({
      where: { id },
      data
    });
    res.json(invoice);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.format() });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
