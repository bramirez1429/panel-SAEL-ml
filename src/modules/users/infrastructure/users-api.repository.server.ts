import "server-only";

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { ApiError } from "@/shared/api/api-error";

import type {
  CreateUserInput,
  ManagedUser,
  UserRole,
} from "../domain/user.model";
import type { UsersRepository } from "../domain/users.repository";
import {
  managedUserSchema,
  managedUsersSchema,
} from "./users.schema";

export class UsersApiRepository implements UsersRepository {
  constructor(
    private readonly http: AuthenticatedHttpClient,
  ) {}

  async getAll(): Promise<readonly ManagedUser[]> {
    const response = await this.http.get("/users");
    const parsed = managedUsersSchema.safeParse(response);

    if (!parsed.success) {
      throw invalidResponse();
    }

    return parsed.data;
  }

  async create(
    input: CreateUserInput,
  ): Promise<ManagedUser> {
    const response = await this.http.post("/users", input);
    return parseUser(response);
  }

  async updateStatus(
    id: string,
    isActive: boolean,
  ): Promise<ManagedUser> {
    const response = await this.http.patch(
      `/users/${encodeURIComponent(id)}/status`,
      { isActive },
    );

    return parseUser(response);
  }

  async updateRole(
    id: string,
    role: UserRole,
  ): Promise<ManagedUser> {
    const response = await this.http.patch(
      `/users/${encodeURIComponent(id)}/role`,
      { role },
    );

    return parseUser(response);
  }
}

function parseUser(value: unknown): ManagedUser {
  const parsed = managedUserSchema.safeParse(value);

  if (!parsed.success) {
    throw invalidResponse();
  }

  return parsed.data;
}

function invalidResponse(): ApiError {
  return new ApiError(
    "Respuesta de usuarios inválida.",
    "API_INVALID_RESPONSE",
  );
}

