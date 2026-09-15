import type {
  CreateUserInput,
  ManagedUser,
} from "../domain/user.model";
import type { UsersRepository } from "../domain/users.repository";

export function createUser(
  repository: UsersRepository,
  input: CreateUserInput,
): Promise<ManagedUser> {
  return repository.create(input);
}

