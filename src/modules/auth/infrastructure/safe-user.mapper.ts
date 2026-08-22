import type { User } from "../domain/auth.model";
import type { SafeUserDto } from "./safe-user.schema";

/** Convierte el usuario validado de NestJS al modelo seguro del frontend. */
export function mapSafeUser(dto: SafeUserDto): User {
  return {
    id: dto.id,
    email: dto.email,
    name: dto.name,
  };
}
