import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const pageNumbers = (current, total) => {
  const pages = [];
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end = Math.min(total, start + 4);
  for (let page = start; page <= end; page += 1) pages.push(page);
  return pages;
};

export default function Pagination({ page, totalPages, total, pageSize, onChange }) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const numbers = pageNumbers(page, totalPages);

  return (
    <div className="pagination">
      <p className="pagination-info">
        Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{total}</strong> records
      </p>
      <div className="pagination-controls">
        <button
          type="button"
          className="page-btn"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <FiChevronLeft />
        </button>
        {numbers[0] > 1 ? (
          <>
            <button type="button" className="page-btn" onClick={() => onChange(1)}>
              1
            </button>
            {numbers[0] > 2 ? <span className="page-ellipsis">…</span> : null}
          </>
        ) : null}
        {numbers.map((number) => (
          <button
            key={number}
            type="button"
            className={`page-btn ${number === page ? 'is-active' : ''}`.trim()}
            onClick={() => onChange(number)}
            aria-current={number === page ? 'page' : undefined}
          >
            {number}
          </button>
        ))}
        {numbers[numbers.length - 1] < totalPages ? (
          <>
            {numbers[numbers.length - 1] < totalPages - 1 ? (
              <span className="page-ellipsis">…</span>
            ) : null}
            <button type="button" className="page-btn" onClick={() => onChange(totalPages)}>
              {totalPages}
            </button>
          </>
        ) : null}
        <button
          type="button"
          className="page-btn"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}
