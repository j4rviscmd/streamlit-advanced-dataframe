import { AdvancedDataFrame } from '@/components/AdvancedDataFrame'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useStreamlitTheme } from '@/hooks/useStreamlitTheme'
import { StreamlitProps } from '@/types/table'
import { useEffect, useMemo } from 'react'
import { Streamlit } from 'streamlit-component-lib'
import { useRenderData } from 'streamlit-component-lib-react-hooks'

/**
 * MyComponent - Streamlitとの連携エントリーポイント
 * Pythonから渡されたpropsをAdvancedDataFrameに渡す
 */
function MyComponent() {
  const renderData = useRenderData()
  const { isDark } = useStreamlitTheme()

  // Pythonから渡された引数を取得（useMemoで参照を安定化）
  const data = useMemo(
    () => renderData.args['data'] || [],
    [renderData.args],
  )
  const columns = useMemo(
    () => renderData.args['columns'] || [],
    [renderData.args],
  )
  const height = renderData.args['height']
  const useContainerWidth = renderData.args['use_container_width']
  const selectionMode = renderData.args['selection_mode']
  const showRowCount = renderData.args['show_row_count']
  const columnOrder = renderData.args['column_order']
  const headerGroups = renderData.args['header_groups']
  const expandable = renderData.args['expandable']
  const subRowsKey = renderData.args['sub_rows_key']
  const showSummary = renderData.args['show_summary']

  // StreamlitPropsに変換
  const props: StreamlitProps = {
    data,
    columns,
    height,
    useContainerWidth,
    selectionMode,
    showRowCount,
    columnOrder,
    headerGroups,
    expandable,
    subRowsKey,
    showSummary,
  }

  // コンポーネントマウント時にフレーム高さを通知（遅延実行で確実にレンダリング後に実行）
  useEffect(() => {
    // 初回マウント時に即座に高さを設定
    Streamlit.setFrameHeight()
    // 少し遅延してもう一度設定（レンダリング完了を確実にするため）
    const timer = setTimeout(() => {
      Streamlit.setFrameHeight()
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  // データやpropsが変わった時にStreamlitにフレームの高さを通知
  useEffect(() => {
    Streamlit.setFrameHeight()
  }, [data, columns, height, expandable, showRowCount])

  // Streamlitテーマに応じて.darkクラスを適用（shadcn/ui用）
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <ErrorBoundary>
      <AdvancedDataFrame {...props} />
    </ErrorBoundary>
  )
}

export default MyComponent
