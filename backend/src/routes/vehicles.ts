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

// GET all vehicles
router.get('/', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const vehicleSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  plateNumber: z.string().optional(),
  status: z.string().optional(),
  fuelLevel: z.string().optional(),
  driverId: z.number().int().optional().nullable()
});

// POST new vehicle
router.post('/', async (req: any, res) => {
  try {
    const data = vehicleSchema.parse(req.body);
    const vehicle = await prisma.vehicle.create({ data });
    
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Vehicle',
        action: 'Create',
        newData: JSON.stringify(vehicle),
        reason: 'Added new vehicle to fleet'
      }
    });

    res.status(201).json(vehicle);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.format() });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update vehicle
router.put('/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = vehicleSchema.parse(req.body);
    
    const oldVehicle = await prisma.vehicle.findUnique({ where: { id } });
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Vehicle',
        action: 'Update',
        oldData: JSON.stringify(oldVehicle),
        newData: JSON.stringify(vehicle),
        reason: 'Updated vehicle details'
      }
    });

    res.json(vehicle);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.format() });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
