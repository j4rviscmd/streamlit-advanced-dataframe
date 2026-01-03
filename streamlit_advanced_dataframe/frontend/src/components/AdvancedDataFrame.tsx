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
  type ColumnConfig,
} from '@/types/table'
import {
  ColumnDef,
  ColumnFiltersState,
  ColumnResizeMode,
  createColumnHelper,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Streamlit } from 'streamlit-component-lib'

/**
 * 複数選択フィルタの値の型
 */
interface MultiSelectFilterValue {
  type: 'multiselect'
  values: string[]
}

/**
 * フィルタ値がMultiSelectFilterValueかどうかを判定する型ガード
 */
function isMultiSelectFilter(value: unknown): value is MultiSelectFilterValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as MultiSelectFilterValue).type === 'multiselect'
  )
}

/**
 * テーブル行の固定高さ（px）
 * padding(7px*2) + line-height(21px) + borderBottom(1px) = 36px
 */
const ROW_HEIGHT = 36

/**
 * AdvancedDataFrameコンポーネント
 */
export function AdvancedDataFrame({
  data: rawData,
  columns: rawColumns,
  height,
  useContainerWidth = false,
  selectionMode,
  showRowCount = false,
  columnOrder,
  headerGroups,
  expandable = false,
  subRowsKey = 'subRows',
  showSummary = true,
}: StreamlitProps) {
  // データとカラムの検証（undefinedやnullの場合は空配列にフォールバック）
  const data = Array.isArray(rawData) ? rawData : []
  const columns = Array.isArray(rawColumns) ? rawColumns : []

  const { theme, isDark, secondaryBackgroundColor, textColor } =
    useStreamlitTheme()

  // ソート状態管理
  const [sorting, setSorting] = useState<SortingState>([])

  // フィルタ状態管理
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // 展開状態管理（Phase 4で追加）
  const [expanded, setExpanded] = useState<ExpandedState>({})

  // 前回のフレーム高さを記憶（無限ループ防止）
  const previousHeightRef = useRef<number>(0)

  // 展開状態が変わった時にフレームの高さを再計算
  // expandedオブジェクトそのものではなく、展開されている行の数を監視
  const expandedCount = useMemo(() => Object.keys(expanded).length, [expanded])

  useEffect(() => {
    if (expandable && tableRef.current) {
      // DOM更新が完了してから高さを再計算（展開・折りたたみ両方に対応）
      const timer = setTimeout(() => {
        // document.body.scrollHeightではなく、実際のテーブルコンテナの高さを測定
        // （iframeの高さが固定されている場合、body.scrollHeightは縮小されないため）
        const newHeight =
          tableRef.current?.scrollHeight || document.body.scrollHeight
        // 高さが実際に変わった場合のみsetFrameHeightを呼ぶ（無限ループ防止）
        if (newHeight !== previousHeightRef.current) {
          previousHeightRef.current = newHeight
          Streamlit.setFrameHeight(newHeight)
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [expandedCount, expandable])

  // 行選択状態管理（選択された行のインデックス配列）
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([])
  // ユーザーが選択を変更したかどうかのフラグ（初回レンダリング時のsetComponentValue呼び出しを防ぐ）
  const hasUserSelectedRef = useRef(false)

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

  // コンテナ幅の監視（fullWidth時の伸縮判定用）
  const [containerWidth, setContainerWidth] = useState(0)

  // グローバル検索クエリ
  const [searchQuery, setSearchQuery] = useState('')

  // 現在の一致インデックス（1始まり、0は一致なし）
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

  // カラム順序の状態管理（Phase 3）
  const [tableColumnOrder, setTableColumnOrder] = useState<string[]>([])

  // ドラッグ中のカラムID
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null)

  // カラムの可視性状態管理（Phase 3）
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({})

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
   * boolean型カラムを判定
   * カラムのすべての値（nullを除く）がbooleanの場合、そのカラムをbooleanカラムとする
   */
  const booleanColumns = useMemo(() => {
    const booleanCols = new Set<string>()

    columns.forEach((col) => {
      const values = data.map((row) => row[col.id]).filter((val) => val != null)

      if (values.length === 0) return

      const allBoolean = values.every((val) => typeof val === 'boolean')
      if (allBoolean) {
        booleanCols.add(col.id)
      }
    })

    return booleanCols
  }, [data, columns])

  /**
   * カラムタイプマップを取得（フィルタUIの種類を決定）
   */
  const columnTypeMap = useColumnType(data, columns)

  /**
   * テキスト・セレクトカラムのユニーク値を取得
   * - textタイプ: 10個以下の場合のみ
   * - selectタイプ: 常に取得
   */
  const uniqueValuesMap = useMemo(() => {
    const map = new Map<string, string[]>()

    columns.forEach((col) => {
      const colType = columnTypeMap.get(col.id)
      if (colType !== 'text' && colType !== 'select') return

      const values = data
        .map((row) => String(row[col.id] ?? ''))
        .filter((val) => val !== '')

      const uniqueValues = Array.from(new Set(values)).sort()
      // selectタイプは常に、textタイプは10個以下の場合のみ
      if (
        uniqueValues.length > 0 &&
        (colType === 'select' || uniqueValues.length <= 10)
      ) {
        map.set(col.id, uniqueValues)
      }
    })

    return map
  }, [data, columns, columnTypeMap])

  /**
   * カラムの推定幅を計算（コンテンツfit）
   * - 英数字: 8px/文字
   * - 日本語（全角）: 16px/文字
   * - パディング: 24px（左右12pxずつ）
   * - アイコン（フィルタ、ソート）: 40px
   */
  const estimateColumnWidth = useCallback(
    (columnId: string, header: string): number => {
      // Boolean型カラムは固定幅（チェックボックス表示のため）
      if (booleanColumns.has(columnId)) {
        return 120
      }

      // ヘッダの文字幅を計算
      const headerChars = header.split('')
      const headerWidth =
        headerChars.reduce((sum, char) => {
          // 全角文字（日本語、中国語など）は16px、半角は8px
          return sum + (char.match(/[\u3000-\u9FFF\uFF00-\uFFEF]/) ? 16 : 8)
        }, 0) +
        24 + // パディング
        40 // アイコン（フィルタ、ソート用の余白）

      // データの最大文字幅を計算（最大100行まで）
      const sampleSize = Math.min(100, data.length)
      let maxDataWidth = 0

      for (let i = 0; i < sampleSize; i++) {
        const rawValue = data[i][columnId]
        // 数値の場合は3桁区切りフォーマット後の文字列を使用
        const value =
          typeof rawValue === 'number'
            ? rawValue.toLocaleString()
            : String(rawValue ?? '')
        const chars = value.split('')
        const width = chars.reduce((sum, char) => {
          return sum + (char.match(/[\u3000-\u9FFF\uFF00-\uFFEF]/) ? 16 : 8)
        }, 0)
        maxDataWidth = Math.max(maxDataWidth, width)
      }

      const dataWidth = maxDataWidth + 24 // パディング

      // ヘッダとデータの最大幅を採用、最小80px、最大500px
      return Math.max(80, Math.min(500, Math.max(headerWidth, dataWidth)))
    },
    [data, booleanColumns],
  )

  // カラム定義をTanStack Table形式に変換
  const columnHelper = createColumnHelper<RowData>()
  const tableColumns: ColumnDef<RowData, unknown>[] = useMemo(() => {
    // カラム定義を作成する共通関数
    const createColumnDef = (
      col: ColumnConfig,
    ): ColumnDef<RowData, unknown> => {
      return columnHelper.accessor(col.id, {
        id: col.id,
        header: col.header,
        size: estimateColumnWidth(col.id, col.header),
        enableSorting: col.enableSorting ?? true,
        enableResizing: col.enableResizing ?? true,
        // セルの表示フォーマット（数値カラムは3桁区切り、booleanはチェックボックス）
        cell: (info) => {
          const value = info.getValue()

          // boolean型カラムの場合、チェックボックスで表示（読み取り専用）
          if (booleanColumns.has(col.id) && typeof value === 'boolean') {
            return (
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={value}
                  disabled
                  style={{
                    borderColor: isDark
                      ? 'rgba(250, 250, 250, 0.4)'
                      : 'rgba(0, 0, 0, 0.3)',
                    opacity: 0.7,
                    cursor: 'default',
                  }}
                />
              </div>
            )
          }

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
              if (isMultiSelectFilter(filterValue)) {
                const selectedValues = filterValue.values
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
            case 'select': {
              // セレクトフィルタ: 複数選択のみ
              if (!filterValue || filterValue === '') return true

              // 複数選択フィルタの場合
              if (isMultiSelectFilter(filterValue)) {
                const selectedValues = filterValue.values
                if (selectedValues.length === 0) return true
                const cellText = String(cellValue ?? '')
                return selectedValues.includes(cellText)
              }

              // テキスト検索の場合（フォールバック）
              const searchValue = String(filterValue).toLowerCase()
              const cellText = String(cellValue ?? '').toLowerCase()
              return cellText.includes(searchValue)
            }
            default:
              return true
          }
        },
      })
    }

    // データカラムを作成
    const dataColumns = columns.map(createColumnDef)

    // カラムをグループ化（headerGroupsが指定されている場合）
    let finalColumns: ColumnDef<RowData, unknown>[]

    if (headerGroups && headerGroups.length > 0) {
      // グループに属するカラムIDのセットを作成
      const groupedColumnIds = new Set<string>()
      headerGroups.forEach((group) => {
        group.columns.forEach((colId) => groupedColumnIds.add(colId))
      })

      // グループオブジェクトを作成
      const groupColumns: ColumnDef<RowData, unknown>[] = headerGroups.map(
        (group) => ({
          id: group.id ?? group.header, // idが未指定の場合はheaderを使用
          header: group.header,
          columns: dataColumns.filter((col) =>
            group.columns.includes(col.id as string),
          ),
        }),
      )

      // グループに属さないカラム
      const ungroupedColumns = dataColumns.filter(
        (col) => !groupedColumnIds.has(col.id as string),
      )

      // グループカラムとグループに属さないカラムを結合
      finalColumns = [...groupColumns, ...ungroupedColumns]
    } else {
      finalColumns = dataColumns
    }

    // 特殊カラムを追加（選択、展開）
    const specialColumns: ColumnDef<RowData, unknown>[] = []

    // 行選択機能が有効な場合、チェックボックスカラムを先頭に追加
    if (selectionMode) {
      const selectionColumn: ColumnDef<RowData, unknown> = {
        id: '__selection__',
        header: '',
        size: 50,
        enableSorting: false,
        enableResizing: false,
        cell: ({ row }) => {
          // サブ行（depth > 0）の場合はチェックボックスを表示しない
          if (row.depth > 0) {
            return <div className="flex items-center justify-center" />
          }

          // 親行の元のDataFrameインデックスを取得
          const originalIndex = data.findIndex((item) => item === row.original)
          const isChecked = selectedRowIndices.includes(originalIndex)

          return (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => {
                  // ユーザー操作フラグを立てる
                  hasUserSelectedRef.current = true
                  if (selectionMode === 'single-row') {
                    // 単一選択モード: 同じ行をクリックで解除、別の行で置き換え
                    setSelectedRowIndices(
                      isChecked ? [] : [originalIndex],
                    )
                  } else {
                    // 複数選択モード: トグル動作
                    setSelectedRowIndices((prev) =>
                      isChecked
                        ? prev.filter((idx) => idx !== originalIndex)
                        : [...prev, originalIndex],
                    )
                  }
                }}
                style={{
                  // ダークテーマ対応のボーダー色
                  borderColor: isChecked
                    ? theme.primaryColor
                    : isDark
                      ? 'rgba(250, 250, 250, 0.4)'
                      : 'rgba(0, 0, 0, 0.3)',
                  // チェック時の背景色をStreamlitテーマカラーに
                  backgroundColor: isChecked
                    ? theme.primaryColor
                    : 'transparent',
                }}
              />
            </div>
          )
        },
      }
      specialColumns.push(selectionColumn)
    }

    // 行展開機能が有効な場合、展開ボタンカラムを追加
    if (expandable) {
      const expanderColumn: ColumnDef<RowData, unknown> = {
        id: '__expander__',
        header: '',
        size: 50,
        enableSorting: false,
        enableResizing: false,
        cell: ({ row }) => {
          const canExpand = row.getCanExpand()
          if (!canExpand) return null

          return (
            <button
              onClick={row.getToggleExpandedHandler()}
              className="inline-flex h-full w-full items-center justify-center"
              style={{ cursor: 'pointer' }}
            >
              {row.getIsExpanded() ? '▼' : '▶'}
            </button>
          )
        },
      }
      specialColumns.push(expanderColumn)
    }

    return [...specialColumns, ...finalColumns]
  }, [
    columns,
    columnHelper,
    numericColumns,
    booleanColumns,
    selectionMode,
    selectedRowIndices,
    headerGroups,
    columnTypeMap,
    expandable,
    estimateColumnWidth,
    theme.primaryColor,
    isDark,
    data,
  ])

  // TanStack Tableインスタンス作成
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnOrder: tableColumnOrder,
      columnVisibility,
      expanded,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setTableColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: expandable ? getExpandedRowModel() : undefined,
    getSubRows: expandable ? (row) => row[subRowsKey] as RowData[] : undefined,
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

  // フィルタ・ソート後の行データを取得（依存配列用に変数として抽出）
  const tableRows = table.getRowModel().rows

  /**
   * 集計行の値を計算（フィルタ・ソート後のデータを使用、親行のみを対象）
   * - 数値カラム: 合計
   * - Boolカラム: True率（%）
   * - その他: 空白
   */
  const aggregationRow = useMemo(() => {
    if (!showSummary) return null

    // 親行のみを抽出（階層データの場合）
    const parentRows = expandable
      ? tableRows
          .filter((row) => row.depth === 0) // 深度0が親行
          .map((row) => row.original)
      : tableRows.map((row) => row.original)

    const aggregation: Record<string, string | number> = {}

    columns.forEach((col) => {
      const colId = col.id
      const values = parentRows
        .map((row) => row[colId])
        .filter((val) => val != null)

      if (values.length === 0) {
        aggregation[colId] = ''
        return
      }

      // Boolean型カラムの場合: True率を計算
      if (booleanColumns.has(colId)) {
        const boolValues = values as boolean[]
        const trueCount = boolValues.filter((v) => v === true).length
        const percentage = (trueCount / boolValues.length) * 100
        aggregation[colId] = `${Math.round(percentage)}%`
        return
      }

      // 数値カラムの場合: 合計を計算
      const allNumbers = values.every((val) => typeof val === 'number')
      if (allNumbers) {
        const sum = (values as number[]).reduce((acc, val) => acc + val, 0)
        aggregation[colId] = sum
        return
      }

      // その他（テキスト、日付など）: 空白
      aggregation[colId] = ''
    })

    return aggregation
  }, [showSummary, tableRows, columns, booleanColumns, expandable])

  // 行の仮想化設定
  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => tableRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10, // スクロール方向に10行余分にレンダリング
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  // 枠線の色（テーマに応じて変更）
  const borderColor = isDark ? 'rgba(250, 250, 250, 0.2)' : 'rgba(0, 0, 0, 0.1)'

  // カラムIDのインデックスを取得（選択範囲の計算に使用）
  // グループカラムを除外し、リーフカラム（実際のデータカラム）のみを取得
  const columnIds = useMemo(
    () => table.getAllLeafColumns().map((col) => col.id),
    [table],
  )

  // コンテナ幅の監視（ResizeObserver）
  useEffect(() => {
    if (!tableRef.current) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    observer.observe(tableRef.current)
    return () => observer.disconnect()
  }, [])

  // コンテンツ合計幅の計算
  const totalContentWidth = useMemo(() => {
    return table
      .getAllLeafColumns()
      .reduce((sum, col) => sum + col.getSize(), 0)
  }, [table])

  // useContainerWidth時にカラムを伸縮すべきかどうかの判定
  // コンテンツ合計幅 < コンテナ幅 の場合のみ伸縮
  const shouldStretch =
    useContainerWidth && containerWidth > 0 && totalContentWidth < containerWidth

  // カラム幅を計算する関数
  const getColumnWidth = useCallback(
    (columnSize: number): number | string => {
      if (!shouldStretch) return columnSize
      // 割合で計算（%）
      return `${(columnSize / totalContentWidth) * 100}%`
    },
    [shouldStretch, totalContentWidth],
  )

  // カラム順序の初期化（tableColumnsが変更されたとき）
  useEffect(() => {
    if (tableColumnOrder.length === 0) {
      const initialOrder = tableColumns.map((col) => col.id as string)
      setTableColumnOrder(initialOrder)
    }
  }, [tableColumns, tableColumnOrder.length])

  // カラム可視性の初期化（columnOrderが指定されている場合）
  useEffect(() => {
    if (columnOrder && columnOrder.length > 0) {
      const visibility: Record<string, boolean> = {}
      tableColumns.forEach((col) => {
        const colId = col.id as string
        // 選択カラムは常に表示
        if (colId === '__selection__') {
          visibility[colId] = true
        } else {
          visibility[colId] = columnOrder.includes(colId)
        }
      })

      // 現在の値と比較して、変更がある場合のみ更新（無限ループ防止）
      const hasChanges =
        Object.keys(visibility).some(
          (key) => columnVisibility[key] !== visibility[key],
        ) ||
        Object.keys(columnVisibility).some(
          (key) => columnVisibility[key] !== visibility[key],
        )

      if (hasChanges) {
        setColumnVisibility(visibility)
      }
    }
  }, [columnOrder, tableColumns, columnVisibility])

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
   * 検索マッチへの自動スクロール
   */
  useEffect(() => {
    if (currentMatchIndex > 0 && searchMatches.length > 0) {
      const currentMatch = searchMatches[currentMatchIndex - 1]
      if (currentMatch) {
        rowVirtualizer.scrollToIndex(currentMatch.rowIndex, {
          align: 'center',
          behavior: 'smooth',
        })
      }
    }
  }, [currentMatchIndex, searchMatches, rowVirtualizer])

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

      setTableColumnOrder((prevOrder) => {
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

  // 行選択状態が変更されたらStreamlitへ通知（ユーザー操作時のみ）
  useEffect(() => {
    if (selectionMode && hasUserSelectedRef.current) {
      Streamlit.setComponentValue(selectedRowIndices)
    }
  }, [selectedRowIndices, selectionMode])

  // FilterStatus用の値を計算
  const totalRows = data.length
  const filteredRows = table.getRowModel().rows.length
  const isFiltered = columnFilters.length > 0

  // カラムがない場合は空のヘッダ + empty行を表示
  if (columns.length === 0) {
    return (
      <div
        className={cn(
          'relative max-w-full overflow-auto rounded-md',
          useContainerWidth ? 'w-full' : 'w-fit',
        )}
        style={{
          boxSizing: 'border-box',
          border: `1px solid ${borderColor}`,
          borderRadius: '0.375rem',
          fontFamily: theme.font,
          color: textColor,
        }}
      >
        <table style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th
                className="px-3 text-sm font-light"
                style={{
                  height: `${ROW_HEIGHT}px`,
                  backgroundColor: headerNormalBgColor,
                  borderBottom: `1px solid ${borderColor}`,
                  minWidth: '100px',
                }}
              />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                className="px-3 text-sm"
                style={{
                  height: `${ROW_HEIGHT}px`,
                  color: isDark ? '#6b7280' : '#9ca3af',
                  fontStyle: 'italic',
                }}
              >
                empty
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <>
      <div
        ref={tableRef}
        className={cn(
          'relative max-w-full overflow-auto rounded-md',
          useContainerWidth ? 'w-full' : 'w-fit',
        )}
        style={{
          maxHeight: height ? `${height}px` : 'none',
          boxSizing: 'border-box',
          borderLeft: `1px solid ${borderColor}`,
          borderRight: `1px solid ${borderColor}`,
          borderBottom: `1px solid ${borderColor}`,
          borderRadius: '0.375rem',
          fontFamily: theme.font,
          color: textColor,
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
          className={cn(useContainerWidth ? 'w-full' : 'w-fit')}
          style={{
            display: 'grid',
            borderCollapse: 'separate',
            borderSpacing: 0,
          }}
        >
          <thead
            style={{
              display: 'grid',
              position: 'sticky',
              top: 0,
              zIndex: 20,
              borderTop: `1px solid ${borderColor}`,
              borderTopLeftRadius: '0.375rem',
              borderTopRightRadius: '0.375rem',
              backgroundColor: headerNormalBgColor,
            }}
          >
            {/* ヘッダ行 */}
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                style={{
                  display: 'flex',
                  width: '100%',
                }}
              >
                {headerGroup.headers.map((header, headerIndex) => {
                  const isFirstColumn = headerIndex === 0

                  // グループヘッダかどうか（子カラムを持つ場合）
                  const isGroupHeader =
                    header.subHeaders && header.subHeaders.length > 0
                  const isHovered = hoveredHeaderId === header.id
                  const isNumeric = numericColumns.has(header.column.id)
                  const isBoolean = booleanColumns.has(header.column.id)
                  const isSelectionColumn = header.column.id === '__selection__'
                  const isExpanderColumn = header.column.id === '__expander__'
                  const isDragging = draggedColumnId === header.column.id
                  // グループヘッダ、選択カラム、展開カラムはドラッグ不可
                  const isDraggable =
                    !isSelectionColumn && !isExpanderColumn && !isGroupHeader

                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      draggable={isDraggable}
                      onDragStart={
                        isDraggable
                          ? (e) => handleColumnDragStart(header.column.id, e)
                          : undefined
                      }
                      onDragOver={
                        isDraggable ? handleColumnDragOver : undefined
                      }
                      onDrop={
                        isDraggable
                          ? (e) => handleColumnDrop(header.column.id, e)
                          : undefined
                      }
                      onDragEnd={isDraggable ? handleColumnDragEnd : undefined}
                      className={cn(
                        'px-3 text-sm font-light transition-colors duration-150 select-none',
                        isBoolean
                          ? 'text-center'
                          : isNumeric
                            ? 'text-right'
                            : 'text-left',
                        // グループヘッダ、選択カラム、展開カラムはソート不可
                        !isGroupHeader &&
                          !isSelectionColumn &&
                          !isExpanderColumn &&
                          header.column.getCanSort()
                          ? 'cursor-pointer'
                          : 'cursor-default',
                      )}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: getColumnWidth(header.getSize()),
                        minWidth: header.column.columnDef.minSize ?? 50,
                        flexGrow: shouldStretch ? 1 : 0,
                        flexShrink: 0,
                        height: `${ROW_HEIGHT}px`,
                        boxSizing: 'border-box',
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
                        position: 'relative',
                        overflow: 'hidden',
                        zIndex: 100 - headerIndex,
                      }}
                      onClick={
                        !isGroupHeader &&
                        !isSelectionColumn &&
                        !isExpanderColumn
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      onMouseEnter={() => setHoveredHeaderId(header.id)}
                      onMouseLeave={() => setHoveredHeaderId(null)}
                    >
                      <div className="flex w-full items-center justify-between opacity-70">
                        <div className="flex items-center gap-1 overflow-hidden">
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </span>
                          {/* ソートインジケーター（グループヘッダ以外で、ソート中のみ表示） */}
                          {!isGroupHeader &&
                            header.column.getCanSort() &&
                            header.column.getIsSorted() && (
                              <span className="shrink-0 text-xs opacity-60">
                                {header.column.getIsSorted() === 'asc'
                                  ? '↑'
                                  : '↓'}
                              </span>
                            )}
                        </div>
                        {/* フィルタアイコン（グループヘッダ以外で、フィルタ有効カラムのみ、右端に配置） */}
                        {!isGroupHeader &&
                          columnTypeMap.has(header.column.id) && (
                            <ColumnFilter
                              column={header.column}
                              columnType={columnTypeMap.get(header.column.id)!}
                              uniqueValues={uniqueValuesMap.get(
                                header.column.id,
                              )}
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

                      {/* カラムリサイズハンドル（グループヘッダ以外） */}
                      {!isGroupHeader && header.column.getCanResize() && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation() // ソートハンドラーの発火を防止
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault() // 親要素のdraggableイベントを抑制
                            e.stopPropagation() // カラム並び替えのドラッグと競合しないようにする
                            header.getResizeHandler()(e)
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault() // 親要素のdraggableイベントを抑制
                            e.stopPropagation() // カラム並び替えのドラッグと競合しないようにする
                            header.getResizeHandler()(
                              e as unknown as React.MouseEvent,
                            )
                          }}
                          className="resize-handle absolute top-0 h-full w-2.5 cursor-col-resize touch-none select-none"
                          style={{
                            right: '-5px', // カラム境界線の両側に配置（左右5pxずつ）
                            opacity: header.column.getIsResizing() ? 1 : 0.15, // 通常時も薄く表示
                            transition: 'opacity 0.15s ease',
                            zIndex: 1, // 親th内で最前面
                          }}
                          onMouseEnter={(e) => {
                            if (!header.column.getIsResizing()) {
                              const handleElement =
                                e.currentTarget as HTMLElement
                              const thElement =
                                handleElement.parentElement as HTMLElement
                              handleElement.style.opacity = '0.6' // ホバー時に濃く表示
                              if (thElement) {
                                thElement.style.zIndex = '31' // 親th要素を最前面に
                              }
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!header.column.getIsResizing()) {
                              const handleElement =
                                e.currentTarget as HTMLElement
                              const thElement =
                                handleElement.parentElement as HTMLElement
                              handleElement.style.opacity = '0.15' // 元に戻す
                              if (thElement) {
                                thElement.style.zIndex = '' // z-indexをリセット
                              }
                            }
                          }}
                        >
                          <div className="h-full w-full" />
                        </div>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody
            style={{
              display: 'grid',
              height: data.length === 0 ? `${ROW_HEIGHT}px` : `${totalSize}px`,
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* 空データ時の「empty」行（セル結合で中央表示） */}
            {data.length === 0 && (
              <tr
                style={{
                  display: 'flex',
                  width: '100%',
                  height: `${ROW_HEIGHT}px`,
                }}
              >
                <td
                  colSpan={table.getVisibleLeafColumns().length}
                  className="px-3 text-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: `${ROW_HEIGHT}px`,
                    boxSizing: 'border-box',
                    paddingTop: '0.4375rem',
                    paddingBottom: '0.4375rem',
                    color: isDark ? '#6b7280' : '#9ca3af',
                    fontStyle: 'italic',
                  }}
                >
                  empty
                </td>
              </tr>
            )}
            {virtualRows.map((virtualRow, virtualIndex) => {
              const row = table.getRowModel().rows[virtualRow.index]
              if (!row) return null
              const rowIndex = virtualRow.index
              const isLastRow = rowIndex === table.getRowModel().rows.length - 1
              // 仮想スクロールで表示されている最後の行（集計行がない場合のボーダー制御）
              const isLastVirtualRow = virtualIndex === virtualRows.length - 1
              const isRowHovered = hoveredRowIndex === rowIndex
              // 行選択のハイライト判定: 元データのインデックスで比較
              const rowOriginalIndex =
                row.depth === 0
                  ? data.findIndex((item) => item === row.original)
                  : -1
              const isRowSelected =
                selectionMode &&
                rowOriginalIndex !== -1 &&
                selectedRowIndices.includes(rowOriginalIndex)

              return (
                <tr
                  key={row.id}
                  style={{
                    display: 'flex',
                    position: 'absolute',
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onMouseEnter={() => setHoveredRowIndex(rowIndex)}
                  onMouseLeave={() => setHoveredRowIndex(null)}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => {
                    const isFirstColumn = cellIndex === 0

                    // 選択範囲がないときは選択判定をスキップ（パフォーマンス最適化）
                    const isSelected =
                      selectedCells.length > 0
                        ? isCellSelected(rowIndex, cell.column.id)
                        : false
                    const selectionBorders =
                      selectedCells.length > 0
                        ? getSelectionBorders(rowIndex, cell.column.id)
                        : {
                            top: false,
                            right: false,
                            bottom: false,
                            left: false,
                          }
                    const isNumeric = numericColumns.has(cell.column.id)
                    const isBoolean = booleanColumns.has(cell.column.id)
                    const isSelectionColumn = cell.column.id === '__selection__'
                    const isExpanderColumn = cell.column.id === '__expander__'
                    // 検索クエリがないときは一致判定をスキップ（パフォーマンス最適化）
                    const isMatched = searchQuery
                      ? isCellMatched(rowIndex, cell.column.id)
                      : false
                    const isCurrentMatchCell = searchQuery
                      ? isCurrentMatch(rowIndex, cell.column.id)
                      : false

                    // 最初のデータカラムかどうか（ツリー線表示用）
                    const specialColumnsCount =
                      (selectionMode ? 1 : 0) + (expandable ? 1 : 0)
                    const isFirstDataColumn = cellIndex === specialColumnsCount

                    // ツリー線の深さとインデント
                    const depth = row.depth
                    const indentSize = 24 // px per level

                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          'relative px-3 text-sm select-none',
                          isSelectionColumn || isExpanderColumn
                            ? ''
                            : 'cursor-cell',
                          isBoolean
                            ? 'text-center'
                            : isNumeric
                              ? 'text-right'
                              : 'text-left',
                        )}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isBoolean
                            ? 'center'
                            : isNumeric
                              ? 'flex-end'
                              : 'flex-start',
                          width: getColumnWidth(cell.column.getSize()),
                          minWidth: cell.column.columnDef.minSize ?? 50,
                          flexGrow: shouldStretch ? 1 : 0,
                          flexShrink: 0,
                          height: `${ROW_HEIGHT}px`,
                          boxSizing: 'border-box',
                          paddingTop: '0.4375rem',
                          paddingBottom: '0.4375rem',
                          borderTop: 'none',
                          borderLeft: isFirstColumn
                            ? 'none'
                            : `1px solid ${borderColor}`,
                          borderRight: 'none',
                          borderBottom:
                            isLastRow || (isLastVirtualRow && !showSummary)
                              ? 'none'
                              : `1px solid ${borderColor}`,
                          backgroundColor:
                            isSelectionColumn || isExpanderColumn
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
                          overflow: 'hidden',
                          transition: 'background-color 0.1s ease',
                        }}
                        onMouseDown={
                          isSelectionColumn || isExpanderColumn
                            ? undefined
                            : (e) =>
                                handleCellMouseDown(rowIndex, cell.column.id, e)
                        }
                        onMouseEnter={
                          isSelectionColumn || isExpanderColumn
                            ? undefined
                            : () =>
                                handleCellMouseEnter(rowIndex, cell.column.id)
                        }
                      >
                        {/* 上の境界線（横線） */}
                        {selectionBorders.top && (
                          <span
                            className="pointer-events-none absolute z-20"
                            style={{
                              backgroundColor: theme.primaryColor,
                              top: 0,
                              left: 0,
                              height: '1px',
                              width: 'calc(100% + 0.5px)', // セル間のボーダーを確実にカバー
                            }}
                          />
                        )}
                        {/* 下の境界線（横線） */}
                        {selectionBorders.bottom && (
                          <span
                            className="pointer-events-none absolute z-20"
                            style={{
                              backgroundColor: theme.primaryColor,
                              bottom: 0,
                              left: 0,
                              height: '1px',
                              width: 'calc(100% + 0.5px)', // セル間のボーダーを確実にカバー
                            }}
                          />
                        )}
                        {/* 左の境界線（縦線） */}
                        {selectionBorders.left && (
                          <span
                            className="pointer-events-none absolute z-20"
                            style={{
                              backgroundColor: theme.primaryColor,
                              left: 0,
                              top: 0,
                              width: '1px',
                              height: 'calc(100% + 0.5px)', // セル間のボーダーを確実にカバー
                            }}
                          />
                        )}
                        {/* 右の境界線（縦線） */}
                        {selectionBorders.right && (
                          <span
                            className="pointer-events-none absolute z-20"
                            style={{
                              backgroundColor: theme.primaryColor,
                              right: 0,
                              top: 0,
                              width: '1px',
                              height: 'calc(100% + 0.5px)', // セル間のボーダーを確実にカバー
                            }}
                          />
                        )}
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                          {isFirstDataColumn && depth > 0 ? (
                            <div
                              className="overflow-hidden text-ellipsis whitespace-nowrap"
                              style={{
                                paddingLeft: `${depth * indentSize}px`,
                              }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </div>
                          ) : (
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>

          {/* 集計行（フッター）または下部ボーダー専用行 */}
          {showSummary && aggregationRow ? (
            <tfoot
              style={{
                display: 'grid',
                position: 'sticky',
                bottom: 0,
                zIndex: 20,
              }}
            >
              <tr
                style={{
                  display: 'flex',
                  width: '100%',
                }}
              >
                {table.getVisibleLeafColumns().map((column, columnIndex) => {
                  const colId = column.id
                  const isSelectionColumn = colId === '__selection__'
                  const isExpanderColumn = colId === '__expander__'
                  const isFirstColumn = columnIndex === 0

                  // 集計行の背景色（通常より少しだけ暗め、不透明）
                  const aggregationBgColor = isDark
                    ? '#1E1E1E' // ダークモード: 濃いグレー
                    : '#F5F5F5' // ライトモード: 明るいグレー

                  // 選択・展開カラムは空セル
                  if (isSelectionColumn || isExpanderColumn) {
                    return (
                      <td
                        key={colId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: getColumnWidth(column.getSize()),
                          minWidth: column.columnDef.minSize ?? 50,
                          flexGrow: shouldStretch ? 1 : 0,
                          flexShrink: 0,
                          backgroundColor: aggregationBgColor,
                          borderTop: `1px solid ${
                            isDark
                              ? 'rgba(250, 250, 250, 0.2)'
                              : 'rgba(0, 0, 0, 0.1)'
                          }`,
                          borderLeft: isFirstColumn
                            ? 'none'
                            : `1px solid ${borderColor}`,
                          borderRight: 'none',
                          borderBottom: 'none',
                          padding: '8px 12px',
                          fontWeight: 600,
                          fontSize: '14px',
                          color: textColor,
                          overflow: 'hidden',
                        }}
                      />
                    )
                  }

                  const value = aggregationRow[colId]
                  const isBoolColumn = booleanColumns.has(colId)
                  const isNumericColumn = numericColumns.has(colId)

                  // 数値カラムの場合、3桁区切りでフォーマット
                  const displayValue =
                    typeof value === 'number' ? value.toLocaleString() : value

                  // 値があるかどうか（Σアイコン表示判定用）
                  const hasValue = value !== '' && value != null

                  return (
                    <td
                      title={displayValue}
                      className="cursor-default"
                      key={colId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: getColumnWidth(column.getSize()),
                        minWidth: column.columnDef.minSize ?? 50,
                        flexGrow: shouldStretch ? 1 : 0,
                        flexShrink: 0,
                        backgroundColor: aggregationBgColor,
                        borderTop: `1px solid ${
                          isDark
                            ? 'rgba(250, 250, 250, 0.2)'
                            : 'rgba(0, 0, 0, 0.1)'
                        }`,
                        borderLeft: isFirstColumn
                          ? 'none'
                          : `1px solid ${borderColor}`,
                        borderRight: 'none',
                        borderBottom: 'none',
                        padding: '8px 12px',
                        fontWeight: 600,
                        fontSize: '14px',
                        color: textColor,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Σアイコン（値がある場合のみ左寄せで表示） */}
                      {hasValue && (
                        <span
                          style={{
                            opacity: 0.5,
                            marginRight: '6px',
                            flexShrink: 0,
                          }}
                        >
                          Σ
                        </span>
                      )}
                      <div
                        className="overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{
                          flex: 1,
                          textAlign:
                            isNumericColumn || isBoolColumn ? 'right' : 'left',
                        }}
                      >
                        {displayValue}
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {/* フィルタレコード数表示 */}
      {showRowCount && (
        <div
          className={cn(useContainerWidth ? 'w-full' : 'w-fit')}
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
