import React, { useMemo, useState } from 'react';
import './LiteTable.css';

export interface LiteTableColumn<T> {
  key: string;
  title: React.ReactNode;
  dataIndex?: keyof T & string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  ellipsis?: boolean;
  sorter?: (a: T, b: T) => number;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
}

interface LiteTableProps<T> {
  columns: LiteTableColumn<T>[];
  dataSource: T[];
  rowKey: keyof T & string | ((record: T, index: number) => React.Key);
  emptyText?: React.ReactNode;
  pageSize?: number;
  hideOnSinglePage?: boolean;
  className?: string;
  scrollX?: number | string;
  maxHeight?: number | string;
  rowClassName?: (record: T, index: number) => string | undefined;
}

type SortState<T> = {
  key: string;
  order: 'ascend' | 'descend';
  sorter: (a: T, b: T) => number;
} | null;

const resolveRowKey = <T,>(
  rowKey: LiteTableProps<T>['rowKey'],
  record: T,
  index: number,
) => (typeof rowKey === 'function' ? rowKey(record, index) : (record[rowKey] as React.Key));

const LiteTable = <T,>({
  columns,
  dataSource,
  rowKey,
  emptyText = '暂无数据',
  pageSize,
  hideOnSinglePage = false,
  className,
  scrollX,
  maxHeight,
  rowClassName,
}: LiteTableProps<T>) => {
  const [page, setPage] = useState(1);
  const [sortState, setSortState] = useState<SortState<T>>(null);

  const sortedData = useMemo(() => {
    if (!sortState) {
      return dataSource;
    }

    const next = [...dataSource].sort(sortState.sorter);
    return sortState.order === 'ascend' ? next : next.reverse();
  }, [dataSource, sortState]);

  const totalPages = pageSize ? Math.max(1, Math.ceil(dataSource.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);

  const rows = useMemo(() => {
    if (!pageSize) {
      return sortedData;
    }

    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [currentPage, pageSize, sortedData]);

  const toggleSort = (column: LiteTableColumn<T>) => {
    if (!column.sorter) {
      return;
    }

    setPage(1);
    setSortState((current) => {
      if (!current || current.key !== column.key) {
        return { key: column.key, order: 'ascend', sorter: column.sorter as (a: T, b: T) => number };
      }
      if (current.order === 'ascend') {
        return { key: column.key, order: 'descend', sorter: column.sorter as (a: T, b: T) => number };
      }
      return null;
    });
  };

  return (
    <div className={['lite-table-shell', className].filter(Boolean).join(' ')}>
      <div
        className="lite-table-scroll"
        style={{
          overflowX: scrollX ? 'auto' : undefined,
          overflowY: maxHeight ? 'auto' : undefined,
          maxHeight,
        }}
      >
        <table className="lite-table" style={scrollX ? { minWidth: scrollX } : undefined}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.sorter ? 'lite-table-sortable' : undefined}
                  style={{
                    width: column.width,
                    textAlign: column.align ?? 'left',
                  }}
                  onClick={() => toggleSort(column)}
                >
                  <span className="lite-table-header-content">
                    <span>{column.title}</span>
                    {column.sorter ? (
                      <span className="lite-table-sort-indicator" aria-hidden="true">
                        {sortState?.key === column.key
                          ? sortState.order === 'ascend'
                            ? '▲'
                            : '▼'
                          : '↕'}
                      </span>
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((record, index) => (
                <tr
                  key={resolveRowKey(rowKey, record, index)}
                  className={rowClassName?.(record, index)}
                >
                  {columns.map((column) => {
                    const value = column.dataIndex ? record[column.dataIndex] : undefined;
                    return (
                      <td
                        key={column.key}
                        className={column.ellipsis ? 'lite-table-cell-ellipsis' : undefined}
                        style={{
                          textAlign: column.align ?? 'left',
                        }}
                      >
                        {column.render ? column.render(value, record, index) : String(value ?? '--')}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td className="lite-table-empty" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageSize && !(hideOnSinglePage && totalPages <= 1) ? (
        <div className="lite-table-pagination">
          <button
            type="button"
            className="lite-table-page-button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={currentPage <= 1}
          >
            上一页
          </button>
          <span className="lite-table-page-text">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className="lite-table-page-button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={currentPage >= totalPages}
          >
            下一页
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default LiteTable;
