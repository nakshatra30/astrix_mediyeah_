export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function sendData<T>(res: { status: (code: number) => { json: (body: unknown) => void } }, data: T, statusCode = 200): void {
  res.status(statusCode).json({ data });
}

export function sendPaginated<T>(
  res: { status: (code: number) => { json: (body: unknown) => void } },
  items: T[],
  meta: ApiMeta,
  statusCode = 200,
): void {
  res.status(statusCode).json({ data: items, meta });
}
