import React, { useState, useMemo, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import {
  refreshOutline,
  settingsOutline,
  funnelOutline,
  chevronDownOutline,
  chevronBackOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import ExportMenu from './ExportMenu';

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

interface PremiumDataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  searchFields: (keyof T)[];
  exportFilename: string;
  exportTitle: string;
  statusField?: keyof T;
  statusFilters?: { label: string; value: any }[];
  showSelection?: boolean;
  selectedIds?: Set<string | number>;
  onSelectionChange?: (selected: Set<string | number>) => void;
}

function PremiumDataGrid<T extends { id: string | number }>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  searchFields,
  exportFilename,
  exportTitle,
  statusField,
  statusFilters,
  showSelection = true,
  selectedIds,
  onSelectionChange
}: PremiumDataGridProps<T>) {
  // 1. Text Search Filter
  const [searchTerm, setSearchTerm] = useState('');

  // 2. Status/Category Filters
  const [activeStatusFilter, setActiveStatusFilter] = useState<any>(
    statusFilters && statusFilters.length > 0 ? statusFilters[0].value : null
  );

  // 3. Column Configuration State
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [showColConfig, setShowColConfig] = useState(false);

  // 4. Sort Configuration
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // 5. Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 6. Refresh Spinner State
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reset page when page size, search, or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, searchTerm, activeStatusFilter]);

  // Initialize all columns as visible
  useEffect(() => {
    const initialCols: Record<string, boolean> = {};
    columns.forEach((col) => {
      initialCols[col.key] = true;
    });
    setVisibleColumns(initialCols);
  }, [columns]);

  // Refresh trigger
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  // Sort request
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtering & Sorting calculations
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Filter by Status Tab
    if (statusField && activeStatusFilter !== null) {
      result = result.filter((item) => item[statusField] === activeStatusFilter);
    }

    // Filter by Text Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const val = item[field];
          return val ? String(val).toLowerCase().includes(lowerSearch) : false;
        })
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a: any, b: any) => {
        const colDef = columns.find((c) => c.key === sortConfig.key);
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Format dates for comparison if applicable
        if (sortConfig.key === 'date' || sortConfig.key === 'time') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, activeStatusFilter, sortConfig, statusField, searchFields, columns]);

  // Paginated split
  const totalEntries = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;

  // Guard current page boundaries
  const activePage = Math.max(1, Math.min(currentPage, totalPages));

  const paginatedData = useMemo(() => {
    const startIndex = (activePage - 1) * pageSize;
    return filteredAndSortedData.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedData, activePage, pageSize]);

  // Internal selection state
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string | number>>(new Set());
  const activeSelectedIds = selectedIds !== undefined ? selectedIds : localSelectedIds;
  const setActiveSelectedIds = (next: Set<string | number>) => {
    if (onSelectionChange) {
      onSelectionChange(next);
    } else {
      setLocalSelectedIds(next);
    }
  };

  const allPaginatedSelected = paginatedData.length > 0 && paginatedData.every((item) => activeSelectedIds.has(item.id));

  const toggleSelectAll = () => {
    const nextSelected = new Set(activeSelectedIds);
    if (allPaginatedSelected) {
      paginatedData.forEach((item) => nextSelected.delete(item.id));
    } else {
      paginatedData.forEach((item) => nextSelected.add(item.id));
    }
    setActiveSelectedIds(nextSelected);
  };

  const toggleSelectRow = (id: string | number) => {
    const nextSelected = new Set(activeSelectedIds);
    if (nextSelected.has(id)) {
      nextSelected.delete(id);
    } else {
      nextSelected.add(id);
    }
    setActiveSelectedIds(nextSelected);
  };

  // Render columns count check
  const activeColDefs = columns.filter((col) => visibleColumns[col.key] !== false);

  return (
    <div className="space-y-4 text-slate-800">

      {/* Grid Toolbar: Filters, Columns config, Export, Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm select-none">

        {/* Search Bar Input */}
        <div className="relative w-full sm:max-w-xs">
          <IonIcon icon={funnelOutline} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-100 font-medium transition-all"
          />
        </div>

        {/* Action Controls right */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Tabs buttons if applicable */}
          {statusFilters && statusFilters.map((tab) => (
            <button
              key={String(tab.value)}
              onClick={() => setActiveStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeStatusFilter === tab.value
                  ? 'text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200/80'
                }`}
              style={{
                backgroundColor: activeStatusFilter === tab.value ? 'var(--theme-primary)' : undefined
              }}
            >
              {tab.label}
            </button>
          ))}        </div>
      </div>

      {/* Main Table Grid Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 select-none">
                {showSelection && (
                  <th className="w-12 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={allPaginatedSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer outline-none transition-colors"
                    />
                  </th>
                )}
                {activeColDefs.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable !== false && requestSort(col.key)}
                    className={`px-4 py-3 text-[11px] font-bold tracking-wide text-slate-950 ${col.sortable !== false ? 'cursor-pointer hover:bg-slate-100/60' : ''
                      }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      {col.sortable !== false && sortConfig?.key === col.key && (
                        <span className="text-[10px] opacity-80">
                          {sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={activeColDefs.length + (showSelection ? 1 : 0)} className="text-center py-8 text-slate-400 font-bold text-xs">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                    {showSelection && (
                      <td className="w-12 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={activeSelectedIds.has(item.id)}
                          onChange={() => toggleSelectRow(item.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer outline-none transition-colors"
                        />
                      </td>
                    )}
                    {activeColDefs.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-xs text-slate-700 font-medium">
                        {col.render ? col.render(item, (activePage - 1) * pageSize + index) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid Footer Pagination matching bottom bar of Image 4 */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 select-none">

        {/* Actions Controls (Refresh, Column config, Export) on bottom-left */}
        <div className="flex items-center gap-2">
          {/* Column configuration dropdown selector */}
          {/* Column configuration dropdown selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColConfig(!showColConfig)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center gap-1 transition-colors cursor-pointer outline-none"
              title="Columns layout"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 12h18M3 20h18M8 2v4M16 10v4M10 18v4" />
              </svg>
              <IonIcon icon={chevronDownOutline} className="text-[8px]" />
            </button>

            {showColConfig && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setShowColConfig(false)} />
                <div className="absolute left-0 bottom-full mb-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-[101] space-y-2 text-xs">
                  <div className="font-bold text-slate-500 uppercase tracking-wider px-1 pb-1 border-b border-slate-100 text-[10px]">
                    Visible Columns
                  </div>
                  {columns.map((col) => (
                    <label key={col.key} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.key] !== false}
                        onChange={() =>
                          setVisibleColumns({
                            ...visibleColumns,
                            [col.key]: visibleColumns[col.key] === false
                          })
                        }
                        className="rounded border-slate-300 focus:ring-0 text-slate-900 w-3.5 h-3.5"
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer outline-none"
            title="Refresh list"
          >
            <svg className={`w-4 h-4 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          {/* Export Menu button */}
          <ExportMenu data={filteredAndSortedData} filename={exportFilename} title={exportTitle} />
        </div>

        {/* Entries Count Text & Pagination Control */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <span className="text-xs text-slate-500 font-bold">
            Showing {totalEntries > 0 ? (activePage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(activePage * pageSize, totalEntries)} of {totalEntries} entries
          </span>

          <div className="flex items-center gap-1">
            {/* First Page */}
            <button
              disabled={activePage === 1}
              onClick={() => setCurrentPage(1)}
              className="p-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-black">&lt;&lt;</span>
            </button>

            {/* Prev Page */}
            <button
              disabled={activePage === 1}
              onClick={() => setCurrentPage(activePage - 1)}
              className="p-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 transition-colors flex items-center justify-center"
            >
              <IonIcon icon={chevronBackOutline} className="text-xs font-bold" />
            </button>

            {/* Render page index numbers surrounding active page */}
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pNum = idx + 1;
              // Limit rendering range
              if (totalPages > 5 && Math.abs(pNum - activePage) > 2) return null;
              return (
                <button
                  key={pNum}
                  onClick={() => setCurrentPage(pNum)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold border transition-colors ${activePage === pNum
                      ? 'text-white border-transparent'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  style={{
                    backgroundColor: activePage === pNum ? 'var(--theme-primary)' : undefined
                  }}
                >
                  {pNum}
                </button>
              );
            })}

            {/* Next Page */}
            <button
              disabled={activePage === totalPages}
              onClick={() => setCurrentPage(activePage + 1)}
              className="p-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 transition-colors flex items-center justify-center"
            >
              <IonIcon icon={chevronForwardOutline} className="text-xs font-bold" />
            </button>

            {/* Last Page */}
            <button
              disabled={activePage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-black">&gt;&gt;</span>
            </button>
          </div>

          {/* Page size configuration selector */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-100 font-bold text-slate-600 transition-all cursor-pointer"
          >
            {[10, 20, 50, 100].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

      </div>

    </div>
  );
}

export default PremiumDataGrid;
