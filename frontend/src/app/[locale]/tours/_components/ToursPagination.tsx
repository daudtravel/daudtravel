import { Button } from "@/src/components/ui/button";
import { useTranslations } from "next-intl";

interface ToursPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const MAX_VISIBLE_PAGES = 5;
const ELLIPSIS_LEFT = -1;
const ELLIPSIS_RIGHT = -2;

export default function ToursPagination({
  currentPage,
  totalPages,
  onPageChange,
}: ToursPaginationProps) {
  const t = useTranslations("main");

  const pageNumbers = calculatePageNumbers(currentPage, totalPages);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <nav
      className="flex justify-center items-center space-x-2 mt-6"
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirstPage}
        className="px-3 py-1"
        aria-label={t("prev")}
      >
        {t("prev")}
      </Button>

      {pageNumbers.map((page, index) => {
        const isEllipsis = page === ELLIPSIS_LEFT || page === ELLIPSIS_RIGHT;

        if (isEllipsis) {
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-1"
              aria-hidden="true"
            >
              ...
            </span>
          );
        }

        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            onClick={() => onPageChange(page)}
            className="px-3 py-1"
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </Button>
        );
      })}

      <Button
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLastPage}
        className="px-3 py-1"
        aria-label={t("next")}
      >
        {t("next")}
      </Button>
    </nav>
  );
}

function calculatePageNumbers(
  currentPage: number,
  totalPages: number
): number[] {
  if (totalPages === 0) return [];

  const pageNumbers: number[] = [1];

  if (totalPages <= MAX_VISIBLE_PAGES) {
    for (let i = 2; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    const showLeftEllipsis = currentPage > 3;
    const showRightEllipsis = currentPage < totalPages - 2;

    if (showLeftEllipsis) {
      pageNumbers.push(ELLIPSIS_LEFT);
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (!pageNumbers.includes(i)) {
        pageNumbers.push(i);
      }
    }

    if (showRightEllipsis) {
      pageNumbers.push(ELLIPSIS_RIGHT);
    }

    if (!pageNumbers.includes(totalPages)) {
      pageNumbers.push(totalPages);
    }
  }

  return pageNumbers;
}
