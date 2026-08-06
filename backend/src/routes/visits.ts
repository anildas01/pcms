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

// GET all visits
router.get('/', async (req, res) => {
  try {
    const visits = await prisma.visit.findMany({
      include: {
        patient: { select: { name: true, address: true } },
        nurse: { select: { name: true } },
        medicines: {
          include: {
            medicine: { select: { name: true, unit: true } }
          }
        },
        equipment: {
          include: {
            equipment: { select: { name: true, type: true } }
          }
        }
      },
      orderBy: { date: 'asc' }
    });
    res.json(visits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const visitSchema = z.object({
  patientId: z.number().int(),
  nurseId: z.number().int(),
  date: z.string().transform((str) => new Date(str)),
  notes: z.string().optional(),
  medicines: z.array(z.object({
    id: z.number().int(),
    quantity: z.number().int().min(1)
  })).optional(),
  equipment: z.array(z.object({
    id: z.number().int(),
    action: z.enum(["Given", "Taken Back"])
  })).optional()
});

// POST new visit
router.post('/', async (req, res) => {
  try {
    const data = visitSchema.parse(req.body);
    
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Visit
      const visit = await tx.visit.create({
        data: {
          patientId: data.patientId,
          nurseId: data.nurseId,
          date: data.date,
          notes: data.notes
        }
      });
      
      // 2. Process Medicines
      if (data.medicines && data.medicines.length > 0) {
        for (const med of data.medicines) {
          const medicineRecord = await tx.medicine.findUnique({ where: { id: med.id } });
          if (!medicineRecord || medicineRecord.quantity < med.quantity) {
            throw new Error(`Insufficient stock for medicine ID ${med.id}`);
          }
          
          await tx.medicine.update({
            where: { id: med.id },
            data: { quantity: medicineRecord.quantity - med.quantity }
          });
          
          await tx.visitMedicine.create({
            data: {
              visitId: visit.id,
              medicineId: med.id,
              quantity: med.quantity
            }
          });
        }
      }
      
      // 3. Process Equipment
      if (data.equipment && data.equipment.length > 0) {
        for (const eq of data.equipment) {
          const equipmentRecord = await tx.equipment.findUnique({ 
            where: { id: eq.id },
            include: { assignments: { where: { status: 'In Use' } } }
          });
          if (!equipmentRecord) {
            throw new Error(`Equipment ID ${eq.id} not found`);
          }
          
          if (eq.action === 'Given') {
            const inUseCount = equipmentRecord.assignments.reduce((sum: number, a: any) => sum + a.quantity, 0);
            if (1 > equipmentRecord.quantity - inUseCount) {
              throw new Error(`Equipment ${equipmentRecord.name} is not available to be given.`);
            }
            await tx.equipmentAssignment.create({
              data: {
                equipmentId: eq.id,
                patientId: data.patientId,
                quantity: 1,
                status: 'In Use'
              }
            });
          } else if (eq.action === 'Taken Back') {
            const assignment = await tx.equipmentAssignment.findFirst({
              where: { equipmentId: eq.id, patientId: data.patientId, status: 'In Use' }
            });
            if (assignment) {
              await tx.equipmentAssignment.update({
                where: { id: assignment.id },
                data: { status: 'Returned', returnedAt: new Date() }
              });
            }
          }
          
          await tx.visitEquipment.create({
            data: {
              visitId: visit.id,
              equipmentId: eq.id,
              action: eq.action
            }
          });
        }
      }
      // 4. Create Notification for the Nurse
      await tx.notification.create({
        data: {
          userId: data.nurseId,
          title: 'New Visit Assigned',
          message: `You have been assigned a new visit on ${data.date.toLocaleDateString()}`
        }
      });
      
      return visit;
    });
    
    res.status(201).json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.format() });
    }
    console.error(err);
    res.status(400).json({ error: err.message || 'Internal server error' });
  }
});

// PUT (update) visit (restricted to only update date and notes to protect inventory)
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = visitSchema.parse(req.body);
    const visit = await prisma.visit.update({
      where: { id },
      data: {
        date: data.date,
        notes: data.notes
      }
    });

    await prisma.notification.create({
      data: {
        userId: visit.nurseId,
        title: 'Visit Updated',
        message: `Your assigned visit on ${new Date(visit.date).toLocaleDateString()} has been updated.`
      }
    });

    res.json(visit);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.format() });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE visit
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        medicines: true,
        equipment: true
      }
    });

    if (!visit) return res.status(404).json({ error: 'Visit not found' });

    await prisma.$transaction(async (tx) => {
      // 1. Restore medicine quantities
      for (const vm of visit.medicines) {
        await tx.medicine.update({
          where: { id: vm.medicineId },
          data: { quantity: { increment: vm.quantity } }
        });
      }

      // 2. Restore equipment status by reverting assignments
      for (const ve of visit.equipment) {
        if (ve.action === 'Given') {
          // They were given equipment, so we must delete the active assignment
          const assignment = await tx.equipmentAssignment.findFirst({
            where: { equipmentId: ve.equipmentId, patientId: visit.patientId, status: 'In Use' },
            orderBy: { assignedAt: 'desc' }
          });
          if (assignment) {
            await tx.equipmentAssignment.delete({ where: { id: assignment.id } });
          }
        }
      }

      // 3. Delete visit (cascade will delete VisitMedicine and VisitEquipment)
      await tx.visit.delete({ where: { id } });

      // 4. Create Notification
      await tx.notification.create({
        data: {
          userId: visit.nurseId,
          title: 'Visit Cancelled',
          message: `Your assigned visit on ${new Date(visit.date).toLocaleDateString()} has been cancelled.`
        }
      });
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
