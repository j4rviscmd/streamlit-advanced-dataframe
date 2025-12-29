/**
 * AdvancedDataFrame - Phase 2実装
 * TanStack Tableを使用した基本的なテーブルコンポーネント
 *
 * Phase 1機能:
 * - 基本的なデータ表示
 * - カラムソート（単一カラム、昇順/降順）
 * - カラム幅のリサイズ
 * - Streamlitテーマ対応
 *
 * Phase 2機能:
 * - 行選択（チェックボックス）
 * - セル選択・範囲選択
 * - カラムフィルタ（テキスト、数値範囲、セレクト、日付範囲）
 */

import { ColumnFilter } from '@/components/ColumnFilter'
import { FilterStatus } from '@/components/FilterStatus'
import { TableToolbar } from '@/components/TableToolbar'
import { Checkbox } from '@/components/ui/checkbox'
import { useColumnType } from '@/hooks/useColumnType'
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
  ColumnFiltersState,
  ColumnResizeMode,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Streamlit } from 'streamlit-component-lib'

/**
 * AdvancedDataFrameコンポーネント
 */
export function AdvancedDataFrame({
  data,
  columns,
  height,
  fullWidth = false,
  enableRowSelection = false,
  showFilterRecords = false,
  visibleColumns,
}: StreamlitProps) {
  const { theme, isDark, secondaryBackgroundColor, textColor } =
    useStreamlitTheme()

  // ソート状態管理
  const [sorting, setSorting] = useState<SortingState>([])

  // フィルタ状態管理
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // 行選択状態管理（選択された行のインデックス、単一選択のみ）
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)

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

  // テーブル全体のhover状態管理（ツールバー表示用）
  const [isTableHovered, setIsTableHovered] = useState(false)

  // グローバル検索クエリ
  const [searchQuery, setSearchQuery] = useState('')

  // 現在の一致インデックス（1始まり、0は一致なし）
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

  // カラム順序の状態管理（Phase 3）
  const [columnOrder, setColumnOrder] = useState<string[]>([])

  // ドラッグ中のカラムID
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null)

  // カラムの可視性状態管理（Phase 3）
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})

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

  /**
   * 背景色を暗くする関数
   */
  const darkenColor = useCallback((color: string, amount: number = 0.5) => {
    // "#RRGGBB" 形式の色を暗くする
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    // 黒に近づける（暗くする）
    const newR = Math.round(r * (1 - amount))
    const newG = Math.round(g * (1 - amount))
    const newB = Math.round(b * (1 - amount))

    return `rgb(${newR}, ${newG}, ${newB})`
  }, [])

  // ヘッダの通常時の背景色
  const headerNormalBgColor = useMemo(
    () =>
      isDark
        ? darkenColor(secondaryBackgroundColor, 0.3) // ダーク: 2段階暗く
        : lightenColor(secondaryBackgroundColor, 0.5), // ライト: 維持
    [secondaryBackgroundColor, isDark, lightenColor, darkenColor],
  )

  // ヘッダのhover時の背景色
  const headerHoverBgColor = useMemo(
    () =>
      isDark
        ? secondaryBackgroundColor // ダーク: 元の色（デフォルトより明るく）
        : secondaryBackgroundColor, // ライト: 維持
    [secondaryBackgroundColor, isDark],
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

  /**
   * カラムタイプマップを取得（フィルタUIの種類を決定）
   */
  const columnTypeMap = useColumnType(data, columns)

  /**
   * テキストカラムのユニーク値を取得（10個以下の場合のみ）
   */
  const uniqueValuesMap = useMemo(() => {
    const map = new Map<string, string[]>()

    columns.forEach((col) => {
      const colType = columnTypeMap.get(col.id)
      if (colType !== 'text') return

      const values = data
        .map((row) => String(row[col.id] ?? ''))
        .filter((val) => val !== '')

      const uniqueValues = Array.from(new Set(values)).sort()
      if (uniqueValues.length > 0 && uniqueValues.length <= 10) {
        map.set(col.id, uniqueValues)
      }
    })

    return map
  }, [data, columns, columnTypeMap])

  // カラム定義をTanStack Table形式に変換
  const columnHelper = createColumnHelper<RowData>()
  const tableColumns: ColumnDef<RowData, unknown>[] = useMemo(() => {
    const dataColumns = columns.map((col) =>
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
        // カスタムフィルタ関数（カラムタイプに応じて処理）
        filterFn: (row, columnId, filterValue) => {
          const cellValue = row.getValue(columnId)
          const colType = columnTypeMap.get(columnId)

          // フィルタが有効でない場合はすべて表示
          if (!colType) return true

          switch (colType) {
            case 'text': {
              // テキストフィルタ: 文字列の場合は部分一致、オブジェクトの場合は複数選択
              if (!filterValue || filterValue === '') return true

              // 複数選択フィルタの場合
              if (
                typeof filterValue === 'object' &&
                (filterValue as any).type === 'multiselect'
              ) {
                const selectedValues = (filterValue as any).values as string[]
                if (selectedValues.length === 0) return true
                const cellText = String(cellValue ?? '')
                return selectedValues.includes(cellText)
              }

              // テキスト検索の場合
              const searchValue = String(filterValue).toLowerCase()
              const cellText = String(cellValue ?? '').toLowerCase()
              return cellText.includes(searchValue)
            }
            case 'number': {
              // 数値範囲フィルタ: [min, max]
              if (!filterValue) return true
              const [min, max] = filterValue as [
                number | undefined,
                number | undefined,
              ]
              if (min === undefined && max === undefined) return true

              const numValue = Number(cellValue)
              if (isNaN(numValue)) return false

              if (min !== undefined && numValue < min) return false
              if (max !== undefined && numValue > max) return false
              return true
            }
            case 'date': {
              // 日付範囲フィルタ: [start, end]
              if (!filterValue) return true
              const [start, end] = filterValue as [
                Date | undefined,
                Date | undefined,
              ]
              if (start === undefined && end === undefined) return true

              // セル値をDateオブジェクトに変換
              let cellDate: Date | null = null
              if (cellValue instanceof Date) {
                cellDate = cellValue
              } else if (typeof cellValue === 'string') {
                cellDate = new Date(cellValue)
              }

              if (!cellDate || isNaN(cellDate.getTime())) return false

              // 開始日チェック（start <= cellDate）
              if (start !== undefined) {
                const startTime = new Date(start).setHours(0, 0, 0, 0)
                const cellTime = new Date(cellDate).setHours(0, 0, 0, 0)
                if (cellTime < startTime) return false
              }

              // 終了日チェック（cellDate <= end）
              if (end !== undefined) {
                const endTime = new Date(end).setHours(23, 59, 59, 999)
                const cellTime = new Date(cellDate).setHours(0, 0, 0, 0)
                if (cellTime > endTime) return false
              }

              return true
            }
            // selectは今後実装
            default:
              return true
          }
        },
      }),
    )

    // 行選択機能が有効な場合、チェックボックスカラムを先頭に追加
    if (enableRowSelection) {
      const selectionColumn: ColumnDef<RowData, unknown> = {
        id: '__selection__',
        header: '',
        size: 50,
        enableSorting: false,
        enableResizing: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={selectedRowIndex === row.index}
              onCheckedChange={() => {
                setSelectedRowIndex(
                  selectedRowIndex === row.index ? null : row.index,
                )
              }}
              className="data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500"
            />
          </div>
        ),
      }
      return [selectionColumn, ...dataColumns]
    }

    return dataColumns
  }, [
    columns,
    columnHelper,
    numericColumns,
    enableRowSelection,
    selectedRowIndex,
  ])

  // TanStack Tableインスタンス作成
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnOrder,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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

  // カラム順序の初期化（tableColumnsが変更されたとき）
  useEffect(() => {
    if (columnOrder.length === 0) {
      const initialOrder = tableColumns.map((col) => col.id as string)
      setColumnOrder(initialOrder)
    }
  }, [tableColumns, columnOrder.length])

  // カラム可視性の初期化（visibleColumnsが指定されている場合）
  useEffect(() => {
    if (visibleColumns && visibleColumns.length > 0) {
      const visibility: Record<string, boolean> = {}
      tableColumns.forEach((col) => {
        const colId = col.id as string
        // 選択カラムは常に表示
        if (colId === '__selection__') {
          visibility[colId] = true
        } else {
          visibility[colId] = visibleColumns.includes(colId)
        }
      })
      setColumnVisibility(visibility)
    }
  }, [visibleColumns, tableColumns])

  /**
   * グローバル検索の一致箇所を計算
   * 検索クエリに一致するセルのリスト（行インデックスとカラムIDの組み合わせ）
   */
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return []

    const matches: CellPosition[] = []
    const query = searchQuery.toLowerCase()

    table.getRowModel().rows.forEach((row, rowIndex) => {
      columnIds.forEach((columnId) => {
        // 選択カラムはスキップ
        if (columnId === '__selection__') return

        const cellValue = row.getValue(columnId)
        const cellText = String(cellValue ?? '').toLowerCase()

        if (cellText.includes(query)) {
          matches.push({ rowIndex, columnId })
        }
      })
    })

    return matches
  }, [searchQuery, table, columnIds])

  // 総一致件数
  const totalMatches = searchMatches.length

  // 検索クエリが変更されたら、一致インデックスをリセット
  useEffect(() => {
    if (totalMatches > 0) {
      setCurrentMatchIndex(1)
    } else {
      setCurrentMatchIndex(0)
    }
  }, [searchQuery, totalMatches])

  /**
   * 次の一致箇所へジャンプ
   */
  const handleNextMatch = useCallback(() => {
    if (totalMatches === 0) return
    setCurrentMatchIndex((prev) => (prev >= totalMatches ? 1 : prev + 1))
  }, [totalMatches])

  /**
   * 前の一致箇所へジャンプ
   */
  const handlePrevMatch = useCallback(() => {
    if (totalMatches === 0) return
    setCurrentMatchIndex((prev) => (prev <= 1 ? totalMatches : prev - 1))
  }, [totalMatches])

  /**
   * カラムのドラッグ開始
   */
  const handleColumnDragStart = useCallback(
    (columnId: string, e: React.DragEvent) => {
      setDraggedColumnId(columnId)
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/html', columnId)
    },
    [],
  )

  /**
   * カラムのドラッグオーバー
   */
  const handleColumnDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  /**
   * カラムのドロップ
   */
  const handleColumnDrop = useCallback(
    (targetColumnId: string, e: React.DragEvent) => {
      e.preventDefault()
      if (!draggedColumnId || draggedColumnId === targetColumnId) return

      setColumnOrder((prevOrder) => {
        const newOrder = [...prevOrder]
        const draggedIndex = newOrder.indexOf(draggedColumnId)
        const targetIndex = newOrder.indexOf(targetColumnId)

        // 配列から削除して、新しい位置に挿入
        newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, draggedColumnId)

        return newOrder
      })

      setDraggedColumnId(null)
    },
    [draggedColumnId],
  )

  /**
   * カラムのドラッグ終了
   */
  const handleColumnDragEnd = useCallback(() => {
    setDraggedColumnId(null)
  }, [])

  /**
   * セルが検索一致箇所かどうかをチェック
   */
  const isCellMatched = useCallback(
    (rowIndex: number, columnId: string): boolean => {
      if (!searchQuery.trim()) return false
      return searchMatches.some(
        (match) => match.rowIndex === rowIndex && match.columnId === columnId,
      )
    },
    [searchQuery, searchMatches],
  )

  /**
   * セルが現在の一致箇所かどうかをチェック
   */
  const isCurrentMatch = useCallback(
    (rowIndex: number, columnId: string): boolean => {
      if (currentMatchIndex === 0 || totalMatches === 0) return false
      const currentMatch = searchMatches[currentMatchIndex - 1]
      return (
        currentMatch?.rowIndex === rowIndex &&
        currentMatch?.columnId === columnId
      )
    },
    [currentMatchIndex, totalMatches, searchMatches],
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

  // 行選択状態が変更されたらStreamlitへ通知
  useEffect(() => {
    if (enableRowSelection) {
      Streamlit.setComponentValue(selectedRowIndex)
    }
  }, [selectedRowIndex, enableRowSelection])

  // FilterStatus用の値を計算
  const totalRows = data.length
  const filteredRows = table.getRowModel().rows.length
  const isFiltered = columnFilters.length > 0

  return (
    <>
      <div
        ref={tableRef}
        className={cn(
          'relative overflow-auto rounded-md border',
          fullWidth ? 'w-full' : 'w-fit',
        )}
        style={{
          maxHeight: height ? `${height}px` : 'none',
          fontFamily: theme.font,
          color: textColor,
          borderColor: borderColor,
        }}
        onMouseEnter={() => setIsTableHovered(true)}
        onMouseLeave={() => setIsTableHovered(false)}
      >
      {/* テーブルツールバー（検索機能など） */}
      <TableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentMatchIndex={currentMatchIndex}
        totalMatches={totalMatches}
        onNextMatch={handleNextMatch}
        onPrevMatch={handlePrevMatch}
        isVisible={isTableHovered}
      />
      <table
        className={cn(fullWidth ? 'w-full' : 'w-fit')}
        style={{ borderCollapse: 'separate', borderSpacing: 0 }}
      >
        <thead className="sticky top-0 z-20">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, headerIndex) => {
                const isFirstColumn = headerIndex === 0
                const isLastColumn =
                  headerIndex === headerGroup.headers.length - 1

                const isHovered = hoveredHeaderId === header.id
                const isNumeric = numericColumns.has(header.column.id)
                const isSelectionColumn = header.column.id === '__selection__'
                const isDragging = draggedColumnId === header.column.id
                const isDraggable = !isSelectionColumn

                return (
                  <th
                    key={header.id}
                    draggable={isDraggable}
                    onDragStart={
                      isDraggable
                        ? (e) => handleColumnDragStart(header.column.id, e)
                        : undefined
                    }
                    onDragOver={isDraggable ? handleColumnDragOver : undefined}
                    onDrop={
                      isDraggable
                        ? (e) => handleColumnDrop(header.column.id, e)
                        : undefined
                    }
                    onDragEnd={isDraggable ? handleColumnDragEnd : undefined}
                    className={cn(
                      'sticky top-0 z-20 px-3 text-sm font-light transition-colors duration-150 select-none',
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
                        ? headerHoverBgColor
                        : headerNormalBgColor,
                      borderTop: 'none',
                      borderLeft: isFirstColumn
                        ? 'none'
                        : `1px solid ${borderColor}`,
                      borderRight: 'none',
                      borderBottom: `1px solid ${borderColor}`,
                      opacity: isDragging ? 0.5 : 1,
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                    onMouseEnter={() => setHoveredHeaderId(header.id)}
                    onMouseLeave={() => setHoveredHeaderId(null)}
                  >
                    <div className="flex items-center justify-between w-full opacity-70">
                      <div className="flex items-center gap-1">
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
                      {/* フィルタアイコン（フィルタ有効カラムのみ、右端に配置） */}
                      {columnTypeMap.has(header.column.id) && (
                        <ColumnFilter
                          column={header.column}
                          columnType={columnTypeMap.get(header.column.id)!}
                          uniqueValues={uniqueValuesMap.get(header.column.id)}
                          onOpenChange={(open) => {
                            // Popover開いている間はヘッダのホバー状態をクリア
                            if (open) {
                              setHoveredHeaderId(null)
                            }
                          }}
                          onPopoverMouseEnter={() => {
                            // Popoverコンテンツにマウスが入ったらヘッダのホバー状態をクリア
                            setHoveredHeaderId(null)
                          }}
                        />
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
        <tbody className="relative z-10">
          {table.getRowModel().rows.map((row, rowIndex) => {
            const isFirstRow = rowIndex === 0
            const isLastRow = rowIndex === table.getRowModel().rows.length - 1
            const isRowHovered = hoveredRowIndex === rowIndex
            const isRowSelected =
              enableRowSelection && selectedRowIndex === rowIndex

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
                  const isSelectionColumn = cell.column.id === '__selection__'
                  const isMatched = isCellMatched(rowIndex, cell.column.id)
                  const isCurrentMatchCell = isCurrentMatch(rowIndex, cell.column.id)

                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        'relative px-3 text-sm select-none',
                        isSelectionColumn ? '' : 'cursor-cell',
                        isNumeric ? 'text-right' : 'text-left',
                      )}
                      style={{
                        width: cell.column.getSize(),
                        paddingTop: '0.4375rem',
                        paddingBottom: '0.4375rem',
                        borderTop: 'none',
                        borderLeft: isFirstColumn
                          ? 'none'
                          : `1px solid ${borderColor}`,
                        borderRight: 'none',
                        borderBottom: isLastRow
                          ? 'none'
                          : `1px solid ${borderColor}`,
                        backgroundColor: isSelectionColumn
                          ? isRowSelected
                            ? isDark
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(239, 68, 68, 0.1)'
                            : isRowHovered
                              ? headerHoverBgColor
                              : headerNormalBgColor
                          : isCurrentMatchCell
                            ? isDark
                              ? 'rgba(239, 68, 68, 0.3)'
                              : 'rgba(239, 68, 68, 0.25)'
                            : isMatched
                              ? isDark
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(239, 68, 68, 0.1)'
                              : isSelected
                                ? isDark
                                  ? `${theme.primaryColor}20`
                                  : `${theme.primaryColor}15`
                                : isRowSelected
                                  ? isDark
                                    ? 'rgba(239, 68, 68, 0.15)'
                                    : 'rgba(239, 68, 68, 0.1)'
                                  : isRowHovered
                                    ? rowHoverBgColor
                                    : 'transparent',
                        overflow: 'visible',
                        transition: 'background-color 0.1s ease',
                      }}
                      onMouseDown={
                        isSelectionColumn
                          ? undefined
                          : (e) =>
                              handleCellMouseDown(rowIndex, cell.column.id, e)
                      }
                      onMouseEnter={
                        isSelectionColumn
                          ? undefined
                          : () => handleCellMouseEnter(rowIndex, cell.column.id)
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

      {/* フィルタレコード数表示 */}
      {showFilterRecords && (
        <div
          className={cn(fullWidth ? 'w-full' : 'w-fit')}
          style={{
            fontFamily: theme.font,
            color: textColor,
          }}
        >
          <FilterStatus
            totalRows={totalRows}
            filteredRows={filteredRows}
            isFiltered={isFiltered}
          />
        </div>
      )}
    </>
  )
}
