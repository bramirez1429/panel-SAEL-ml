"use server";

import { revalidatePath } from "next/cache";
import { createUser } from "../application/create-user";
import type { CreateUserInput } from "../domain/user.model";
import { createUsersRepository } from "../users.composition.server";

export type CreateUserActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function createUserAction(
  input: CreateUserInput,
): Promise<CreateUserActionResult> {
  try {
    const repository = createUsersRepository();

    await createUser(repository, input);

    revalidatePath("/usuarios");

    return { ok: true };
  } catch (error) {
    console.error("[CREATE USER ERROR]", error);

    if (
      error instanceof Error &&
      error.message.trim().length > 0
    ) {
      return {
        ok: false,
        message: error.message,
      };
    }

    return {
      ok: false,
      message: "No se pudo crear el usuario.",
    };
  }
}

