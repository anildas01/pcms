import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Middleware to protect routes
export const requireAuth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/users
router.get('/', requireAuth, async (req: any, res: any) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        role: true,
        permissions: true,
        createdAt: true
      }
    });
    const parsedUsers = users.map(u => ({
      ...u,
      permissions: JSON.parse(u.permissions || "[]")
    }));
    res.json(parsedUsers);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/me
router.get('/me', requireAuth, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true
      }
    });
    if (user) {
      res.json({
        ...user,
        permissions: JSON.parse(user.permissions || "[]")
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/roles
router.get('/roles', requireAuth, async (req: any, res: any) => {
  try {
    const roles = await prisma.role.findMany();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  roleId: z.number().int().positive(),
  status: z.string().default('active'),
  permissions: z.array(z.string()).optional()
});

// POST /api/users
router.post('/', requireAuth, async (req: any, res: any) => {
  try {
    const data = userSchema.parse(req.body);
    if (!data.password) {
      return res.status(400).json({ error: 'Password is required for new users' });
    }
    
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        roleId: data.roleId,
        status: data.status,
        permissions: JSON.stringify(data.permissions || [])
      },
      select: { id: true, name: true, email: true, status: true, role: true, permissions: true }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Users',
        action: 'Create',
        newData: JSON.stringify(user),
        reason: `Created user ${user.name}`
      }
    });

    res.status(201).json(user);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const zErr = err as any;
      const msg = zErr.errors?.[0]?.message || zErr.issues?.[0]?.message || err.message || 'Validation error';
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id
router.put('/:id', requireAuth, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const data = userSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) return res.status(404).json({ error: 'User not found' });

    if (data.email !== existingUser.email) {
      const emailCheck = await prisma.user.findUnique({ where: { email: data.email } });
      if (emailCheck) return res.status(400).json({ error: 'Email already in use' });
    }

    const updateData: any = {
      name: data.name,
      email: data.email,
      roleId: data.roleId,
      status: data.status
    };
    
    if (data.permissions !== undefined) {
      updateData.permissions = JSON.stringify(data.permissions);
    }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, status: true, role: true, permissions: true }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Users',
        action: 'Update',
        oldData: JSON.stringify({ name: existingUser.name, email: existingUser.email, roleId: existingUser.roleId, status: existingUser.status }),
        newData: JSON.stringify(user),
        reason: `Updated user ${user.name}`
      }
    });

    res.json(user);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const zErr = err as any;
      const msg = zErr.errors?.[0]?.message || zErr.issues?.[0]?.message || err.message || 'Validation error';
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', requireAuth, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        module: 'Users',
        action: 'Delete',
        oldData: JSON.stringify({ name: user.name, email: user.email }),
        reason: `Deleted user ${user.name}`
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot delete this user because they are linked to existing records (e.g. visits, tasks). Please change their status to Inactive instead.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
