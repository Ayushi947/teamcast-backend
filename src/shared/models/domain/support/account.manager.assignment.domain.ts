export interface IClientAccountManagerAssignment {
  id: string;
  clientId: string;
  accountManagerId: string;
  assignedAt: Date;
}

export interface ISupportAccountManagerUserDomain {
  id: string;
  name: string;
  email: string;
  type: string;
  role: string;
  status: string;
  jobTitle?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}
