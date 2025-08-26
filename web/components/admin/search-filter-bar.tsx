import { IconSearch, IconX } from '@tabler/icons-react';
import { ReactNode } from 'react';

interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  isSearching?: boolean;
  children?: ReactNode; // For additional filters
  actions?: ReactNode; // For action buttons on the right
  className?: string;
}

export function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  isSearching = false,
  children,
  actions,
  className = '',
}: SearchFilterBarProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 sm:max-w-xs">
            <div className="relative">
              <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 text-sm placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  searchValue ? 'pr-10' : 'pr-3'
                }`}
              />
              {searchValue && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <IconX className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          {children}
        </div>

        <div className="flex items-center gap-3">
          {/* Search status indicator */}
          {isSearching && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
              <span className="text-xs text-gray-500">Searching...</span>
            </div>
          )}

          {/* Action buttons */}
          {actions}
        </div>
      </div>
    </div>
  );
}
