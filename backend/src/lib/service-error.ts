export interface ServiceErrorOptions {
  message: string;
  detail?: unknown;
}

export class ServiceError extends Error {
  public readonly detail?: unknown;

  constructor(options: ServiceErrorOptions) {
    super(options.message);
    this.name = "ServiceError";
    this.detail = options.detail;
  }
}





