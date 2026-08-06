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

// GET all medicines
router.get('/', async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(medicines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const medicineSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().int().nonnegative(),
  unit: z.string().default('units'),
  type: z.string().default('Medicine'),
  expiryDate: z.string().optional().transform((val) => val ? new Date(val) : null),
  status: z.string().optional(),
  reason: z.string().optional()
});

// POST new medicine
router.post('/', async (req: any, res) => {
  try {
    const data = medicineSchema.parse(req.body);
    const medicine = await prisma.medicine.create({ data });
    
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Medicine',
        action: 'Add',
        newData: JSON.stringify(medicine),
        reason: 'Added new medicine'
      }
    });

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Medicine Added',
        message: `Medicine ${medicine.name} was successfully added to inventory.`
      }
    });

    res.status(201).json(medicine);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.format() });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update medicine
router.put('/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = medicineSchema.parse(req.body);
    
    const oldMedicine = await prisma.medicine.findUnique({ where: { id } });
    
    const { reason, ...updateData } = data;

    const medicine = await prisma.medicine.update({
      where: { id },
      data: updateData
    });
    
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Medicine',
        action: 'Edit',
        oldData: JSON.stringify(oldMedicine),
        newData: JSON.stringify(medicine),
        reason: reason || 'Updated medicine stock/details'
      }
    });

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Medicine Updated',
        message: `Medicine ${medicine.name} details were updated.`
      }
    });

    res.json(medicine);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.format() });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE medicine
router.delete('/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const oldMedicine = await prisma.medicine.findUnique({ where: { id } });
    if (!oldMedicine) return res.status(404).json({ error: 'Medicine not found' });

    await prisma.medicine.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Medicine',
        action: 'Delete',
        oldData: JSON.stringify(oldMedicine),
        reason: `Deleted medicine: ${oldMedicine.name}`
      }
    });

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Medicine Deleted',
        message: `Medicine ${oldMedicine.name} was successfully deleted.`
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot delete this item because it has been assigned in one or more patient visits.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
