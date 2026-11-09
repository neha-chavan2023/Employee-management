import { FiSearch, FiX } from 'react-icons/fi';

export default function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`search-box ${className}`.trim()}>
      <FiSearch className="search-icon" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value ? (
        <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="Clear search">
          <FiX />
        </button>
      ) : null}
    </div>
  );
}
