import type {
  CreateUserInput,
  ManagedUser,
  UserRole,
} from "./user.model";

export interface UsersRepository {
  getAll(): Promise<readonly ManagedUser[]>;
  create(input: CreateUserInput): Promise<ManagedUser>;
  updateStatus(
    id: string,
    isActive: boolean,
  ): Promise<ManagedUser>;
  updateRole(
    id: string,
    role: UserRole,
  ): Promise<ManagedUser>;
}

