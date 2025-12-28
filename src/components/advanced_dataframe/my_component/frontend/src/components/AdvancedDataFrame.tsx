/**
 * AdvancedDataFrame - Phase 1実装
 * TanStack Tableを使用した基本的なテーブルコンポーネント
 *
 * Phase 1機能:
 * - 基本的なデータ表示
 * - カラムソート（単一カラム、昇順/降順）
 * - カラム幅のリサイズ
 * - Streamlitテーマ対応
 */

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnResizeMode,
  ColumnDef,
} from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import { RowData, StreamlitProps } from '@/types/table'
import { useStreamlitTheme } from '@/hooks/useStreamlitTheme'
import { cn } from '@/lib/utils'

/**
 * AdvancedDataFrameコンポーネント
 */
export function AdvancedDataFrame({ data, columns, height }: StreamlitProps) {
  const { theme, isDark, secondaryBackgroundColor, textColor } =
    useStreamlitTheme()

  // ソート状態管理
  const [sorting, setSorting] = useState<SortingState>([])

  // カラムリサイズモード
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange')

  // カラム定義をTanStack Table形式に変換
  const columnHelper = createColumnHelper<RowData>()
  const tableColumns: ColumnDef<RowData, unknown>[] = useMemo(
    () =>
      columns.map((col) =>
        columnHelper.accessor(col.id, {
          id: col.id,
          header: col.header,
          enableSorting: col.enableSorting ?? true,
          enableResizing: col.enableResizing ?? true,
        })
      ),
    [columns, columnHelper]
  )

  // TanStack Tableインスタンス作成
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode,
    enableSortingRemoval: true,
    enableMultiSort: false, // Phase 1では単一カラムソートのみ
    // カラムのデフォルトサイズを設定
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
  })

  // 枠線の色（テーマに応じて変更）
  const borderColor = isDark ? 'rgba(250, 250, 250, 0.2)' : 'rgba(0, 0, 0, 0.1)'

  return (
    <div
      className="overflow-auto rounded-md border"
      style={{
        maxHeight: height ? `${height}px` : 'none',
        fontFamily: theme.font,
        color: textColor,
        borderColor: borderColor,
      }}
    >
      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, headerIndex) => {
                const isFirstColumn = headerIndex === 0
                const isLastColumn = headerIndex === headerGroup.headers.length - 1

                return (
                  <th
                    key={header.id}
                    className={cn(
                      'sticky top-0 z-10 px-3 py-2 text-left text-sm font-semibold select-none',
                      header.column.getCanSort()
                        ? 'cursor-pointer'
                        : 'cursor-default'
                    )}
                    style={{
                      width: header.getSize(),
                      backgroundColor: secondaryBackgroundColor,
                      borderTop: 'none',
                      borderLeft: isFirstColumn ? 'none' : `1px solid ${borderColor}`,
                      borderRight: isLastColumn
                        ? 'none'
                        : `1px solid ${borderColor}`,
                      borderBottom: `1px solid ${borderColor}`,
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                  <div className="flex items-center gap-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {/* ソートインジケーター（ソート中のみ表示） */}
                    {header.column.getCanSort() && header.column.getIsSorted() && (
                      <span className="text-xs opacity-60">
                        {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>

                  {/* カラムリサイズハンドル */}
                  {header.column.getCanResize() && (
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className="absolute right-0 top-0 h-full w-[5px] cursor-col-resize select-none touch-none transition-opacity duration-200"
                      style={{
                        opacity: header.column.getIsResizing() ? 1 : 0,
                      }}
                      onMouseEnter={(e) => {
                        ;(e.target as HTMLElement).style.opacity = '0.3'
                      }}
                      onMouseLeave={(e) => {
                        if (!header.column.getIsResizing()) {
                          ;(e.target as HTMLElement).style.opacity = '0'
                        }
                      }}
                    >
                      <div
                        className="h-full w-full"
                        style={{
                          backgroundColor: theme.primaryColor,
                        }}
                      />
                    </div>
                  )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, rowIndex) => {
            const isLastRow = rowIndex === table.getRowModel().rows.length - 1

            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell, cellIndex) => {
                  const isFirstColumn = cellIndex === 0
                  const isLastColumn = cellIndex === row.getVisibleCells().length - 1

                  return (
                    <td
                      key={cell.id}
                      className="px-3 py-2 text-sm whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{
                        width: cell.column.getSize(),
                        borderTop: `1px solid ${borderColor}`,
                        borderLeft: isFirstColumn
                          ? 'none'
                          : `1px solid ${borderColor}`,
                        borderRight: isLastColumn
                          ? 'none'
                          : `1px solid ${borderColor}`,
                        borderBottom: isLastRow
                          ? 'none'
                          : `1px solid ${borderColor}`,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* データが空の場合の表示 */}
      {data.length === 0 && (
        <div
          className="p-6 text-center text-sm"
          style={{
            color: isDark ? '#888' : '#999',
          }}
        >
          データがありません
        </div>
      )}
    </div>
  )
}
