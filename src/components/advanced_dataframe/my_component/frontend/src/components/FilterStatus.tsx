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
  return (
    <div className="flex items-center justify-between px-1 py-2">
      <p className="text-sm text-muted-foreground">
        {isFiltered ? (
          <>
            全{totalRows.toLocaleString()}件中
            <span className="font-medium text-foreground mx-1">
              {filteredRows.toLocaleString()}件
            </span>
            を表示
          </>
        ) : (
          <>
            全
            <span className="font-medium text-foreground mx-1">
              {totalRows.toLocaleString()}件
            </span>
            を表示
          </>
        )}
      </p>
    </div>
  )
}
