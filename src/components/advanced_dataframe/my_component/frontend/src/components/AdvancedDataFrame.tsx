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

import { useStreamlitTheme } from '@/hooks/useStreamlitTheme'
import { cn } from '@/lib/utils'
import {
  CellPosition,
  CellSelection,
  RowData,
  StreamlitProps,
} from '@/types/table'
import {
  ColumnDef,
  ColumnResizeMode,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * AdvancedDataFrameコンポーネント
 */
export function AdvancedDataFrame({
  data,
  columns,
  height,
  fullWidth = false,
}: StreamlitProps) {
  const { theme, isDark, secondaryBackgroundColor, textColor } =
    useStreamlitTheme()

  // ソート状態管理
  const [sorting, setSorting] = useState<SortingState>([])

  // カラムリサイズモード
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange')

  // セル選択状態管理
  const [selectedCells, setSelectedCells] = useState<CellSelection[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<CellPosition | null>(
    null,
  )
  const tableRef = useRef<HTMLDivElement>(null)

  // ヘッダのhover状態管理
  const [hoveredHeaderId, setHoveredHeaderId] = useState<string | null>(null)

  // 行のhover状態管理
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null)

  /**
   * 背景色を明るくする関数
   */
  const lightenColor = useCallback((color: string, amount: number = 0.5) => {
    // "#RRGGBB" 形式の色を明るくする
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    // 白に近づける（明るくする）
    const newR = Math.round(r + (255 - r) * amount)
    const newG = Math.round(g + (255 - g) * amount)
    const newB = Math.round(b + (255 - b) * amount)

    return `rgb(${newR}, ${newG}, ${newB})`
  }, [])

  // ヘッダの通常時の背景色（明るくした色）
  const headerNormalBgColor = useMemo(
    () => lightenColor(secondaryBackgroundColor, isDark ? 0.15 : 0.5),
    [secondaryBackgroundColor, isDark, lightenColor],
  )

  // 行hover時の背景色（非常に薄い色）
  const rowHoverBgColor = useMemo(
    () => (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
    [isDark],
  )

  /**
   * 数値カラムを判定
   * カラムのすべての値（nullを除く）が数値の場合、そのカラムを数値カラムとする
   */
  const numericColumns = useMemo(() => {
    const numericCols = new Set<string>()

    columns.forEach((col) => {
      const values = data.map((row) => row[col.id]).filter((val) => val != null)

      if (values.length === 0) return

      const allNumeric = values.every((val) => typeof val === 'number')
      if (allNumeric) {
        numericCols.add(col.id)
      }
    })

    return numericCols
  }, [data, columns])

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
          // セルの表示フォーマット（数値カラムは3桁区切り）
          cell: (info) => {
            const value = info.getValue()
            // 数値カラムの場合、ユーザーのロケールに従って3桁区切りでフォーマット
            if (numericColumns.has(col.id) && typeof value === 'number') {
              return value.toLocaleString()
            }
            return value as string
          },
          // 日本語対応のカスタムソート関数
          sortingFn: (rowA, rowB, columnId) => {
            const a = rowA.getValue(columnId)
            const b = rowB.getValue(columnId)

            // nullやundefinedの処理
            if (a == null && b == null) return 0
            if (a == null) return 1
            if (b == null) return -1

            // 文字列の場合は日本語対応のlocaleCompareを使用
            if (typeof a === 'string' && typeof b === 'string') {
              return a.localeCompare(b, 'ja', { sensitivity: 'base' })
            }

            // 数値の場合は通常の比較
            if (typeof a === 'number' && typeof b === 'number') {
              return a - b
            }

            // その他の型はデフォルトの比較
            return a < b ? -1 : a > b ? 1 : 0
          },
        }),
      ),
    [columns, columnHelper, numericColumns],
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

  // カラムIDのインデックスを取得（選択範囲の計算に使用）
  const columnIds = useMemo(
    () => table.getAllColumns().map((col) => col.id),
    [table],
  )

  /**
   * セルが選択範囲に含まれるかチェック
   */
  const isCellSelected = useCallback(
    (rowIndex: number, columnId: string): boolean => {
      const colIndex = columnIds.indexOf(columnId)
      if (colIndex === -1) return false

      return selectedCells.some((selection) => {
        const startColIndex = columnIds.indexOf(selection.start.columnId)
        const endColIndex = columnIds.indexOf(selection.end.columnId)
        const minRow = Math.min(
          selection.start.rowIndex,
          selection.end.rowIndex,
        )
        const maxRow = Math.max(
          selection.start.rowIndex,
          selection.end.rowIndex,
        )
        const minCol = Math.min(startColIndex, endColIndex)
        const maxCol = Math.max(startColIndex, endColIndex)

        return (
          rowIndex >= minRow &&
          rowIndex <= maxRow &&
          colIndex >= minCol &&
          colIndex <= maxCol
        )
      })
    },
    [selectedCells, columnIds],
  )

  /**
   * 選択範囲の境界ボーダーを取得
   * @returns 上下左右のボーダーが必要かどうか
   */
  const getSelectionBorders = useCallback(
    (
      rowIndex: number,
      columnId: string,
    ): { top: boolean; right: boolean; bottom: boolean; left: boolean } => {
      const colIndex = columnIds.indexOf(columnId)
      if (colIndex === -1 || !isCellSelected(rowIndex, columnId)) {
        return { top: false, right: false, bottom: false, left: false }
      }

      // 上下左右の隣接セルが選択されているかチェック
      const topSelected = isCellSelected(rowIndex - 1, columnId)
      const bottomSelected = isCellSelected(rowIndex + 1, columnId)
      const leftSelected =
        colIndex > 0 ? isCellSelected(rowIndex, columnIds[colIndex - 1]) : false
      const rightSelected =
        colIndex < columnIds.length - 1
          ? isCellSelected(rowIndex, columnIds[colIndex + 1])
          : false

      return {
        top: !topSelected,
        right: !rightSelected,
        bottom: !bottomSelected,
        left: !leftSelected,
      }
    },
    [columnIds, isCellSelected],
  )

  /**
   * セルのマウスダウンイベント: 選択開始
   */
  const handleCellMouseDown = useCallback(
    (rowIndex: number, columnId: string, event: React.MouseEvent) => {
      // リサイズハンドルのクリックは無視
      if ((event.target as HTMLElement).closest('.resize-handle')) {
        return
      }

      const position: CellPosition = { rowIndex, columnId }
      setSelectionStart(position)
      setIsSelecting(true)

      // Ctrl/Cmd + クリック: 選択範囲を追加
      if (event.metaKey || event.ctrlKey) {
        setSelectedCells((prev) => [
          ...prev,
          { start: position, end: position },
        ])
      }
      // Shift + クリック: 既存の選択を拡張
      else if (event.shiftKey && selectedCells.length > 0) {
        const lastSelection = selectedCells[selectedCells.length - 1]
        setSelectedCells((prev) => [
          ...prev.slice(0, -1),
          { start: lastSelection.start, end: position },
        ])
      }
      // 通常のクリック: 選択をリセット
      else {
        setSelectedCells([{ start: position, end: position }])
      }
    },
    [selectedCells],
  )

  /**
   * セルのマウスエンター: ドラッグ中の範囲拡張
   */
  const handleCellMouseEnter = useCallback(
    (rowIndex: number, columnId: string) => {
      if (!isSelecting || !selectionStart) return

      const position: CellPosition = { rowIndex, columnId }
      setSelectedCells((prev) => {
        const newSelection = { start: selectionStart, end: position }
        // Ctrl/Cmdキーが押されている場合は追加、そうでなければ最後の選択を更新
        if (prev.length > 1) {
          return [...prev.slice(0, -1), newSelection]
        }
        return [newSelection]
      })
    },
    [isSelecting, selectionStart],
  )

  /**
   * グローバルマウスアップ: 選択終了
   */
  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelecting(false)
    }

    if (isSelecting) {
      document.addEventListener('mouseup', handleMouseUp)
      return () => document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isSelecting])

  /**
   * テーブル外クリック: 選択範囲をクリア
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tableRef.current &&
        !tableRef.current.contains(event.target as Node)
      ) {
        setSelectedCells([])
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /**
   * iframe外クリック（Streamlitページ外）: 選択範囲をクリア
   * カスタムコンポーネントはiframe内で動作するため、windowのblurイベントで検知
   */
  useEffect(() => {
    const handleWindowBlur = () => {
      setSelectedCells([])
    }

    window.addEventListener('blur', handleWindowBlur)
    return () => window.removeEventListener('blur', handleWindowBlur)
  }, [])

  /**
   * キーボードショートカット: クリップボードコピー (Ctrl+C / Cmd+C)
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+C または Cmd+C
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        if (selectedCells.length === 0) return

        // 選択範囲のデータをTSV形式で取得
        const rows = table.getRowModel().rows
        const tsvData: string[] = []

        selectedCells.forEach((selection) => {
          const startColIndex = columnIds.indexOf(selection.start.columnId)
          const endColIndex = columnIds.indexOf(selection.end.columnId)
          const minRow = Math.min(
            selection.start.rowIndex,
            selection.end.rowIndex,
          )
          const maxRow = Math.max(
            selection.start.rowIndex,
            selection.end.rowIndex,
          )
          const minCol = Math.min(startColIndex, endColIndex)
          const maxCol = Math.max(startColIndex, endColIndex)

          for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
            const rowData: string[] = []
            for (let colIndex = minCol; colIndex <= maxCol; colIndex++) {
              const columnId = columnIds[colIndex]
              const value = rows[rowIndex]?.getValue(columnId)
              rowData.push(value != null ? String(value) : '')
            }
            tsvData.push(rowData.join('\t'))
          }
        })

        // クリップボードにコピー
        navigator.clipboard
          .writeText(tsvData.join('\n'))
          .catch((err) => console.error('Failed to copy:', err))

        event.preventDefault()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedCells, table, columnIds])

  return (
    <div
      ref={tableRef}
      className={cn(
        'overflow-auto rounded-md border',
        fullWidth ? 'w-full' : 'w-fit',
      )}
      style={{
        maxHeight: height ? `${height}px` : 'none',
        fontFamily: theme.font,
        color: textColor,
        borderColor: borderColor,
      }}
    >
      <table className={cn(fullWidth ? 'w-full' : 'w-fit', 'border-collapse')}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, headerIndex) => {
                const isFirstColumn = headerIndex === 0
                const isLastColumn =
                  headerIndex === headerGroup.headers.length - 1

                const isHovered = hoveredHeaderId === header.id
                const isNumeric = numericColumns.has(header.column.id)

                return (
                  <th
                    key={header.id}
                    className={cn(
                      'sticky top-0 z-10 px-3 text-sm font-light transition-colors duration-150 select-none',
                      isNumeric ? 'text-right' : 'text-left',
                      header.column.getCanSort()
                        ? 'cursor-pointer'
                        : 'cursor-default',
                    )}
                    style={{
                      width: header.getSize(),
                      paddingTop: '0.4375rem',
                      paddingBottom: '0.4375rem',
                      backgroundColor: isHovered
                        ? secondaryBackgroundColor
                        : headerNormalBgColor,
                      borderTop: 'none',
                      borderLeft: isFirstColumn
                        ? 'none'
                        : `1px solid ${borderColor}`,
                      borderRight: isLastColumn
                        ? 'none'
                        : `1px solid ${borderColor}`,
                      borderBottom: `1px solid ${borderColor}`,
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                    onMouseEnter={() => setHoveredHeaderId(header.id)}
                    onMouseLeave={() => setHoveredHeaderId(null)}
                  >
                    <div className="flex items-center gap-1 opacity-70">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {/* ソートインジケーター（ソート中のみ表示） */}
                      {header.column.getCanSort() &&
                        header.column.getIsSorted() && (
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
                        className="absolute top-0 right-0 h-full w-[5px] cursor-col-resize touch-none transition-opacity duration-200 select-none"
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
            const isRowHovered = hoveredRowIndex === rowIndex

            return (
              <tr
                key={row.id}
                onMouseEnter={() => setHoveredRowIndex(rowIndex)}
                onMouseLeave={() => setHoveredRowIndex(null)}
              >
                {row.getVisibleCells().map((cell, cellIndex) => {
                  const isFirstColumn = cellIndex === 0
                  const isLastColumn =
                    cellIndex === row.getVisibleCells().length - 1

                  const isSelected = isCellSelected(rowIndex, cell.column.id)
                  const selectionBorders = getSelectionBorders(
                    rowIndex,
                    cell.column.id,
                  )
                  const isNumeric = numericColumns.has(cell.column.id)

                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        'relative cursor-cell px-3 text-sm select-none',
                        isNumeric ? 'text-right' : 'text-left',
                      )}
                      style={{
                        width: cell.column.getSize(),
                        paddingTop: '0.4375rem',
                        paddingBottom: '0.4375rem',
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
                        backgroundColor: isSelected
                          ? isDark
                            ? `${theme.primaryColor}20`
                            : `${theme.primaryColor}15`
                          : isRowHovered
                            ? rowHoverBgColor
                            : 'transparent',
                        overflow: 'visible',
                        transition: 'background-color 0.1s ease',
                      }}
                      onMouseDown={(e) =>
                        handleCellMouseDown(rowIndex, cell.column.id, e)
                      }
                      onMouseEnter={() =>
                        handleCellMouseEnter(rowIndex, cell.column.id)
                      }
                    >
                      {/* 上の境界線（横線） - セル間ボーダーを覆うよう拡張 */}
                      {selectionBorders.top && (
                        <span
                          className="pointer-events-none absolute top-0 z-10 h-[1px]"
                          style={{
                            backgroundColor: theme.primaryColor,
                            left: selectionBorders.left ? '0' : '-1px',
                            width: selectionBorders.left
                              ? selectionBorders.right
                                ? '100%'
                                : 'calc(100% + 1px)'
                              : selectionBorders.right
                                ? 'calc(100% + 1px)'
                                : 'calc(100% + 2px)',
                          }}
                        />
                      )}
                      {/* 下の境界線（横線） - セル間ボーダーを覆うよう拡張 */}
                      {selectionBorders.bottom && (
                        <span
                          className="pointer-events-none absolute bottom-0 z-10 h-[1px]"
                          style={{
                            backgroundColor: theme.primaryColor,
                            left: selectionBorders.left ? '0' : '-1px',
                            width: selectionBorders.left
                              ? selectionBorders.right
                                ? '100%'
                                : 'calc(100% + 1px)'
                              : selectionBorders.right
                                ? 'calc(100% + 1px)'
                                : 'calc(100% + 2px)',
                          }}
                        />
                      )}
                      {/* 左の境界線（縦線） - セル間ボーダーを覆うよう拡張 */}
                      {selectionBorders.left && (
                        <span
                          className="pointer-events-none absolute left-0 z-10 w-[1px]"
                          style={{
                            backgroundColor: theme.primaryColor,
                            top: selectionBorders.top ? '0' : '-1px',
                            height: selectionBorders.top
                              ? selectionBorders.bottom
                                ? '100%'
                                : 'calc(100% + 1px)'
                              : selectionBorders.bottom
                                ? 'calc(100% + 1px)'
                                : 'calc(100% + 2px)',
                          }}
                        />
                      )}
                      {/* 右の境界線（縦線） - セル間ボーダーを覆うよう拡張 */}
                      {selectionBorders.right && (
                        <span
                          className="pointer-events-none absolute right-0 z-10 w-[1px]"
                          style={{
                            backgroundColor: theme.primaryColor,
                            top: selectionBorders.top ? '0' : '-1px',
                            height: selectionBorders.top
                              ? selectionBorders.bottom
                                ? '100%'
                                : 'calc(100% + 1px)'
                              : selectionBorders.bottom
                                ? 'calc(100% + 1px)'
                                : 'calc(100% + 2px)',
                          }}
                        />
                      )}
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </div>
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
