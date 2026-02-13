import { Client } from '@/types/client';

// Default clients - in production, these are managed via the dashboard
// and stored in localStorage on the server
export const defaultClients: Client[] = [
  {
    id: '1',
    companyName: 'Demo Company',
    loginId: 'demo',
    password: 'demo123',
    hiredMembers: [],
    createdAt: new Date().toISOString()
  }
];
