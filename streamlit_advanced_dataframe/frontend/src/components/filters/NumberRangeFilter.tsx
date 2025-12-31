import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { Input } from '@/components/ui/input'

/**
 * 数値範囲フィルタコンポーネント
 *
 * 特徴:
 * - 最小値・最大値の範囲指定
 * - デバウンス処理（300ms）で入力パフォーマンスを最適化
 * - クリアボタン（×）で簡単にリセット可能
 * - 親コンポーネントからの値変更に対応
 */
interface NumberRangeFilterProps {
  /** 現在のフィルタ値 [min, max] */
  value: [number | undefined, number | undefined]
  /** フィルタ値変更時のコールバック */
  onChange: (value: [number | undefined, number | undefined]) => void
}

export function NumberRangeFilter({ value, onChange }: NumberRangeFilterProps) {
  // ローカル状態で即座に入力を反映し、デバウンス後に親に通知
  const [localMin, setLocalMin] = useState<string>(
    value[0] !== undefined ? String(value[0]) : '',
  )
  const [localMax, setLocalMax] = useState<string>(
    value[1] !== undefined ? String(value[1]) : '',
  )

  // 親からの値変更を反映（例: フィルタクリア時）
  useEffect(() => {
    setLocalMin(value[0] !== undefined ? String(value[0]) : '')
    setLocalMax(value[1] !== undefined ? String(value[1]) : '')
  }, [value])

  // 300msのデバウンス処理
  const debouncedOnChange = useDebouncedCallback(
    (min: number | undefined, max: number | undefined) => {
      onChange([min, max])
    },
    300,
  )

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalMin(newValue)

    const numValue = newValue === '' ? undefined : Number(newValue)
    const maxValue = localMax === '' ? undefined : Number(localMax)
    debouncedOnChange(numValue, maxValue)
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalMax(newValue)

    const minValue = localMin === '' ? undefined : Number(localMin)
    const numValue = newValue === '' ? undefined : Number(newValue)
    debouncedOnChange(minValue, numValue)
  }

  const handleClear = () => {
    setLocalMin('')
    setLocalMax('')
    onChange([undefined, undefined])
  }

  const hasValue = localMin !== '' || localMax !== ''

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type="number"
          value={localMin}
          onChange={handleMinChange}
          placeholder="最小値"
          className="pr-8"
        />
        {localMin && (
          <button
            type="button"
            onClick={() => {
              setLocalMin('')
              const maxValue = localMax === '' ? undefined : Number(localMax)
              onChange([undefined, maxValue])
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="最小値をクリア"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="relative">
        <Input
          type="number"
          value={localMax}
          onChange={handleMaxChange}
          placeholder="最大値"
          className="pr-8"
        />
        {localMax && (
          <button
            type="button"
            onClick={() => {
              setLocalMax('')
              const minValue = localMin === '' ? undefined : Number(localMin)
              onChange([minValue, undefined])
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="最大値をクリア"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          すべてクリア
        </button>
      )}
    </div>
  )
}
