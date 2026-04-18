export type ServiceContext = {
  baseUrl?: string;
  headers?: Record<string, string>;
};

export class BaseService {
  protected baseUrl: string;
  protected headers: Record<string, string>;

  constructor(context: ServiceContext = {}) {
    this.baseUrl = context.baseUrl ?? "";
    this.headers = context.headers ?? {};
  }
}
