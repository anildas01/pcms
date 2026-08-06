import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  roleId: z.number(),
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid credentials or inactive account' });
    }

    // Check if account is locked out
    if (user.lockoutUntil && new Date() < user.lockoutUntil) {
      return res.status(403).json({ error: 'Account is temporarily locked due to too many failed attempts. Try again later.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      const attempts = user.failedLoginAttempts + 1;
      let lockoutUntil = null;
      if (attempts >= 5) {
        // Lock for 15 minutes
        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts, lockoutUntil }
      });
      
      return res.status(401).json({ error: attempts >= 5 ? 'Account locked due to 5 failed attempts.' : 'Invalid credentials' });
    }

    // Success - reset counters
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockoutUntil: null }
    });

    const token = jwt.sign({ id: user.id, role: user.role.name }, JWT_SECRET, { expiresIn: '1d' });
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    // Record session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        ipAddress: req.ip || req.socket.remoteAddress,
        device: userAgent,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role.name, permissions: JSON.parse(user.permissions || "[]") } });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.format() });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password stub
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    // In production, generate a reset token and send email.
    // For MVP, we will simulate a successful request.
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      console.log(`Password reset requested for ${email}`);
    }
    // Always return success to prevent email enumeration
    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, roleId } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId,
      }
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.format() });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
