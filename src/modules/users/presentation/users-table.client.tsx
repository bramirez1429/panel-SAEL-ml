"use client";

import {
  Button,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";

import type { ManagedUser } from "../domain/user.model";

type Props = Readonly<{
  users: readonly ManagedUser[];
}>;

export function UsersTable({ users }: Props) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Usuarios
          </Typography.Title>

          <Typography.Text type="secondary">
            Administrá las personas con acceso al panel.
          </Typography.Text>
        </div>

        <Button type="primary">
          Nuevo usuario
        </Button>
      </div>

      <Table<ManagedUser>
        dataSource={[...users]}
        pagination={false}
        rowKey="id"
        columns={[
          {
            title: "Usuario",
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
            render: (_, user) => (
              <Tag color={user.role === "ADMIN" ? "blue" : undefined}>
                {user.role === "ADMIN" ? "Administrador" : "Usuario"}
              </Tag>
            ),
          },
          {
            title: "Estado",
            render: (_, user) => (
              <Tag color={user.isActive ? "success" : "error"}>
                {user.isActive ? "Activo" : "Inactivo"}
              </Tag>
            ),
          },
          {
            title: "Creado",
            render: (_, user) =>
              new Intl.DateTimeFormat("es-AR").format(
                new Date(user.createdAt),
              ),
          },
        ]}
      />
    </div>
  );
}
