import {
  company_type,
  company_industry,
  company_size,
  company_stage,
} from '@prisma/client';
import { faker } from '@faker-js/faker';
import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';

// Helper function to create a single company
const createCompany = async () => {
  const companyTypes = Object.values(company_type);
  const industries = Object.values(company_industry);
  const sizes = Object.values(company_size);
  const stages = Object.values(company_stage);

  return prisma.company.create({
    data: {
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      companyType: faker.helpers.arrayElement(companyTypes),
      industry: faker.helpers.arrayElement(industries),
      size: faker.helpers.arrayElement(sizes),
      stage: faker.helpers.arrayElement(stages),
      foundedYear: faker.number.int({ min: 1990, max: 2024 }),
      website: faker.internet.url(),
      contactEmail: faker.internet.email(),
      contactPhone: faker.phone.number(),
      contactName: faker.person.fullName(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
      benefits: [
        'Health Insurance',
        '401(k) Matching',
        'Remote Work',
        'Flexible Hours',
        'Professional Development',
      ],
      social: {
        create: {
          linkedin: faker.internet.url(),
          twitter: faker.internet.url(),
          github: faker.internet.url(),
        },
      },
      culture: {
        create: {
          mission: faker.company.catchPhrase(),
          vision: faker.company.catchPhrase(),
          values: [
            'Innovation',
            'Collaboration',
            'Excellence',
            'Integrity',
            'Customer Focus',
          ],
          perks: [
            'Remote Work',
            'Flexible Hours',
            'Learning Budget',
            'Team Events',
            'Wellness Program',
          ],
          workEnvironment: [
            'Collaborative',
            'Fast-paced',
            'Innovative',
            'Supportive',
            'Growth-oriented',
          ],
        },
      },
    },
  });
};

// Function to seed companies
export const seedCompanies = async (count: number = 8) => {
  try {
    logger.info('Starting company seed...');

    // Clear existing companies
    await prisma.company.deleteMany();

    // Create companies
    const companies = await Promise.all(
      Array.from({ length: count }, () => createCompany())
    );

    logger.info(`Created ${companies.length} companies successfully`);
    return {
      clientCompanies: companies.slice(0, 4),
      partnerCompanies: companies.slice(4, 8),
    };
  } catch (error) {
    logger.error('Error seeding companies:', error);
    throw error;
  }
};
