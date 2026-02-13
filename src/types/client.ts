export interface Client {
  id: string;
  companyName: string;
  loginId: string;
  password: string;
  hiredMembers: string[]; // Array of profile IDs that are hidden from this client
  createdAt: string;
}
