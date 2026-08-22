"use client";

import type { FormEvent } from "react";
import { useActionState, useState } from "react";
import { Alert, Button, Form, Input } from "antd";

import {
  initialLoginActionState,
  type LoginAction,
  type LoginActionState,
} from "./login-action-state";
import {
  getLoginFieldErrors,
  loginInputSchema,
  type LoginFieldErrors,
} from "./login-input.schema";

/** Cliente minimo: gestiona interaccion de Ant Design; nunca recibe tokens. */
export function LoginForm({ action }: Readonly<{ action: LoginAction }>) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialLoginActionState,
  );
  const [clientErrors, setClientErrors] = useState<LoginFieldErrors>({});

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>): void {
    const formData = new FormData(event.currentTarget);
    const validation = loginInputSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!validation.success) {
      event.preventDefault();
      setClientErrors(getLoginFieldErrors(validation.error));
      return;
    }

    setClientErrors({});
  }

  const fieldErrors = mergeFieldErrors(clientErrors, state);

  return (
    <form
      action={formAction}
      onSubmit={validateBeforeSubmit}
      aria-label="Inicio de sesión"
    >
      <Form component={false} layout="vertical" requiredMark={false}>
        {state.formError ? (
          <Form.Item>
            <Alert message={state.formError} type="error" showIcon />
          </Form.Item>
        ) : null}

        <Form.Item
          label="Email"
          htmlFor="login-email"
          validateStatus={fieldErrors.email ? "error" : undefined}
          help={fieldErrors.email}
        >
          <Input
            id="login-email"
            name="email"
            autoComplete="username"
            inputMode="email"
            placeholder="usuario@ejemplo.com"
            disabled={isPending}
          />
        </Form.Item>

        <Form.Item
          label="Contraseña"
          htmlFor="login-password"
          validateStatus={fieldErrors.password ? "error" : undefined}
          help={fieldErrors.password}
        >
          <Input.Password
            id="login-password"
            name="password"
            autoComplete="current-password"
            placeholder="Ingresá tu contraseña"
            disabled={isPending}
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={isPending}
          block
        >
          Iniciar sesión
        </Button>
      </Form>
    </form>
  );
}

function mergeFieldErrors(
  clientErrors: LoginFieldErrors,
  state: LoginActionState,
): LoginFieldErrors {
  return {
    email: clientErrors.email ?? state.fieldErrors?.email,
    password: clientErrors.password ?? state.fieldErrors?.password,
  };
}
