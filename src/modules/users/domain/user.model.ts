export type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER";

export type ManagedUser = Readonly<{
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateUserInput = Readonly<{
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
}>;

