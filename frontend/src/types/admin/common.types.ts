export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export type SortOrder = "asc" | "desc";

/** Generic list params sent to back-office endpoints (undefined = omitted). */
export type ListParams = Record<
  string,
  string | number | boolean | undefined | null
>;
