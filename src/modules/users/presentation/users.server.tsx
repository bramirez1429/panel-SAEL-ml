import { Alert } from "antd";
import { ApiError } from "@/shared/api/api-error";
import { createUsersRepository } from "../users.composition.server";
import { UsersTable } from "./users-table.client";

export async function UsersView() {
  const repository = createUsersRepository();

  try {
    const users = await repository.getAll();

    return <UsersTable users={users} />;
  } catch (error) {
    console.error("[USERS LOAD ERROR]", error);

    return (
      <Alert
        type="error"
        showIcon
        title="No se pudieron cargar los usuarios."
      />
    );
  }
}
