import { z } from "zod";

/**
 * Caps pageSize to prevent overfetching/DoS via unbounded list queries.
 * All list endpoints share these defaults: page 1, pageSize 10, max 50.
 */
export const paginationSchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export type Pagination = z.infer<typeof paginationSchema>;

export function parsePagination(query: Record<string, unknown>): Pagination {
  return paginationSchema.parse(query);
}

export function computeMeta(pagination: Pagination, total: number) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pagination.pageSize);
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages,
    hasNextPage: pagination.page < totalPages,
    hasPreviousPage: pagination.page > 1,
  };
}
