import type { Column } from '@tanstack/react-table'
import { Filter } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Streamlit } from 'streamlit-component-lib'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { ColumnType, RowData } from '@/types/table'

import { DateRangeFilter } from './filters/DateRangeFilter'
import { NumberRangeFilter } from './filters/NumberRangeFilter'
import { TextFilter } from './filters/TextFilter'

/**
 * カラムフィルタコンポーネント
 *
 * ヘッダ内に配置されるフィルタアイコンとポップオーバーを提供します。
 * カラムタイプに応じて適切なフィルタUIを表示します。
 *
 * Phase 2 Step 2: テキストフィルタのみ実装
 * 後のステップで数値、セレクト、日付フィルタを追加予定
 */
interface ColumnFilterProps {
  /** TanStack Tableのカラムオブジェクト */
  column: Column<RowData>
  /** カラムのフィルタタイプ */
  columnType: ColumnType
  /** Popover開閉時のコールバック */
  onOpenChange?: (open: boolean) => void
  /** Popoverコンテンツにマウスが入った時のコールバック */
  onPopoverMouseEnter?: () => void
  /** カラムのユニーク値（textタイプで10個以下の場合に複数選択UIを表示） */
  uniqueValues?: string[]
}

export function ColumnFilter({
  column,
  columnType,
  onOpenChange,
  onPopoverMouseEnter,
  uniqueValues,
}: ColumnFilterProps) {
  const [open, setOpen] = useState(false)
  // Popoverを開く前の元の高さを保存
  const originalHeightRef = useRef<number | null>(null)
  // フィルタボタンのrefを取得して位置を計算
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)

    // Popover開閉時にiframeの高さを調整
    if (newOpen) {
      // フィルタタイプに応じたPopover高さを推定
      let estimatedPopoverHeight = 120 // デフォルト（ヘッダ + 小さいコンテンツ）
      if (columnType === 'text' && uniqueValues && uniqueValues.length > 0) {
        estimatedPopoverHeight = 380 // テキスト複数選択（ScrollArea 192px + その他）
      } else if (columnType === 'select') {
        estimatedPopoverHeight = 380 // セレクト複数選択（ScrollArea 192px + その他）
      } else if (columnType === 'number') {
        estimatedPopoverHeight = 200 // 数値範囲（入力欄2つ + その他）
      } else if (columnType === 'date') {
        estimatedPopoverHeight = 200 // 日付範囲（入力欄2つ + その他）
      } else if (columnType === 'text') {
        estimatedPopoverHeight = 120 // テキスト検索のみ
      }

      // ボタンの位置を取得して、利用可能なスペースを計算
      const buttonRect = buttonRef.current?.getBoundingClientRect()
      if (buttonRect) {
        const availableSpace = window.innerHeight - buttonRect.bottom
        // スペースが足りない場合のみ高さを調整
        if (availableSpace < estimatedPopoverHeight) {
          const shortfall = estimatedPopoverHeight - availableSpace + 20 // 20pxの余裕
          originalHeightRef.current = document.body.scrollHeight
          Streamlit.setFrameHeight(originalHeightRef.current + shortfall)
        }
      }
    } else {
      // 閉じたときは元の高さに戻す
      if (originalHeightRef.current !== null) {
        Streamlit.setFrameHeight(originalHeightRef.current)
        originalHeightRef.current = null
      }
    }
  }

  // iframe外クリック（Streamlitページ外）でダイアログを閉じる
  useEffect(() => {
    const handleWindowBlur = () => {
      if (open) {
        setOpen(false)
        // ダイアログを閉じたときにiframeの高さを元に戻す
        if (originalHeightRef.current !== null) {
          Streamlit.setFrameHeight(originalHeightRef.current)
          originalHeightRef.current = null
        } else {
          Streamlit.setFrameHeight()
        }
      }
    }

    window.addEventListener('blur', handleWindowBlur)
    return () => window.removeEventListener('blur', handleWindowBlur)
  }, [open])

  const filterValue = column.getFilterValue()
  const isFiltered = !!column.getFilterValue()

  // filterValueがオブジェクト（multiselect）かstring（テキスト検索）かを判定
  const isMultiselectFilter =
    typeof filterValue === 'object' &&
    (filterValue as any)?.type === 'multiselect'
  const textSearchValue = isMultiselectFilter
    ? ''
    : ((filterValue as string) ?? '')

  // テキストフィルタの複数選択状態（ユニーク値選択用）
  // filterValueから初期値を取得
  const initialSelectedValues = isMultiselectFilter
    ? ((filterValue as any).values as string[])
    : []
  const [selectedUniqueValues, setSelectedUniqueValues] = useState<string[]>(
    initialSelectedValues,
  )

  // filterValueが変更されたら、selectedUniqueValuesも更新
  useEffect(() => {
    if (isMultiselectFilter) {
      setSelectedUniqueValues((filterValue as any).values as string[])
    } else {
      setSelectedUniqueValues([])
    }
  }, [filterValue, isMultiselectFilter])

  const setTextFilterValue = (value: string) => {
    // テキスト検索を入力したら複数選択をクリア
    setSelectedUniqueValues([])
    // 空文字の場合はundefinedを設定してフィルタを解除
    column.setFilterValue(value || undefined)
  }

  const setSelectedValuesFilter = (values: string[]) => {
    setSelectedUniqueValues(values)
    // 選択された値がある場合はフィルタを設定、ない場合はクリア
    if (values.length > 0) {
      column.setFilterValue({ type: 'multiselect', values })
    } else {
      column.setFilterValue(undefined)
    }
  }

  const setNumberRangeFilterValue = (
    value: [number | undefined, number | undefined],
  ) => {
    // 両方undefinedの場合はundefinedを設定してフィルタを解除
    if (value[0] === undefined && value[1] === undefined) {
      column.setFilterValue(undefined)
    } else {
      column.setFilterValue(value)
    }
  }

  const setDateRangeFilterValue = (
    value: [Date | undefined, Date | undefined],
  ) => {
    // 両方undefinedの場合はundefinedを設定してフィルタを解除
    if (value[0] === undefined && value[1] === undefined) {
      column.setFilterValue(undefined)
    } else {
      column.setFilterValue(value)
    }
  }

  const renderFilter = () => {
    switch (columnType) {
      case 'text':
        return (
          <TextFilter
            value={textSearchValue}
            onChange={setTextFilterValue}
            placeholder="検索..."
            uniqueValues={uniqueValues}
            selectedValues={selectedUniqueValues}
            onSelectedValuesChange={setSelectedValuesFilter}
          />
        )
      case 'number':
        return (
          <NumberRangeFilter
            value={
              (filterValue as [number | undefined, number | undefined]) ?? [
                undefined,
                undefined,
              ]
            }
            onChange={setNumberRangeFilterValue}
          />
        )
      case 'date':
        return (
          <DateRangeFilter
            value={
              (filterValue as [Date | undefined, Date | undefined]) ?? [
                undefined,
                undefined,
              ]
            }
            onChange={setDateRangeFilterValue}
          />
        )
      case 'select':
        // selectタイプは複数選択のみ（検索機能付き）
        return (
          <TextFilter
            value={textSearchValue}
            onChange={setTextFilterValue}
            placeholder="検索..."
            uniqueValues={uniqueValues}
            selectedValues={selectedUniqueValues}
            onSelectedValuesChange={setSelectedValuesFilter}
          />
        )
      default:
        return (
          <p className="text-muted-foreground text-sm">
            このフィルタタイプは未実装です
          </p>
        )
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => e.stopPropagation()} // ソートのトリガーを防止
          className={cn(
            'relative cursor-pointer rounded p-1 transition-all',
            isFiltered
              ? 'bg-red-50 text-red-600 hover:text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:hover:text-red-300'
              : 'text-gray-400 opacity-60 hover:text-red-500 hover:opacity-100 dark:text-gray-500 dark:hover:text-red-400',
          )}
          aria-label="フィルタ"
        >
          <Filter
            className="size-4"
            strokeWidth={isFiltered ? 3 : 2}
            fill={isFiltered ? 'currentColor' : 'none'}
          />
          {/* フィルタ適用時のバッジ（小さい赤い点） */}
          {isFiltered && (
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-red-500 dark:bg-red-400" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-72"
        onClick={(e) => e.stopPropagation()} // ソートのトリガーを防止
        onMouseEnter={onPopoverMouseEnter} // ヘッダのホバー状態をクリア
        collisionPadding={10} // 画面端から10pxの余白を確保
        sideOffset={5}
        avoidCollisions={true} // 自動的に位置を調整
      >
        <div className="space-y-2">
          <h4 className="text-sm font-medium">フィルタ</h4>
          {renderFilter()}
        </div>
      </PopoverContent>
    </Popover>
  )
}
