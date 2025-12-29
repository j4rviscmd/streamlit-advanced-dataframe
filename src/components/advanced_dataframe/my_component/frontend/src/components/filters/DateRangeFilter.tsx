import { Input } from '@/components/ui/input'
import { format, isValid, parse } from 'date-fns'
import { X } from 'lucide-react'
import { useState } from 'react'

/**
 * 日付範囲フィルタコンポーネント
 *
 * 特徴:
 * - 開始日・終了日を個別に選択可能
 * - テキスト入力のみ（YYYY-MM-DD形式）
 * - フォーカスを外したときにバリデーション実行（onBlur）
 * - 個別クリアボタン（×）とすべてクリアボタン
 */
interface DateRangeFilterProps {
  /** 現在のフィルタ値 [開始日, 終了日] */
  value: [Date | undefined, Date | undefined]
  /** フィルタ値変更時のコールバック */
  onChange: (value: [Date | undefined, Date | undefined]) => void
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  // ローカル状態（入力値をそのまま保持）
  const [startInputValue, setStartInputValue] = useState(
    value[0] ? format(value[0], 'yyyy-MM-dd') : '',
  )
  const [endInputValue, setEndInputValue] = useState(
    value[1] ? format(value[1], 'yyyy-MM-dd') : '',
  )

  // エラー状態
  const [startError, setStartError] = useState<string | null>(null)
  const [endError, setEndError] = useState<string | null>(null)

  // 開始日の入力
  const handleStartInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartInputValue(e.target.value)
    // 入力中はエラーをクリア
    setStartError(null)
  }

  // 開始日のフォーカスアウト時にバリデーション
  const handleStartBlur = () => {
    if (startInputValue === '') {
      setStartError(null)
      onChange([undefined, value[1]])
      return
    }

    const parsed = parse(startInputValue, 'yyyy-MM-dd', new Date())
    if (isValid(parsed)) {
      setStartError(null)
      onChange([parsed, value[1]])
      // 有効な日付の場合はフォーマット済みの値で上書き
      setStartInputValue(format(parsed, 'yyyy-MM-dd'))
    } else {
      // 無効な日付の場合はエラーメッセージを表示（入力値は保持）
      setStartError('無効な日付形式です（YYYY-MM-DD）')
    }
  }

  // 終了日の入力
  const handleEndInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndInputValue(e.target.value)
    // 入力中はエラーをクリア
    setEndError(null)
  }

  // 終了日のフォーカスアウト時にバリデーション
  const handleEndBlur = () => {
    if (endInputValue === '') {
      setEndError(null)
      onChange([value[0], undefined])
      return
    }

    const parsed = parse(endInputValue, 'yyyy-MM-dd', new Date())
    if (isValid(parsed)) {
      setEndError(null)
      onChange([value[0], parsed])
      // 有効な日付の場合はフォーマット済みの値で上書き
      setEndInputValue(format(parsed, 'yyyy-MM-dd'))
    } else {
      // 無効な日付の場合はエラーメッセージを表示（入力値は保持）
      setEndError('無効な日付形式です（YYYY-MM-DD）')
    }
  }

  // すべてクリア
  const handleClear = () => {
    setStartInputValue('')
    setEndInputValue('')
    setStartError(null)
    setEndError(null)
    onChange([undefined, undefined])
  }

  const hasValue = startInputValue !== '' || endInputValue !== ''

  return (
    <div className="space-y-3">
      {/* 開始日 */}
      <div className="space-y-1">
        <label className="text-sm font-medium">開始日</label>
        <div className="relative">
          <Input
            type="text"
            value={startInputValue}
            onChange={handleStartInputChange}
            onBlur={handleStartBlur}
            placeholder="YYYY-MM-DD"
            className="pr-8"
          />
          {/* クリアボタン */}
          {startInputValue && (
            <button
              type="button"
              onClick={() => {
                setStartInputValue('')
                setStartError(null)
                onChange([undefined, value[1]])
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="開始日をクリア"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {/* エラーメッセージ */}
        {startError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {startError}
          </p>
        )}
      </div>

      {/* 終了日 */}
      <div className="space-y-1">
        <label className="text-sm font-medium">終了日</label>
        <div className="relative">
          <Input
            type="text"
            value={endInputValue}
            onChange={handleEndInputChange}
            onBlur={handleEndBlur}
            placeholder="YYYY-MM-DD"
            className="pr-8"
          />
          {/* クリアボタン */}
          {endInputValue && (
            <button
              type="button"
              onClick={() => {
                setEndInputValue('')
                setEndError(null)
                onChange([value[0], undefined])
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="終了日をクリア"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {/* エラーメッセージ */}
        {endError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {endError}
          </p>
        )}
      </div>

      {/* すべてクリア */}
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
