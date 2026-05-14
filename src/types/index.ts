export type Role = "CEO" | "Co Founder" | "Buchhaltung" | "Manager" | "Mitarbeiter";

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  colorTag: string;
  isActive: boolean;
  hireDate?: string;
  salary?: number;
  hourlyCost?: number;
  customPermissions?: string[];
}
