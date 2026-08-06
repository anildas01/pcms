import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
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

// Helper to convert array of objects to CSV
function toCSV(data: any[]) {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
      if (val instanceof Date) return `"${val.toISOString()}"`;
      return val;
    }).join(',')
  );
  return [headers, ...rows].join('\n');
}

router.get('/patients/csv', async (req, res) => {
  try {
    const patients = await prisma.patient.findMany();
    const csv = toCSV(patients);
    res.header('Content-Type', 'text/csv');
    res.attachment('patients_report.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/inventory/csv', async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany();
    const equipment = await prisma.equipment.findMany();
    
    // Normalize into a single inventory list
    const combined = [
      ...medicines.map(m => ({ Type: 'Medicine', Name: m.name, Status: m.status, Quantity: m.quantity, Unit: m.unit, Expiry: m.expiryDate })),
      ...equipment.map(e => ({ Type: 'Equipment', Name: e.name, Status: e.status, Quantity: 1, Unit: 'item', Expiry: null }))
    ];
    
    const csv = toCSV(combined);
    res.header('Content-Type', 'text/csv');
    res.attachment('inventory_report.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/billing/csv', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({ include: { patient: true } });
    const formatted = invoices.map(inv => ({
      InvoiceID: inv.id,
      PatientName: inv.patient.name,
      Amount: inv.amount,
      Status: inv.status,
      Date: inv.createdAt
    }));
    
    const csv = toCSV(formatted);
    res.header('Content-Type', 'text/csv');
    res.attachment('billing_report.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [patientCount, staffCount, lowStockMedCount, invoiceTotal] = await Promise.all([
      prisma.patient.count(),
      prisma.user.count(),
      prisma.medicine.count({ where: { status: 'Low Stock' } }),
      prisma.invoice.aggregate({ _sum: { amount: true }, where: { status: 'Paid' } })
    ]);
    
    res.json({
      patients: patientCount,
      staff: staffCount,
      lowStockWarnings: lowStockMedCount,
      revenueCollected: invoiceTotal._sum.amount || 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
