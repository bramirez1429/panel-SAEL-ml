"use client";

import { useState } from "react";
import {
  Form,
  Input,
  Modal,
  Select,
  message,
} from "antd";
import type { CreateUserInput } from "../domain/user.model";
import { createUserAction } from "./create-user.action";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}>;

type FormValues = {
  name?: string;
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "ADMIN" | "USER";
};

export function CreateUserModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  async function handleSubmit(values: FormValues) {
    setSaving(true);

    try {
      const input: CreateUserInput = {
        name: values.name?.trim() || undefined,
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role,
      };

      const result = await createUserAction(input);

      if (!result.ok) {
        messageApi.error(result.message);
        return;
      }

      messageApi.success("Usuario creado correctamente.");
      form.resetFields();
      onClose();
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (saving) return;

    form.resetFields();
    onClose();
  }

  return (
    <>
      {contextHolder}

      <Modal
        open={open}
        title="Nuevo usuario"
        okText="Crear usuario"
        cancelText="Cancelar"
        confirmLoading={saving}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form<FormValues>
          form={form}
          layout="vertical"
          initialValues={{
            role: "USER",
          }}
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Nombre"
            name="name"
          >
            <Input
              placeholder="Ej: Bryan Ramirez"
              maxLength={120}
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Ingresá el email.",
              },
              {
                type: "email",
                message: "Ingresá un email válido.",
              },
            ]}
          >
            <Input
              placeholder="usuario@sael.com"
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[
              {
                required: true,
                message: "Ingresá una contraseña.",
              },
              {
                min: 7,
                message:
                  "La contraseña debe tener al menos 7 caracteres.",
              },
            ]}
          >
            <Input.Password
              placeholder="Contraseña temporal"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            label="Rol"
            name="role"
            rules={[
              {
                required: true,
                message: "Seleccioná un rol.",
              },
            ]}
          >
            <Select
              options={[
                {
                  value: "SUPER_ADMIN",
                  label: "Super administrador",
                },
                {
                  value: "USER",
                  label: "Usuario",
                },
                {
                  value: "ADMIN",
                  label: "Administrador",
                },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

