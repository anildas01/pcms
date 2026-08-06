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

// GET all patients
router.get('/', async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST a new patient
const patientSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().nonnegative().optional().nullable(),
  gender: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  phone: z.string().min(1),
  address: z.string().min(1),
  diagnosis: z.string().optional().nullable(),
  medicalPapers: z.string().optional().nullable(),
  status: z.string().optional(),
});

router.post('/', async (req: any, res) => {
  try {
    const data = patientSchema.parse(req.body);
    const patient = await prisma.patient.create({ data });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Patients',
        action: 'Add',
        newData: JSON.stringify(patient),
        reason: `Added new patient: ${patient.name}`
      }
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Patient Added',
        message: `Patient ${patient.name} was successfully added to the system.`
      }
    });

    res.status(201).json(patient);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.format() });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = patientSchema.parse(req.body);
    
    const oldPatient = await prisma.patient.findUnique({ where: { id } });
    if (!oldPatient) return res.status(404).json({ error: 'Patient not found' });

    const patient = await prisma.patient.update({
      where: { id },
      data
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Patients',
        action: 'Edit',
        oldData: JSON.stringify(oldPatient),
        newData: JSON.stringify(patient),
        reason: `Updated patient details: ${patient.name}`
      }
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Patient Updated',
        message: `Patient ${patient.name}'s details were updated.`
      }
    });

    res.json(patient);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.format() });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const oldPatient = await prisma.patient.findUnique({ where: { id } });
    if (!oldPatient) return res.status(404).json({ error: 'Patient not found' });

    const visitsCount = await prisma.visit.count({ where: { patientId: id } });
    if (visitsCount > 0) {
      return res.status(400).json({ error: 'Cannot delete this patient because they have recorded visits. Please mark them as Discharged instead.' });
    }

    // It's safe to delete if they have no visits. Clean up any empty histories or invoices.
    await prisma.medicalHistory.deleteMany({ where: { patientId: id } });
    await prisma.invoice.deleteMany({ where: { patientId: id } });

    await prisma.patient.delete({ where: { id } });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Patients',
        action: 'Delete',
        oldData: JSON.stringify(oldPatient),
        reason: `Deleted patient: ${oldPatient.name}`
      }
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Patient Deleted',
        message: `Patient ${oldPatient.name} was successfully deleted.`
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET patient's medical history
router.get('/:id/history', async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const history = await prisma.medicalHistory.findMany({
      where: { patientId },
      orderBy: { date: 'desc' }
    });
    
    const visits = await prisma.visit.findMany({
      where: { patientId },
      include: {
        nurse: { select: { name: true } },
        medicines: { include: { medicine: true } },
        equipment: { include: { equipment: true } }
      },
      orderBy: { date: 'desc' }
    });

    const combinedHistory = [
      ...history.map(h => ({
        id: `h_${h.id}`,
        date: h.date,
        type: h.type,
        description: h.description
      })),
      ...visits.map(v => {
        const meds = v.medicines.map(m => `${m.quantity} ${m.medicine.unit} ${m.medicine.name}`).join(', ');
        const eq = v.equipment.map(e => `${e.action} ${e.equipment.name}`).join(', ');
        
        let desc = `Home visit by Nurse ${v.nurse.name}.`;
        if (v.notes) desc += ` Notes: ${v.notes}`;
        if (meds) desc += ` | Medicines: ${meds}`;
        if (eq) desc += ` | Equipment: ${eq}`;

        return {
          id: `v_${v.id}`,
          date: v.date,
          type: 'Home Visit',
          description: desc
        };
      })
    ];

    combinedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(combinedHistory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const historySchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  type: z.string().min(1),
  description: z.string().min(1)
});

// POST new medical history record
router.post('/:id/history', async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const data = historySchema.parse(req.body);
    const history = await prisma.medicalHistory.create({
      data: {
        patientId,
        date: data.date,
        type: data.type,
        description: data.description
      }
    });
    res.status(201).json(history);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.format() });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single patient
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const patient = await prisma.patient.findUnique({
      where: { id }
    });
    if (!patient) return res.status(404).json({ error: 'Not found' });
    res.json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
