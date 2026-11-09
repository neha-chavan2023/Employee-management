import { FiArrowDown, FiArrowUp, FiInbox } from 'react-icons/fi';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  sort,
  onSort,
  rowKey = 'id',
  emptyTitle = 'No records found',
  emptyMessage = 'Try adjusting your search or filters.',
  skeletonRows = 5,
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort?.key === column.key;
              return (
                <th
                  key={column.key}
                  className={[
                    column.className || '',
                    column.sortable ? 'is-sortable' : '',
                    active ? 'is-sorted' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={column.width ? { width: column.width } : undefined}
                  onClick={column.sortable && onSort ? () => onSort(column.key) : undefined}
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <span className="th-content">
                    {column.label}
                    {column.sortable ? (
                      active ? (
                        sort.dir === 'asc' ? (
                          <FiArrowUp className="sort-icon" />
                        ) : (
                          <FiArrowDown className="sort-icon" />
                        )
                      ) : (
                        <span className="sort-icon sort-icon--idle">↕</span>
                      )
                    ) : null}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      <span className="skeleton skeleton-text" />
                    </td>
                  ))}
                </tr>
              ))
            : null}

          {!loading && data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="empty-state">
                  <span className="empty-icon">
                    <FiInbox />
                  </span>
                  <h4>{emptyTitle}</h4>
                  <p>{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : null}

          {!loading &&
            data.map((row) => (
              <tr key={row[rowKey]}>
                {columns.map((column) => (
                  <td key={column.key} className={column.className || ''}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
