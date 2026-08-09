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

// GET all equipment
router.get('/', async (req, res) => {
  try {
    const equipment = await prisma.equipment.findMany({
      orderBy: { name: 'asc' },
      include: {
        assignments: {
          where: { status: 'In Use' },
          include: { patient: true }
        }
      }
    });

    const enhanced = equipment.map((eq: any) => {
      const inUseCount = eq.assignments.reduce((sum: number, a: any) => sum + a.quantity, 0);
      return {
        ...eq,
        availableNow: Math.max(0, eq.quantity - inUseCount)
      };
    });

    res.json(enhanced);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const equipmentSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  quantity: z.number().int().optional(),
  condition: z.string().optional(),
  conditions: z.record(z.string(), z.number().int().min(0)).optional(),
});

// POST new equipment
router.post('/', async (req: any, res) => {
  try {
    const data = equipmentSchema.parse(req.body);
    let result;

    if (data.conditions && Object.keys(data.conditions).length > 0) {
      const createdEquipments = [];
      for (const [cond, qty] of Object.entries(data.conditions as Record<string, number>)) {
        if (qty > 0) {
          const existing = await prisma.equipment.findFirst({
            where: { name: data.name, type: data.type, condition: cond }
          });
          if (existing) {
            const updated = await prisma.equipment.update({
              where: { id: existing.id },
              data: { quantity: existing.quantity + qty }
            });
            createdEquipments.push(updated);
          } else {
            const created = await prisma.equipment.create({
              data: { name: data.name, type: data.type, condition: cond, quantity: qty }
            });
            createdEquipments.push(created);
          }
        }
      }
      result = createdEquipments;
    } else {
      const equipment = await prisma.equipment.create({ 
        data: {
          name: data.name,
          type: data.type,
          quantity: data.quantity || 1,
          condition: data.condition || 'Good'
        }
      });
      result = equipment;
    }
    
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Equipment',
        action: 'Add',
        newData: JSON.stringify(result),
        reason: 'Added new equipment (batch or single)'
      }
    });

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Equipment Added',
        message: `Equipment ${data.name} was successfully added.`
      }
    });

    res.status(201).json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.format() });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT (update) equipment
router.put('/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = equipmentSchema.parse(req.body);

    const oldEquipment = await prisma.equipment.findUnique({ where: { id } });

    const equipment = await prisma.equipment.update({
      where: { id },
      data
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Equipment',
        action: 'Edit',
        oldData: JSON.stringify(oldEquipment),
        newData: JSON.stringify(equipment),
        reason: 'Updated equipment details'
      }
    });

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Equipment Updated',
        message: `Equipment ${equipment.name} details were updated.`
      }
    });

    res.json(equipment);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.format() });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE equipment
router.delete('/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const oldEquipment = await prisma.equipment.findUnique({ where: { id } });
    if (!oldEquipment) return res.status(404).json({ error: 'Equipment not found' });

    await prisma.equipment.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Equipment',
        action: 'Delete',
        oldData: JSON.stringify(oldEquipment),
        reason: `Deleted equipment: ${oldEquipment.name}`
      }
    });

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Equipment Deleted',
        message: `Equipment ${oldEquipment.name} was successfully deleted.`
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST assign equipment
router.post('/:id/assign', async (req: any, res) => {
  try {
    const equipmentId = parseInt(req.params.id);
    const { patientId, quantity, assignedAt } = req.body;
    
    if (!patientId || !quantity) return res.status(400).json({ error: 'Missing patientId or quantity' });

    const equipment = await prisma.equipment.findUnique({ 
      where: { id: equipmentId },
      include: { assignments: { where: { status: 'In Use' } } }
    });

    if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

    const inUseCount = equipment.assignments.reduce((sum: number, a: any) => sum + a.quantity, 0);
    const availableNow = equipment.quantity - inUseCount;

    if (quantity > availableNow) {
      return res.status(400).json({ error: 'Not enough equipment available' });
    }

    const assignment = await prisma.equipmentAssignment.create({
      data: {
        equipmentId,
        patientId,
        quantity,
        status: 'In Use',
        ...(assignedAt && { assignedAt: new Date(assignedAt) })
      }
    });

    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST return equipment
router.post('/return/:assignmentId', async (req: any, res) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId);
    const { returnCondition } = req.body;
    
    const assignment = await prisma.equipmentAssignment.findUnique({
      where: { id: assignmentId },
      include: { equipment: true }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (returnCondition && returnCondition !== assignment.equipment.condition) {
      // Decrement the original equipment bin
      await prisma.equipment.update({
        where: { id: assignment.equipment.id },
        data: { quantity: Math.max(0, assignment.equipment.quantity - assignment.quantity) }
      });

      // Find or create the new condition bin
      const existingNewCond = await prisma.equipment.findFirst({
        where: { 
          name: assignment.equipment.name, 
          type: assignment.equipment.type, 
          condition: returnCondition 
        }
      });

      if (existingNewCond) {
        await prisma.equipment.update({
          where: { id: existingNewCond.id },
          data: { quantity: existingNewCond.quantity + assignment.quantity }
        });
      } else {
        await prisma.equipment.create({
          data: {
            name: assignment.equipment.name,
            type: assignment.equipment.type,
            condition: returnCondition,
            quantity: assignment.quantity
          }
        });
      }
    }

    const updatedAssignment = await prisma.equipmentAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'Returned',
        returnedAt: new Date()
      }
    });

    res.json(updatedAssignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
