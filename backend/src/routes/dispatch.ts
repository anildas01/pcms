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

// GET all dispatches
router.get('/', async (req, res) => {
  try {
    const dispatches = await prisma.dispatch.findMany({
      include: { vehicle: true },
      orderBy: { dispatchTime: 'desc' }
    });
    
    // Manual join with driver user
    const driverIds = [...new Set(dispatches.map(d => d.driverId).filter(id => id !== null))] as number[];
    const drivers = await prisma.user.findMany({
      where: { id: { in: driverIds } },
      select: { id: true, name: true }
    });
    const driverMap = new Map(drivers.map(u => [u.id, u]));

    const enriched = dispatches.map(d => ({
      ...d,
      driver: d.driverId ? driverMap.get(d.driverId) : null
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const dispatchSchema = z.object({
  vehicleId: z.number().int(),
  driverId: z.number().int().optional().nullable(),
  destination: z.string().min(1),
  status: z.string().optional(),
  notes: z.string().optional()
});

// POST new dispatch
router.post('/', async (req: any, res) => {
  try {
    const data = dispatchSchema.parse(req.body);
    
    // Verify vehicle is available
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle || vehicle.status !== 'Available') {
      return res.status(400).json({ error: 'Vehicle is not available for dispatch' });
    }

    const dispatch = await prisma.dispatch.create({ data });
    
    // Mark vehicle as In Use
    await prisma.vehicle.update({ where: { id: data.vehicleId }, data: { status: 'In Use' } });

    await prisma.auditLog.create({
      data: { userId: req.user.id, module: 'Dispatch', action: 'Create', newData: JSON.stringify(dispatch) }
    });

    res.status(201).json(dispatch);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.format() });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT return dispatch
router.put('/:id/return', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const dispatch = await prisma.dispatch.findUnique({ where: { id } });
    if (!dispatch || dispatch.status === 'Returned') {
      return res.status(400).json({ error: 'Invalid dispatch' });
    }

    const updated = await prisma.dispatch.update({
      where: { id },
      data: { status: 'Returned', returnTime: new Date() }
    });

    // Mark vehicle as Available
    await prisma.vehicle.update({ where: { id: dispatch.vehicleId }, data: { status: 'Available' } });

    await prisma.auditLog.create({
      data: { userId: req.user.id, module: 'Dispatch', action: 'Return', newData: JSON.stringify(updated) }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
