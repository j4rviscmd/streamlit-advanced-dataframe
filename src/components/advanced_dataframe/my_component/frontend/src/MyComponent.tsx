import { AdvancedDataFrame } from '@/components/AdvancedDataFrame'
import { useStreamlitTheme } from '@/hooks/useStreamlitTheme'
import { StreamlitProps } from '@/types/table'
import { useEffect } from 'react'
import { Streamlit } from 'streamlit-component-lib'
import { useRenderData } from 'streamlit-component-lib-react-hooks'

/**
 * MyComponent - Streamlitとの連携エントリーポイント
 * Pythonから渡されたpropsをAdvancedDataFrameに渡す
 */
function MyComponent() {
  const renderData = useRenderData()
  const { isDark } = useStreamlitTheme()

  // Pythonから渡された引数を取得
  const data = renderData.args['data'] || []
  const columns = renderData.args['columns'] || []
  const height = renderData.args['height']
  const fullWidth = renderData.args['full_width']
  const enableRowSelection = renderData.args['enable_row_selection']
  const showFilterRecords = renderData.args['show_filter_records']
  const visibleColumns = renderData.args['visible_columns']
  const columnGroups = renderData.args['column_groups']
  const expandable = renderData.args['expandable']
  const subRowsKey = renderData.args['sub_rows_key']

  // StreamlitPropsに変換
  const props: StreamlitProps = {
    data,
    columns,
    height,
    fullWidth,
    enableRowSelection,
    showFilterRecords,
    visibleColumns,
    columnGroups,
    expandable,
    subRowsKey,
  }

  // データやpropsが変わった時にStreamlitにフレームの高さを通知
  useEffect(() => {
    Streamlit.setFrameHeight()
  }, [data, columns, height, expandable, showFilterRecords])

  // Streamlitテーマに応じて.darkクラスを適用（shadcn/ui用）
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return <AdvancedDataFrame {...props} />
}

export default MyComponent
