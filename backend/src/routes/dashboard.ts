import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
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

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    // 1. Total Active Patients
    const totalPatients = await prisma.patient.count({
      where: { status: 'Active' }
    });

    // 2. Low Stock Medicines
    const lowStockMedicines = await prisma.medicine.count({
      where: {
        OR: [
          { quantity: { lt: 20 } },
          { status: 'Low Stock' },
          { status: 'Out of Stock' }
        ]
      }
    });

    // 3. Active Equipment (In Use)
    const activeEquipment = await prisma.equipmentAssignment.count({
      where: { status: 'In Use' }
    });

    // 4. Today's Visits
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysVisits = await prisma.visit.count({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    res.json({
      totalPatients,
      lowStockMedicines,
      activeEquipment,
      todaysVisits
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
