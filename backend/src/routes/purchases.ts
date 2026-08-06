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

// SUPPLIERS
router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const supplierSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional()
});

router.post('/suppliers', async (req: any, res) => {
  try {
    const data = supplierSchema.parse(req.body);
    const supplier = await prisma.supplier.create({ data });
    await prisma.auditLog.create({
      data: { userId: req.user.id, module: 'Supplier', action: 'Create', newData: JSON.stringify(supplier) }
    });
    res.status(201).json(supplier);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.format() });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PURCHASE ORDERS
router.get('/orders', async (req, res) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: { supplier: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const poSchema = z.object({
  supplierId: z.number().int(),
  totalAmount: z.number().positive(),
  status: z.string().optional(),
  notes: z.string().optional()
});

router.post('/orders', async (req: any, res) => {
  try {
    const data = poSchema.parse(req.body);
    const order = await prisma.purchaseOrder.create({ data });
    await prisma.auditLog.create({
      data: { userId: req.user.id, module: 'PurchaseOrder', action: 'Create', newData: JSON.stringify(order) }
    });
    res.status(201).json(order);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.format() });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/orders/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = poSchema.parse(req.body);
    const order = await prisma.purchaseOrder.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: { userId: req.user.id, module: 'PurchaseOrder', action: 'Update', newData: JSON.stringify(order) }
    });
    res.json(order);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.format() });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
