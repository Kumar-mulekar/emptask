/**
 * Development & Assessment Data Seed Utility
 * 
 * IMPORTANT: This is a development/assessment seed script designed to populate
 * a test database with 10,000 deterministic employee records for performance and
 * analytics evaluation. Do NOT use this as a production data-reset mechanism.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mulberry32 deterministic PRNG
function createPRNG(seed: number) {
  let s = seed;
  return function random() {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Rohan', 'Priya', 'Vikram', 'Neha', 'Arjun', 'Kavya',
  'Alexander', 'Emily', 'James', 'Olivia', 'William', 'Sophia', 'Benjamin', 'Ava',
  'Oliver', 'Charlotte', 'George', 'Amelia', 'Harry', 'Isla', 'Jack', 'Mia',
  'Lukas', 'Hannah', 'Maximilian', 'Emma', 'Felix', 'Mia', 'Paul', 'Anna',
  'Liam', 'Chloe', 'Noah', 'Zoe', 'Lucas', 'Ella', 'Ethan', 'Maya',
  'Muhammad', 'Fatima', 'Zayd', 'Mariam', 'Tariq', 'Layla', 'Omar', 'Nour',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Kumar', 'Singh', 'Deshmukh', 'Verma', 'Joshi', 'Gupta',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Taylor', 'Wilson', 'Evans', 'Thomas', 'Roberts', 'Walker', 'Wright', 'Thompson',
  'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker',
  'Tremblay', 'Gagnon', 'Roy', 'Côté', 'Bouchard', 'Gauthier', 'Morin', 'Lavoie',
  'Al-Mansoor', 'Al-Hassan', 'Khan', 'Sheikh', 'Siddiqui', 'Hashmi', 'Farooqi', 'Qureshi',
];

interface CountryConfig {
  country: string;
  currency: string;
  weight: number; // Percentage out of 100
  minSalary: number;
  maxSalary: number;
}

const COUNTRIES: CountryConfig[] = [
  { country: 'India', currency: 'INR', weight: 28, minSalary: 400000, maxSalary: 3500000 },
  { country: 'USA', currency: 'USD', weight: 25, minSalary: 45000, maxSalary: 280000 },
  { country: 'UK', currency: 'GBP', weight: 12, minSalary: 28000, maxSalary: 190000 },
  { country: 'Germany', currency: 'EUR', weight: 10, minSalary: 35000, maxSalary: 150000 },
  { country: 'Canada', currency: 'CAD', weight: 8, minSalary: 50000, maxSalary: 200000 },
  { country: 'Australia', currency: 'AUD', weight: 7, minSalary: 55000, maxSalary: 220000 },
  { country: 'Singapore', currency: 'SGD', weight: 5, minSalary: 45000, maxSalary: 180000 },
  { country: 'UAE', currency: 'AED', weight: 5, minSalary: 80000, maxSalary: 400000 },
];

const DEPARTMENTS: Record<string, string[]> = {
  Engineering: ['Software Engineer', 'Senior Engineer', 'Tech Lead', 'Engineering Manager'],
  Product: ['Product Manager', 'Associate PM', 'Senior PM', 'Director of Product'],
  Sales: ['Sales Exec', 'Account Executive', 'Sales Manager', 'VP Sales'],
  Marketing: ['Marketing Specialist', 'Content Strategist', 'Marketing Manager', 'CMO'],
  HR: ['HR Associate', 'HR Manager', 'Talent Partner', 'VP People'],
  Finance: ['Financial Analyst', 'Accountant', 'Finance Manager', 'CFO'],
  Operations: ['Ops Associate', 'Operations Manager', 'Director of Ops', 'COO'],
  Design: ['UI/UX Designer', 'Product Designer', 'Design Lead', 'Creative Director'],
};

const DEPT_NAMES = Object.keys(DEPARTMENTS);

export async function seedDatabase(seedValue: number = 42, totalRecords: number = 10000) {
  const rng = createPRNG(seedValue);

  console.log(`Starting database seed (target: ${totalRecords} records)...`);

  // Build weighted country selector pool (100 slots)
  const countryPool: CountryConfig[] = [];
  for (const config of COUNTRIES) {
    for (let i = 0; i < config.weight; i++) {
      countryPool.push(config);
    }
  }

  // Generate 10,000 deterministic records in memory
  const records = [];
  const startDate = new Date('2015-01-01T00:00:00Z').getTime();
  const endDate = new Date('2025-12-31T23:59:59Z').getTime();

  for (let i = 0; i < totalRecords; i++) {
    // 1. Name
    const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const fullName = `${firstName} ${lastName}`;

    // 2. Department & Job Title
    const deptName = DEPT_NAMES[Math.floor(rng() * DEPT_NAMES.length)];
    const titles = DEPARTMENTS[deptName];
    const jobTitle = titles[Math.floor(rng() * titles.length)];

    // 3. Employment Type (~82% Full-time, ~11% Contract, ~7% Part-time)
    const empTypeRoll = rng();
    let employmentType = 'Full-time';
    if (empTypeRoll > 0.82 && empTypeRoll <= 0.93) {
      employmentType = 'Contract';
    } else if (empTypeRoll > 0.93) {
      employmentType = 'Part-time';
    }

    // 4. Country & Currency & Salary
    const countryConfig = countryPool[Math.floor(rng() * countryPool.length)];
    const rawSalary = countryConfig.minSalary + rng() * (countryConfig.maxSalary - countryConfig.minSalary);
    // Round to nearest 1,000
    const salary = Math.round(rawSalary / 1000) * 1000;

    // 5. Hire Date (2015-2025)
    const hireTimestamp = startDate + rng() * (endDate - startDate);
    const hireDate = new Date(hireTimestamp);

    // 6. Active Status (~95% active, ~5% inactive)
    const isActive = rng() <= 0.95;

    records.push({
      fullName,
      department: deptName,
      jobTitle,
      employmentType,
      hireDate,
      country: countryConfig.country,
      currency: countryConfig.currency,
      salary,
      isActive,
    });
  }

  // Wipe database before re-seeding (wipe + re-seed strategy)
  await prisma.employee.deleteMany();
  console.log('Wiped existing employee records.');

  // Create in batches of 500 to avoid Neon connection timeouts
  const BATCH_SIZE = 500;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await prisma.employee.createMany({
      data: batch,
    });
    console.log(`Inserted batch ${i / BATCH_SIZE + 1} of ${Math.ceil(records.length / BATCH_SIZE)} (${i + batch.length}/${totalRecords})`);
  }

  console.log(`Seed complete! Inserted ${totalRecords} employee records.`);
  return records;
}

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error('Seed error:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
