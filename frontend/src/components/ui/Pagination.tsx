import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Meta } from "../../api/types";

interface PaginationProps {
  meta: Meta;
  onChangePage: (page: number) => void;
}

export function Pagination({ meta, onChangePage }: PaginationProps) {
  const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1);
  const windowed =
    pages.length <= 7 ? pages : pages.filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 1);

  return (
    <nav className="pagination" aria-label="Pagination">
      <p className="pagination-info">
        Page {meta.page} of {meta.totalPages} · {meta.total} {meta.total === 1 ? "item" : "items"}
      </p>
      <div className="pagination-controls">
        <button
          type="button"
          className="page-btn"
          onClick={() => onChangePage(meta.page - 1)}
          disabled={!meta.hasPreviousPage}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} aria-hidden="true" />
        </button>
        {windowed.map((page, index) => (
          <span key={page} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            {index > 0 && page - windowed[index - 1]! > 1 ? (
              <span className="pagination-info" aria-hidden="true">
                …
              </span>
            ) : null}
            <button
              type="button"
              className="page-btn"
              onClick={() => onChangePage(page)}
              aria-current={page === meta.page}
              aria-label={`Page ${page}`}
            >
              {page}
            </button>
          </span>
        ))}
        <button
          type="button"
          className="page-btn"
          onClick={() => onChangePage(meta.page + 1)}
          disabled={!meta.hasNextPage}
          aria-label="Next page"
        >
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
