/// <reference types="node" />

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/shared/utils/logger';

const prisma = new PrismaClient();

/**
 * SLA Policy Seed Script
 *
 * This script creates comprehensive SLA policies for the support ticket system.
 * It includes default policies for each entity type and specific policies for
 * different categories and priorities.
 */

interface SlaPolicyData {
  name: string;
  description: string;
  entityType: 'CANDIDATE' | 'CLIENT' | 'PARTNER' | 'SUPPORT';
  category:
    | 'JOB_POSTING'
    | 'JOB_APPLICATION'
    | 'JOB_INTERVIEW'
    | 'JOB_ONBOARDING'
    | 'CANDIDATE_RECOMMENDATION'
    | 'USER_INVITATION'
    | 'USER_MANAGEMENT'
    | 'SUBSCRIPTION_BILLING'
    | 'AI_ASSESSMENT'
    | 'PANEL_ASSESSMENT'
    | 'CANDIDATE_MANAGEMENT'
    | 'COMPANY_PROFILE'
    | 'INTEGRATION'
    | 'TECHNICAL_ISSUE'
    | 'ACCOUNT_SETTINGS'
    | 'NOTIFICATION_SETTINGS'
    | 'DATA_EXPORT_IMPORT'
    | 'SECURITY_AUTHENTICATION'
    | 'API_ACCESS'
    | 'REPORTING_ANALYTICS'
    | 'FEATURE_REQUEST'
    | 'GENERAL_INQUIRY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';
  responseTime: number; // minutes
  resolutionTime: number; // minutes
  escalationTime?: number; // minutes
  businessHoursOnly: boolean;
  workingDaysOnly: boolean;
  excludeHolidays: boolean;
  isActive: boolean;
  isDefault: boolean;
}

const slaPolicies: SlaPolicyData[] = [
  // ========================================
  // CLIENT POLICIES
  // ========================================

  // Client Default Policies
  {
    name: 'Client Default Policy',
    description: 'Default SLA policy for all client tickets',
    entityType: 'CLIENT',
    category: 'GENERAL_INQUIRY',
    priority: 'MEDIUM',
    responseTime: 240, // 4 hours
    resolutionTime: 1440, // 24 hours
    escalationTime: 720, // 12 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: true,
  },

  // Client Technical Issues
  {
    name: 'Client Technical Issues - Low Priority',
    description: 'SLA for low priority technical issues from clients',
    entityType: 'CLIENT',
    category: 'TECHNICAL_ISSUE',
    priority: 'LOW',
    responseTime: 480, // 8 hours
    resolutionTime: 2880, // 48 hours
    escalationTime: 1440, // 24 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },
  {
    name: 'Client Technical Issues - Medium Priority',
    description: 'SLA for medium priority technical issues from clients',
    entityType: 'CLIENT',
    category: 'TECHNICAL_ISSUE',
    priority: 'MEDIUM',
    responseTime: 240, // 4 hours
    resolutionTime: 1440, // 24 hours
    escalationTime: 720, // 12 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },
  {
    name: 'Client Technical Issues - High Priority',
    description: 'SLA for high priority technical issues from clients',
    entityType: 'CLIENT',
    category: 'TECHNICAL_ISSUE',
    priority: 'HIGH',
    responseTime: 120, // 2 hours
    resolutionTime: 720, // 12 hours
    escalationTime: 360, // 6 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },
  {
    name: 'Client Technical Issues - Urgent',
    description: 'SLA for urgent technical issues from clients',
    entityType: 'CLIENT',
    category: 'TECHNICAL_ISSUE',
    priority: 'URGENT',
    responseTime: 60, // 1 hour
    resolutionTime: 360, // 6 hours
    escalationTime: 180, // 3 hours
    businessHoursOnly: false,
    workingDaysOnly: false,
    excludeHolidays: false,
    isActive: true,
    isDefault: false,
  },
  {
    name: 'Client Technical Issues - Critical',
    description: 'SLA for critical technical issues from clients',
    entityType: 'CLIENT',
    category: 'TECHNICAL_ISSUE',
    priority: 'CRITICAL',
    responseTime: 30, // 30 minutes
    resolutionTime: 180, // 3 hours
    escalationTime: 90, // 1.5 hours
    businessHoursOnly: false,
    workingDaysOnly: false,
    excludeHolidays: false,
    isActive: true,
    isDefault: false,
  },

  // Client Billing Issues
  {
    name: 'Client Billing Issues - Standard',
    description: 'SLA for billing inquiries from clients',
    entityType: 'CLIENT',
    category: 'SUBSCRIPTION_BILLING',
    priority: 'MEDIUM',
    responseTime: 480, // 8 hours
    resolutionTime: 2880, // 48 hours
    escalationTime: 1440, // 24 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },
  {
    name: 'Client Billing Issues - High Priority',
    description: 'SLA for high priority billing issues from clients',
    entityType: 'CLIENT',
    category: 'SUBSCRIPTION_BILLING',
    priority: 'HIGH',
    responseTime: 240, // 4 hours
    resolutionTime: 1440, // 24 hours
    escalationTime: 720, // 12 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client Account Issues
  {
    name: 'Client Account Issues',
    description: 'SLA for account-related issues from clients',
    entityType: 'CLIENT',
    category: 'ACCOUNT_SETTINGS',
    priority: 'MEDIUM',
    responseTime: 360, // 6 hours
    resolutionTime: 1440, // 24 hours
    escalationTime: 720, // 12 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client Security Issues
  {
    name: 'Client Security Issues',
    description: 'SLA for security-related issues from clients',
    entityType: 'CLIENT',
    category: 'SECURITY_AUTHENTICATION',
    priority: 'CRITICAL',
    responseTime: 15, // 15 minutes
    resolutionTime: 120, // 2 hours
    escalationTime: 60, // 1 hour
    businessHoursOnly: false,
    workingDaysOnly: false,
    excludeHolidays: false,
    isActive: true,
    isDefault: false,
  },

  // Client Job Posting Issues
  {
    name: 'Client Job Posting Issues',
    description: 'SLA for job posting related issues from clients',
    entityType: 'CLIENT',
    category: 'JOB_POSTING',
    priority: 'MEDIUM',
    responseTime: 240, // 4 hours
    resolutionTime: 1440, // 24 hours
    escalationTime: 720, // 12 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client Job Application Issues
  {
    name: 'Client Job Application Issues',
    description: 'SLA for job application related issues from clients',
    entityType: 'CLIENT',
    category: 'JOB_APPLICATION',
    priority: 'MEDIUM',
    responseTime: 240, // 4 hours
    resolutionTime: 1440, // 24 hours
    escalationTime: 720, // 12 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client Job Interview Issues
  {
    name: 'Client Job Interview Issues',
    description: 'SLA for job interview related issues from clients',
    entityType: 'CLIENT',
    category: 'JOB_INTERVIEW',
    priority: 'HIGH',
    responseTime: 120, // 2 hours
    resolutionTime: 720, // 12 hours
    escalationTime: 360, // 6 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client Job Onboarding Issues
  {
    name: 'Client Job Onboarding Issues',
    description: 'SLA for job onboarding related issues from clients',
    entityType: 'CLIENT',
    category: 'JOB_ONBOARDING',
    priority: 'MEDIUM',
    responseTime: 360, // 6 hours
    resolutionTime: 1440, // 24 hours
    escalationTime: 720, // 12 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client Candidate Recommendation Issues
  {
    name: 'Client Candidate Recommendation Issues',
    description: 'SLA for candidate recommendation related issues from clients',
    entityType: 'CLIENT',
    category: 'CANDIDATE_RECOMMENDATION',
    priority: 'MEDIUM',
    responseTime: 240, // 4 hours
    resolutionTime: 1440, // 24 hours
    escalationTime: 720, // 12 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client User Invitation Issues
  {
    name: 'Client User Invitation Issues',
    description: 'SLA for user invitation related issues from clients',
    entityType: 'CLIENT',
    category: 'USER_INVITATION',
    priority: 'MEDIUM',
    responseTime: 240, // 4 hours
    resolutionTime: 1440, // 24 hours
    escalationTime: 720, // 12 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client User Management Issues
  {
    name: 'Client User Management Issues',
    description: 'SLA for user management related issues from clients',
    entityType: 'CLIENT',
    category: 'USER_MANAGEMENT',
    priority: 'MEDIUM',
    responseTime: 240, // 4 hours
    resolutionTime: 1440, // 24 hours
    escalationTime: 720, // 12 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client AI Assessment Issues
  {
    name: 'Client AI Assessment Issues',
    description: 'SLA for AI assessment related issues from clients',
    entityType: 'CLIENT',
    category: 'AI_ASSESSMENT',
    priority: 'HIGH',
    responseTime: 120, // 2 hours
    resolutionTime: 720, // 12 hours
    escalationTime: 360, // 6 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client Panel Assessment Issues
  {
    name: 'Client Panel Assessment Issues',
    description: 'SLA for panel assessment related issues from clients',
    entityType: 'CLIENT',
    category: 'PANEL_ASSESSMENT',
    priority: 'HIGH',
    responseTime: 120, // 2 hours
    resolutionTime: 720, // 12 hours
    escalationTime: 360, // 6 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client Candidate Management Issues
  {
    name: 'Client Candidate Management Issues',
    description: 'SLA for candidate management related issues from clients',
    entityType: 'CLIENT',
    category: 'CANDIDATE_MANAGEMENT',
    priority: 'MEDIUM',
    responseTime: 240, // 4 hours
    resolutionTime: 1440, // 24 hours
    escalationTime: 720, // 12 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client Company Profile Issues
  {
    name: 'Client Company Profile Issues',
    description: 'SLA for company profile related issues from clients',
    entityType: 'CLIENT',
    category: 'COMPANY_PROFILE',
    priority: 'MEDIUM',
    responseTime: 360, // 6 hours
    resolutionTime: 1440, // 24 hours
    escalationTime: 720, // 12 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client Integration Issues
  {
    name: 'Client Integration Issues',
    description: 'SLA for integration related issues from clients',
    entityType: 'CLIENT',
    category: 'INTEGRATION',
    priority: 'HIGH',
    responseTime: 120, // 2 hours
    resolutionTime: 720, // 12 hours
    escalationTime: 360, // 6 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client Notification Settings Issues
  {
    name: 'Client Notification Settings Issues',
    description: 'SLA for notification settings related issues from clients',
    entityType: 'CLIENT',
    category: 'NOTIFICATION_SETTINGS',
    priority: 'LOW',
    responseTime: 480, // 8 hours
    resolutionTime: 2880, // 48 hours
    escalationTime: 1440, // 24 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client Data Export Import Issues
  {
    name: 'Client Data Export Import Issues',
    description: 'SLA for data export/import related issues from clients',
    entityType: 'CLIENT',
    category: 'DATA_EXPORT_IMPORT',
    priority: 'MEDIUM',
    responseTime: 360, // 6 hours
    resolutionTime: 1440, // 24 hours
    escalationTime: 720, // 12 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client API Access Issues
  {
    name: 'Client API Access Issues',
    description: 'SLA for API access related issues from clients',
    entityType: 'CLIENT',
    category: 'API_ACCESS',
    priority: 'HIGH',
    responseTime: 120, // 2 hours
    resolutionTime: 720, // 12 hours
    escalationTime: 360, // 6 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client Reporting Analytics Issues
  {
    name: 'Client Reporting Analytics Issues',
    description: 'SLA for reporting and analytics related issues from clients',
    entityType: 'CLIENT',
    category: 'REPORTING_ANALYTICS',
    priority: 'MEDIUM',
    responseTime: 360, // 6 hours
    resolutionTime: 1440, // 24 hours
    escalationTime: 720, // 12 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Client Feature Request Issues
  {
    name: 'Client Feature Request Issues',
    description: 'SLA for feature request related issues from clients',
    entityType: 'CLIENT',
    category: 'FEATURE_REQUEST',
    priority: 'LOW',
    responseTime: 480, // 8 hours
    resolutionTime: 2880, // 48 hours
    escalationTime: 1440, // 24 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // ========================================
  // CANDIDATE POLICIES
  // ========================================

  // Candidate Default Policy
  {
    name: 'Candidate Default Policy',
    description: 'Default SLA policy for all candidate tickets',
    entityType: 'CANDIDATE',
    category: 'GENERAL_INQUIRY',
    priority: 'MEDIUM',
    responseTime: 480, // 8 hours
    resolutionTime: 2880, // 48 hours
    escalationTime: 1440, // 24 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: true,
  },

  // Candidate Technical Issues
  {
    name: 'Candidate Technical Issues - Standard',
    description: 'SLA for technical issues from candidates',
    entityType: 'CANDIDATE',
    category: 'TECHNICAL_ISSUE',
    priority: 'MEDIUM',
    responseTime: 720, // 12 hours
    resolutionTime: 2880, // 48 hours
    escalationTime: 1440, // 24 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },
  {
    name: 'Candidate Technical Issues - High Priority',
    description: 'SLA for high priority technical issues from candidates',
    entityType: 'CANDIDATE',
    category: 'TECHNICAL_ISSUE',
    priority: 'HIGH',
    responseTime: 360, // 6 hours
    resolutionTime: 1440, // 24 hours
    escalationTime: 720, // 12 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Candidate Account Issues
  {
    name: 'Candidate Account Issues',
    description: 'SLA for account-related issues from candidates',
    entityType: 'CANDIDATE',
    category: 'ACCOUNT_SETTINGS',
    priority: 'MEDIUM',
    responseTime: 480, // 8 hours
    resolutionTime: 2880, // 48 hours
    escalationTime: 1440, // 24 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // ========================================
  // PARTNER POLICIES
  // ========================================

  // Partner Default Policy
  {
    name: 'Partner Default Policy',
    description: 'Default SLA policy for all partner tickets',
    entityType: 'PARTNER',
    category: 'GENERAL_INQUIRY',
    priority: 'MEDIUM',
    responseTime: 360, // 6 hours
    resolutionTime: 2160, // 36 hours
    escalationTime: 1080, // 18 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: true,
  },

  // Partner Technical Issues
  {
    name: 'Partner Technical Issues - Standard',
    description: 'SLA for technical issues from partners',
    entityType: 'PARTNER',
    category: 'TECHNICAL_ISSUE',
    priority: 'MEDIUM',
    responseTime: 480, // 8 hours
    resolutionTime: 2160, // 36 hours
    escalationTime: 1080, // 18 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },
  {
    name: 'Partner Technical Issues - High Priority',
    description: 'SLA for high priority technical issues from partners',
    entityType: 'PARTNER',
    category: 'TECHNICAL_ISSUE',
    priority: 'HIGH',
    responseTime: 240, // 4 hours
    resolutionTime: 1440, // 24 hours
    escalationTime: 720, // 12 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Partner Integration Issues
  {
    name: 'Partner Integration Issues',
    description: 'SLA for integration-related issues from partners',
    entityType: 'PARTNER',
    category: 'INTEGRATION',
    priority: 'MEDIUM',
    responseTime: 360, // 6 hours
    resolutionTime: 2160, // 36 hours
    escalationTime: 1080, // 18 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // ========================================
  // SUPPORT POLICIES
  // ========================================

  // Support Default Policy
  {
    name: 'Support Default Policy',
    description: 'Default SLA policy for internal support tickets',
    entityType: 'SUPPORT',
    category: 'GENERAL_INQUIRY',
    priority: 'MEDIUM',
    responseTime: 720, // 12 hours
    resolutionTime: 4320, // 72 hours
    escalationTime: 2160, // 36 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: true,
  },

  // Support Technical Issues
  {
    name: 'Support Technical Issues',
    description: 'SLA for internal technical issues',
    entityType: 'SUPPORT',
    category: 'TECHNICAL_ISSUE',
    priority: 'MEDIUM',
    responseTime: 1440, // 24 hours
    resolutionTime: 4320, // 72 hours
    escalationTime: 2160, // 36 hours
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Support Bug Reports
  {
    name: 'Support Bug Reports',
    description: 'SLA for internal bug reports',
    entityType: 'SUPPORT',
    category: 'TECHNICAL_ISSUE',
    priority: 'LOW',
    responseTime: 1440, // 24 hours
    resolutionTime: 10080, // 7 days
    escalationTime: 4320, // 3 days
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },

  // Support Feature Requests
  {
    name: 'Support Feature Requests',
    description: 'SLA for internal feature requests',
    entityType: 'SUPPORT',
    category: 'FEATURE_REQUEST',
    priority: 'LOW',
    responseTime: 2880, // 48 hours
    resolutionTime: 20160, // 14 days
    escalationTime: 10080, // 7 days
    businessHoursOnly: true,
    workingDaysOnly: true,
    excludeHolidays: true,
    isActive: true,
    isDefault: false,
  },
];

async function seedSlaPolicies(): Promise<void> {
  try {
    logger.info('Starting SLA policy seed...');

    // Clear existing SLA policies
    await prisma.support_sla_policy.deleteMany();
    logger.info('Cleared existing SLA policies');

    // Create SLA policies
    const createdPolicies: any[] = [];
    for (const policyData of slaPolicies) {
      const policy = await prisma.support_sla_policy.create({
        data: policyData,
      });
      createdPolicies.push(policy);
      logger.info(`Created SLA policy: ${policy.name}`);
    }

    logger.info(`Successfully created ${createdPolicies.length} SLA policies`);

    // Log summary by entity type
    const summary = createdPolicies.reduce(
      (acc, policy) => {
        acc[policy.entityType] = (acc[policy.entityType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    logger.info('SLA Policy Summary:', summary);

    // Log default policies
    const defaultPolicies = createdPolicies.filter((p) => p.isDefault);
    logger.info(
      `Default policies created: ${defaultPolicies.map((p) => `${p.entityType} - ${p.name}`).join(', ')}`
    );
  } catch (error) {
    logger.error('Error seeding SLA policies:', error);
    throw error;
  }
}

async function main(): Promise<void> {
  try {
    await seedSlaPolicies();
    logger.info('SLA policy seed completed successfully');
  } catch (error) {
    logger.error('SLA policy seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed if this file is executed directly
if (require.main === module) {
  main();
}

export { seedSlaPolicies };
