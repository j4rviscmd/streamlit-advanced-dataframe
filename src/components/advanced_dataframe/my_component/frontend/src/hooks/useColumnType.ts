import { ColumnConfig, ColumnType, ColumnTypeMap, RowData } from '@/types/table'
import { useMemo } from 'react'

/**
 * カラムタイプを判定するフック
 *
 * 判定ロジック:
 * 1. columns_jsonでfilter_typeが明示的に指定されている場合はそれを使用
 * 2. 指定がない場合は以下の順で自動判定:
 *    - すべて数値 → 'number'
 *    - すべて日付形式 → 'date'
 *    - ユニーク値が5個以下 → 'select'
 *    - それ以外 → 'text'
 */
export function useColumnType(
  data: RowData[],
  columns: ColumnConfig[],
): ColumnTypeMap {
  return useMemo(() => {
    const typeMap = new Map<string, ColumnType>()

    columns.forEach((col) => {
      // 明示的な指定がある場合はそれを使用
      if (col.filterConfig?.type) {
        typeMap.set(col.id, col.filterConfig.type)
        return
      }

      // フィルタが無効な場合はスキップ
      if (!col.filterConfig?.enabled) {
        return
      }

      // データから値を取得（nullを除く）
      const values = data
        .map((row) => row[col.id])
        .filter((val) => val != null && val !== '')

      if (values.length === 0) {
        typeMap.set(col.id, 'text')
        return
      }

      // 数値判定
      const allNumeric = values.every((val) => typeof val === 'number')
      if (allNumeric) {
        typeMap.set(col.id, 'number')
        return
      }

      // 日付判定（ISO 8601形式またはDate型）
      const allDates = values.every((val) => {
        if (val instanceof Date) return true
        if (typeof val === 'string') {
          // ISO 8601形式: YYYY-MM-DD または YYYY-MM-DDTHH:mm:ss
          const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/
          return dateRegex.test(val)
        }
        return false
      })
      if (allDates) {
        typeMap.set(col.id, 'date')
        return
      }

      // ユニーク値の数をカウント
      const uniqueValues = new Set(values.map(String))
      if (uniqueValues.size <= 5) {
        typeMap.set(col.id, 'select')
        return
      }

      // デフォルトはテキスト
      typeMap.set(col.id, 'text')
    })

    return typeMap
  }, [data, columns])
}
