/**
 * フィルタ状態表示コンポーネント
 *
 * フィルタ適用時に「全100件中25件を表示」のような情報を表示します。
 */
interface FilterStatusProps {
  /** 総行数 */
  totalRows: number
  /** フィルタ後の行数 */
  filteredRows: number
  /** フィルタが適用されているかどうか */
  isFiltered: boolean
}

export function FilterStatus({
  totalRows,
  filteredRows,
  isFiltered,
}: FilterStatusProps) {
  // フィルタが適用されていない場合は何も表示しない
  if (!isFiltered) {
    return null
  }

  return (
    <div className="flex items-center justify-between px-1 py-2">
      <p className="text-sm text-muted-foreground">
        全{totalRows.toLocaleString()}件中
        <span className="font-medium text-foreground mx-1">
          {filteredRows.toLocaleString()}件
        </span>
        を表示
      </p>
    </div>
  )
}
