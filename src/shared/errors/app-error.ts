export class AppError<Code extends string = string> extends Error {
  readonly code: Code;

  constructor(message: string, code: Code, options?: ErrorOptions) {
    super(message, options);

    this.name = "AppError";
    this.code = code;
  }
}
