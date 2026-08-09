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

// GET all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(suppliers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const supplierSchema = z.object({
  name: z.string().min(1)
});

// POST new supplier
router.post('/', async (req: any, res) => {
  try {
    const data = supplierSchema.parse(req.body);
    
    // Check if exists
    const existing = await prisma.supplier.findUnique({ where: { name: data.name } });
    if (existing) {
      return res.status(400).json({ error: 'Supplier already exists' });
    }

    const supplier = await prisma.supplier.create({ data });
    
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Supplier',
        action: 'Add',
        newData: JSON.stringify(supplier),
        reason: 'Added new supplier'
      }
    });

    res.status(201).json(supplier);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.format() });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update supplier
router.put('/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = supplierSchema.parse(req.body);
    
    const oldSupplier = await prisma.supplier.findUnique({ where: { id } });
    if (!oldSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check if new name already exists
    if (data.name !== oldSupplier.name) {
      const existing = await prisma.supplier.findUnique({ where: { name: data.name } });
      if (existing) {
        return res.status(400).json({ error: 'Another supplier with this name already exists' });
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name: data.name }
    });
    
    // Update medicines that had the old supplier name
    if (oldSupplier.name !== data.name) {
      await prisma.medicine.updateMany({
        where: { supplier: oldSupplier.name },
        data: { supplier: data.name }
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Supplier',
        action: 'Update',
        oldData: JSON.stringify(oldSupplier),
        newData: JSON.stringify(supplier),
        reason: 'Updated supplier name'
      }
    });

    res.json(supplier);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.format() });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE supplier
router.delete('/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const oldSupplier = await prisma.supplier.findUnique({ where: { id } });
    if (!oldSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    await prisma.supplier.delete({ where: { id } });

    // Let's nullify it on medicines.
    await prisma.medicine.updateMany({
      where: { supplier: oldSupplier.name },
      data: { supplier: null }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Supplier',
        action: 'Delete',
        oldData: JSON.stringify(oldSupplier),
        reason: 'Deleted supplier'
      }
    });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
