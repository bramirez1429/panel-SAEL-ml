import type { LoginFieldErrors } from "./login-input.schema";

export type LoginActionState = Readonly<{
  fieldErrors?: LoginFieldErrors;
  formError?: string;
}>;

export type LoginAction = (
  previousState: LoginActionState,
  formData: FormData,
) => Promise<LoginActionState>;

export const initialLoginActionState: LoginActionState = {};
