import { useEffect, useMemo, useState } from 'react';

const valueOf = (item, key) => {
  if (!key) return '';
  const value = key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), item);
  return value == null ? '' : value;
};

/**
 * Client-side search, column sorting and pagination for a list of records.
 */
export function useTableControls(items, options = {}) {
  const {
    searchFields = [],
    pageSize = 8,
    initialSort = { key: '', dir: 'asc' },
  } = options;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    const fields = searchFields.length ? searchFields : ['name'];
    return items.filter((item) =>
      fields.some((field) => String(valueOf(item, field)).toLowerCase().includes(term)),
    );
  }, [items, search, searchFields]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const direction = sort.dir === 'desc' ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const first = valueOf(a, sort.key);
      const second = valueOf(b, sort.key);
      if (typeof first === 'number' && typeof second === 'number') {
        return (first - second) * direction;
      }
      return String(first).localeCompare(String(second), undefined, { numeric: true }) * direction;
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, items]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [sorted, page, pageSize],
  );

  const onSort = (key) => {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    );
    setPage(1);
  };

  return {
    search,
    setSearch,
    sort,
    onSort,
    page,
    setPage,
    pageItems,
    sorted,
    filtered,
    total: sorted.length,
    totalPages,
    pageSize,
  };
}
