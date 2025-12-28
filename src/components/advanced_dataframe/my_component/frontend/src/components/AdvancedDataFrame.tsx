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
      className="advanced-dataframe-container"
      style={{
        height: height ? `${height}px` : 'auto',
        overflow: 'auto',
        fontFamily: theme.font,
        color: textColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '4px',
      }}
    >
      <table
        className="advanced-dataframe-table"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{
                    width: header.getSize(),
                    position: 'relative',
                    backgroundColor: secondaryBackgroundColor,
                    border: `1px solid ${borderColor}`,
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {/* ソートインジケーター */}
                    {header.column.getCanSort() && (
                      <span style={{ fontSize: '12px', opacity: 0.6 }}>
                        {header.column.getIsSorted() === 'asc'
                          ? '↑'
                          : header.column.getIsSorted() === 'desc'
                            ? '↓'
                            : '⇅'}
                      </span>
                    )}
                  </div>

                  {/* カラムリサイズハンドル */}
                  {header.column.getCanResize() && (
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        height: '100%',
                        width: '5px',
                        cursor: 'col-resize',
                        userSelect: 'none',
                        touchAction: 'none',
                        opacity: header.column.getIsResizing() ? 1 : 0,
                        transition: 'opacity 0.2s',
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
                        style={{
                          height: '100%',
                          width: '100%',
                          backgroundColor: theme.primaryColor,
                        }}
                      />
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{
                    width: cell.column.getSize(),
                    padding: '8px 12px',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* データが空の場合の表示 */}
      {data.length === 0 && (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: isDark ? '#888' : '#999',
            fontSize: '14px',
          }}
        >
          データがありません
        </div>
      )}
    </div>
  )
}
