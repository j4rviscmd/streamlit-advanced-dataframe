import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

/**
 * テキストフィルタコンポーネント
 *
 * 特徴:
 * - デバウンス処理（300ms）で入力パフォーマンスを最適化
 * - クリアボタン（×）で簡単にリセット可能
 * - 親コンポーネントからの値変更に対応
 * - オプション: ユニーク値が10個以下の場合、複数選択チェックボックスを表示
 */
interface TextFilterProps {
  /** 現在のフィルタ値（テキスト検索の場合） */
  value: string
  /** フィルタ値変更時のコールバック */
  onChange: (value: string) => void
  /** プレースホルダーテキスト（デフォルト: "検索..."） */
  placeholder?: string
  /** ユニーク値（10個以下の場合に複数選択UIを表示） */
  uniqueValues?: string[]
  /** 選択されたユニーク値 */
  selectedValues?: string[]
  /** 選択されたユニーク値変更時のコールバック */
  onSelectedValuesChange?: (values: string[]) => void
}

export function TextFilter({
  value,
  onChange,
  placeholder = '検索...',
  uniqueValues,
  selectedValues = [],
  onSelectedValuesChange,
}: TextFilterProps) {
  // ローカル状態で即座に入力を反映し、デバウンス後に親に通知
  const [localValue, setLocalValue] = useState(value)

  // 親からの値変更を反映（例: フィルタクリア時）
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // 300msのデバウンス処理
  const debouncedOnChange = useDebouncedCallback((newValue: string) => {
    onChange(newValue)
  }, 300)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    debouncedOnChange(newValue)
  }

  const handleClear = () => {
    setLocalValue('')
    onChange('')
  }

  const handleToggleValue = (toggleValue: string) => {
    if (!onSelectedValuesChange) return

    const newSelectedValues = selectedValues.includes(toggleValue)
      ? selectedValues.filter((v) => v !== toggleValue)
      : [...selectedValues, toggleValue]

    onSelectedValuesChange(newSelectedValues)
  }

  const handleSelectAll = () => {
    if (!onSelectedValuesChange || !uniqueValues) return
    onSelectedValuesChange(uniqueValues)
  }

  const handleClearSelection = () => {
    if (!onSelectedValuesChange) return
    onSelectedValuesChange([])
  }

  const hasUniqueValues = uniqueValues && uniqueValues.length > 0
  const allSelected =
    hasUniqueValues && selectedValues.length === uniqueValues.length

  return (
    <div className="space-y-3">
      {/* テキスト検索 */}
      <div className="relative">
        <Input
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="pr-8"
        />
        {localValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="フィルタをクリア"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* 複数選択チェックボックスリスト（ユニーク値が10個以下の場合のみ表示） */}
      {hasUniqueValues && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">値を選択:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                disabled={allSelected}
              >
                すべて選択
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                disabled={selectedValues.length === 0}
              >
                クリア
              </button>
            </div>
          </div>

          <ScrollArea className="h-48">
            <div className="space-y-1 pr-4">
              {uniqueValues.map((uniqueValue) => (
                <label
                  key={uniqueValue}
                  htmlFor={`filter-${uniqueValue}`}
                  className="flex items-center gap-3 w-full px-2 py-1.5 rounded cursor-pointer select-none hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`filter-${uniqueValue}`}
                    checked={selectedValues.includes(uniqueValue)}
                    onCheckedChange={() => handleToggleValue(uniqueValue)}
                    className="data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500 dark:data-[state=checked]:border-red-400 dark:data-[state=checked]:bg-red-400"
                  />
                  <span className="text-sm flex-1">{uniqueValue}</span>
                </label>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
