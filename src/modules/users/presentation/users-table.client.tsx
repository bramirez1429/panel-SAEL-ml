"use client";

import { useState } from "react";
import { Button, Space, Table, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import type {
  ManagedUser,
  UserRole,
} from "../domain/user.model";
import { CreateUserModal } from "./create-user-modal.client";

type Props = Readonly<{
  users: readonly ManagedUser[];
}>;

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super administrador";
    case "ADMIN":
      return "Administrador";
    default:
      return "Usuario";
  }
}

export function UsersTable({ users }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <Space
        direction="vertical"
        size={20}
        style={{ width: "100%" }}
      >
        <Space
          align="center"
          style={{
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <div>
            <Typography.Title
              level={3}
              style={{ margin: 0 }}
            >
              Usuarios
            </Typography.Title>

            <Typography.Text type="secondary">
              Administrá los accesos al panel.
            </Typography.Text>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            Nuevo usuario
          </Button>
        </Space>

        <Table<ManagedUser>
          rowKey="id"
          dataSource={[...users]}
          pagination={false}
          columns={[
            {
              title: "Usuario",
              key: "user",
              render: (_, user) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>
                    {user.name || "Sin nombre"}
                  </Typography.Text>

                  <Typography.Text type="secondary">
                    {user.email}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "Rol",
              dataIndex: "role",
              key: "role",
              render: (role: UserRole) => (
                <Tag>{getRoleLabel(role)}</Tag>
              ),
            },
            {
              title: "Estado",
              dataIndex: "isActive",
              key: "status",
              render: (isActive: boolean) => (
                <Tag color={isActive ? "success" : "default"}>
                  {isActive ? "Activo" : "Inactivo"}
                </Tag>
              ),
            },
            {
              title: "Creado",
              dataIndex: "createdAt",
              key: "createdAt",
              render: (createdAt: string) =>
                new Intl.DateTimeFormat("es-AR").format(
                  new Date(createdAt),
                ),
            },
          ]}
        />
      </Space>

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => router.refresh()}
      />
    </>
  );
}

