import prisma from '@/config/database';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { user_type } from '@prisma/client';

interface CreateTestUserInput {
  email?: string;
  name?: string;
  password?: string;
  type?: user_type;
}

export const createTestUser = async (data: CreateTestUserInput = {}) => {
  const plainPassword = data.password || 'Password123!';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  return prisma.user.create({
    data: {
      email: data.email || `test-${uuidv4()}@example.com`,
      name: data.name || 'Test User',
      password: hashedPassword,
      type: data.type || 'CANDIDATE',
    },
  });
};
