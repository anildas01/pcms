import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create Admin Role
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin' },
  });

  // Create Default Admin User
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@pcms.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@pcms.com',
      password: hashedPassword,
      roleId: adminRole.id,
      status: 'active',
    },
  });

  console.log(`Created default user: ${adminUser.email} / password123`);

  // Create a sample Patient
  const patient = await prisma.patient.create({
    data: {
      name: 'John Doe',
      age: 65,
      gender: 'Male',
      phone: '555-0100',
      address: '123 Main St, Springfield',
      diagnosis: 'Advanced COPD',
      status: 'Active'
    }
  });
  console.log(`Created sample patient: ${patient.name}`);
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
