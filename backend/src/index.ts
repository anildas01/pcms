import path from 'path';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PCMS Backend is running' });
});

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import patientRoutes from './routes/patients';
import uploadRoutes from './routes/upload';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/upload', uploadRoutes);
import medicineRoutes from './routes/medicines';
app.use('/api/medicines', medicineRoutes);
import equipmentRoutes from './routes/equipment';
app.use('/api/equipment', equipmentRoutes);
import visitsRoutes from './routes/visits';
app.use('/api/visits', visitsRoutes);
import dashboardRoutes from './routes/dashboard';
app.use('/api/dashboard', dashboardRoutes);
import billingRoutes from './routes/billing';
app.use('/api/billing', billingRoutes);
import attendanceRoutes from './routes/attendance';
app.use('/api/attendance', attendanceRoutes);
import suppliersRoutes from './routes/suppliers';
app.use('/api/suppliers', suppliersRoutes);
import auditRoutes from './routes/audit';
app.use('/api/audit', auditRoutes);
import vehicleRoutes from './routes/vehicles';
app.use('/api/vehicles', vehicleRoutes);
import purchaseRoutes from './routes/purchases';
app.use('/api/purchases', purchaseRoutes);
import taskRoutes from './routes/tasks';
app.use('/api/tasks', taskRoutes);
import dispatchRoutes from './routes/dispatch';
app.use('/api/dispatch', dispatchRoutes);
import reportsRoutes from './routes/reports';
app.use('/api/reports', reportsRoutes);
import settingsRoutes from './routes/settings';
app.use('/api/settings', settingsRoutes);
import notificationsRoutes from './routes/notifications';
app.use('/api/notifications', notificationsRoutes);
import securityRoutes from './routes/security';
app.use('/api/security', securityRoutes);

app.listen(port as number, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
